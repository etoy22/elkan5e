import { offerItemUse, t } from "../shared/helpers.mjs";

/**
 * Finds an actor's item by identifier, if it has a use left.
 *
 * @param {Actor} actor - Actor to search.
 * @param {string} identifier - Item identifier.
 * @returns {Item|null}
 */
function readyItem(actor, identifier) {
	const item = actor?.items.find((i) => i.system?.identifier === identifier);
	return item?.system.uses?.value > 0 ? item : null;
}

/**
 * Whether an actor is able to take a reaction right now.
 *
 * @param {Actor} actor - Actor to check.
 * @returns {boolean}
 */
function canReact(actor) {
	const midi = globalThis.MidiQOL;
	if (midi?.checkIncapacitated?.(actor, false, false)) return false;
	return !(game.combat && midi?.hasUsedReaction?.(actor));
}

/**
 * Sailor's Vigilance: after a creature with the feature rolls initiative, offers to reroll it,
 * keeping the higher result.
 *
 * @param {ChatMessage} message - Created chat message.
 * @param {string} userId - Id of the user who created the message.
 * @returns {Promise<void>}
 */
export async function sailorVigilance(message, userId) {
	if (userId !== game.user.id || !message.getFlag("core", "initiativeRoll")) return;
	const combat = game.combat;
	const { token: tokenId, actor: actorId } = message.speaker ?? {};
	const combatant = combat?.combatants.find((c) =>
		tokenId ? c.tokenId === tokenId : c.actorId === actorId,
	);
	const actor = combatant?.actor;
	const item = readyItem(actor, "sailors-vigilance");
	if (!item || !canReact(actor) || combatant.initiative === null) return;

	const current = combatant.initiative;
	const used = await offerItemUse(
		item,
		t("elkan5e.background.sailorsVigilancePrompt", { name: actor.name, total: current }),
		{ reaction: true },
	);
	if (!used) return;

	const roll = combatant.getInitiativeRoll();
	await roll.evaluate();
	const best = Math.max(current, roll.total);
	if (best !== current) await combatant.update({ initiative: best });
	await roll.toMessage({
		speaker: message.speaker,
		flavor: t("elkan5e.background.sailorsVigilanceResult", { item: item.name, total: best }),
	});
}
