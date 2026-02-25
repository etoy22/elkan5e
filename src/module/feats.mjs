const DialogV2 = foundry.applications.api.DialogV2;
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
 * Prompt and apply Relentless Endurance when an actor reaches 0 HP.
 *
 * @param {Actor} actor - The actor being updated.
 * @param {object} changes - The update payload for the actor.
 * @returns {Promise<void>}
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
 * Modify hit die rolls for characters with Undead Nature.
 *
 * Subtracts the Constitution modifier from the first hit die roll when the
 * actor has the Undead Nature feature but not the Gentle Repose effect.
 *
 * @param {object} config - The hit die roll configuration.
 * @param {Actor} config.subject - The actor rolling the hit die.
 * @returns {Promise<void>} Resolves once the configuration is updated.
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
