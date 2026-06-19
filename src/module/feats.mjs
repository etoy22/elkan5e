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

/**
 * Handles Relentless Endurance.
 * Triggered by the dnd5e.damageActor hook after damage has been applied.
 *
 * @param {Actor5e} actor - Actor document that was damaged.
 * @returns {Promise<void>}
 */
export async function relentlessEndurance(actor) {
	if (!actor) return;
	if (Number(actor.system?.attributes?.hp?.value) !== 0) return;

	const feature = actor.items.find(
		(item) =>
			item.system?.identifier === "relentless-endurance" &&
			item.system?.source?.book === "Elkan 5e",
	);
	if (!feature) return;

	const max = Number(feature.system?.uses?.max ?? 0);
	const spent = Number(feature.system?.uses?.spent ?? 0);
	const remaining = max > 0 ? Math.max(max - spent, 0) : 0;
	if (remaining <= 0) return;

	const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
	const promptUser =
		game.users.find((u) => u.active && !u.isGM && actor.testUserPermission(u, ownerLevel)) ??
		game.users.find((u) => u.active && u.isGM) ??
		null;
	if (!promptUser || promptUser.id !== game.user?.id) return;

	const confirmed = await DialogV2.confirm({
		window: { title: "Relentless Endurance" },
		content: `<p><strong>${actor.name}</strong> would drop to 0 HP. Use Relentless Endurance to drop to 1 HP instead? (${remaining} use${remaining === 1 ? "" : "s"} remaining)</p>`,
		rejectClose: false,
		modal: true,
	});

	if (!confirmed) return;

	await actor.update({ "system.attributes.hp.value": 1 });
	await feature.update({ "system.uses.spent": Math.min(spent + 1, max) });
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
