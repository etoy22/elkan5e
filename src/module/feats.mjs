const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Maps compendium item IDs to { identifier, repeatable }.
 * Populated once during the ready hook via initFeatIdentifierMap().
 *
 * @type {Map<string, {identifier: string, repeatable: boolean}>}
 */
const FEAT_INFO_MAP = new Map();

/**
 * Indexes all feat entries in elkan5e-feats so that the advancement filter
 * can match pool items to their identifiers without async compendium lookups
 * at render time.  Must be called after the game is ready.
 *
 * @returns {Promise<void>}
 */
export async function initFeatIdentifierMap() {
	const pack = game.packs.get("elkan5e.elkan5e-feats");
	if (!pack) {
		console.warn("Elkan 5e | initFeatIdentifierMap: elkan5e-feats pack not found");
		return;
	}
	try {
		// Include system.prerequisites so we can read the repeatable flag
		const index = await pack.getIndex({
			fields: ["system.identifier", "system.prerequisites"],
		});
		for (const entry of index) {
			const identifier = entry.system?.identifier;
			if (!identifier) continue;
			const repeatable = entry.system?.prerequisites?.repeatable === true;
			FEAT_INFO_MAP.set(entry._id, { identifier, repeatable });
		}
		console.log(`Elkan 5e | Indexed ${FEAT_INFO_MAP.size} feat identifiers`);
	} catch (error) {
		console.error("Elkan 5e | Error building feat identifier map:", error);
	}
}

/**
 * Hook callback for "renderApplication". Hides already-owned feats from
 * advancement choice dialogs. A feat is considered owned if the actor already
 * holds any item with the same system.identifier. Feats marked repeatable in
 * their prerequisites are always left visible.
 *
 * @param {Application} app  - The rendered application.
 * @param {HTMLElement|jQuery} html - The rendered HTML.
 */
export function onFilterOwnedFeats(app, html) {
	try {
		const actor = app.actor;
		if (!actor) return;

		// Build the set of feat identifiers already on this actor
		const ownedIdentifiers = new Set(
			actor.items
				.filter((i) => i.type === "feat")
				.map((i) => i.system?.identifier)
				.filter(Boolean),
		);
		if (ownedIdentifiers.size === 0) return;

		// Support both HTMLElement (FoundryVTT v12+ ApplicationV2) and jQuery
		const root = html instanceof HTMLElement ? html : html[0];
		if (!root) return;

		// dnd5e renders each pool item with a data-uuid attribute
		for (const el of root.querySelectorAll("[data-uuid]")) {
			const uuid = el.dataset.uuid;
			if (!uuid) continue;

			// The item ID is the last segment of the UUID
			const id = uuid.split(".").pop();
			const info = FEAT_INFO_MAP.get(id);
			if (!info) continue;

			// Skip feats that are explicitly marked as repeatable
			if (info.repeatable) continue;

			if (ownedIdentifiers.has(info.identifier)) {
				// Hide the whole row / card rather than just the anchor
				const row = el.closest("li, .item, tr, [class*='item-choice']") ?? el;
				row.style.display = "none";
			}
		}
	} catch (error) {
		console.error("Elkan 5e | Error filtering owned feats:", error);
	}
}

const RELENTLESS_IDENTIFIER = "relentless-endurance";
const RELENTLESS_PROMPTED = new Set();

const getUpdatedHpValue = (changes) => {
	const directValue = foundry.utils.getProperty(changes, "system.attributes.hp.value");
	if (directValue !== undefined) return directValue;

	const hpUpdate = foundry.utils.getProperty(changes, "system.attributes.hp");
	if (hpUpdate && typeof hpUpdate === "object" && hpUpdate.value !== undefined) {
		return hpUpdate.value;
	}

	return undefined;
};

const getPromptUser = (actor) => {
	if (!actor) return null;

	const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
	const activeOwners = game.users.filter(
		(user) => user.active && !user.isGM && actor.testUserPermission(user, ownerLevel),
	);
	if (activeOwners.length) return activeOwners[0];

	return game.users.find((user) => user.active && user.isGM) ?? null;
};

const getRelentlessFeature = (actor) =>
	actor?.items?.find((item) => item?.system?.identifier === RELENTLESS_IDENTIFIER);

const getRemainingUses = (item) => {
	const max = Number(item?.system?.uses?.max ?? 0);
	const spent = Number(item?.system?.uses?.spent ?? 0);
	if (!Number.isFinite(max) || max <= 0) return 0;
	if (!Number.isFinite(spent)) return 0;
	return Math.max(max - spent, 0);
};

/**
 * Handles relentless Endurance.
 *
 * @param {*} actor - Actor document to process.
 * @param {*} changes - Update payload containing changed fields.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function relentlessEndurance(actor, changes) {
	if (!actor || !changes) return;

	const updatedHp = getUpdatedHpValue(changes);
	if (updatedHp === undefined) return;

	const hpValue = Number(updatedHp);
	if (!Number.isFinite(hpValue)) return;

	if (hpValue > 0) {
		RELENTLESS_PROMPTED.delete(actor.uuid);
		return;
	}

	if (RELENTLESS_PROMPTED.has(actor.uuid)) return;

	const feature = getRelentlessFeature(actor);
	if (!feature || getRemainingUses(feature) <= 0) return;

	const promptUser = getPromptUser(actor);
	if (!promptUser || promptUser.id !== game.user?.id) return;

	RELENTLESS_PROMPTED.add(actor.uuid);

	const confirmed = await DialogV2.confirm({
		window: { title: game.i18n.localize("elkan5e.relentlessEndurance.title") },
		content: `<p>${game.i18n.format("elkan5e.relentlessEndurance.prompt", { name: actor.name })}</p>`,
		rejectClose: false,
		modal: true,
	});

	if (!confirmed) return;

	const max = Number(feature.system?.uses?.max ?? 0);
	const spent = Number(feature.system?.uses?.spent ?? 0);
	const nextSpent =
		Number.isFinite(max) && max > 0 ? Math.min(spent + 1, max) : Math.max(spent + 1, 1);

	await actor.update({ "system.attributes.hp.value": 1 });
	await feature.update({ "system.uses.spent": nextSpent });
}

/**
 * Handles undead Nature.
 *
 * @param {*} config - Configuration object.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function undeadNature(config) {
	const actor = config.subject;
	const HAS_UNDEAD_NATURE = actor.items.find((feature) => feature.name === "Undead Nature");
	const HAS_GENTLE_REPOSE = actor.effects.find((effect) => effect.name === "Gentle Repose");
	// Subtract Constitution modifier from hit die roll for undead characters without Gentle Repose
	if (HAS_UNDEAD_NATURE && !HAS_GENTLE_REPOSE) {
		config.rolls[0].parts[0] += "-@abilities.con.mod";
	}
}
