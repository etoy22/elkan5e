// Wrappers around the Midi-QOL API calls the module makes. Each one uses Midi-QOL when it's active
// and falls back to plain dnd5e when it isn't, so automation keeps working without Midi.

import { applyDamageAsGM, measureRangeDistance, rollSkillForOwner, t } from "./helpers.mjs";

/**
 * Whether Midi-QOL is active and its API is loaded.
 *
 * @returns {boolean}
 */
export const isMidiActive = () =>
	Boolean(game.modules.get("midi-qol")?.active && globalThis.MidiQOL);

/**
 * Deals damage or healing outside of an item roll (Midi-QOL's DamageOnlyWorkflow). Without Midi,
 * posts the roll to chat and applies the total to each target, relaying to the GM for targets the
 * user doesn't own.
 *
 * @param {Actor} actor - Actor dealing the damage.
 * @param {Token} token - Token of that actor.
 * @param {number} total - Amount of damage or healing.
 * @param {string} type - Damage type, or "healing".
 * @param {Token[]} targets - Tokens receiving it.
 * @param {Roll} roll - Evaluated roll the total came from.
 * @param {object} [options] - DamageOnlyWorkflow options; `flavor` is used for the chat card.
 * @returns {Promise<void>}
 */
export async function damageOnly(actor, token, total, type, targets, roll, options = {}) {
	if (isMidiActive()) {
		new MidiQOL.DamageOnlyWorkflow(actor, token, total, type, targets, roll, options);
		return;
	}
	await roll.toMessage({
		flavor: options.flavor,
		speaker: ChatMessage.getSpeaker({ actor, token: token?.document ?? token }),
	});
	for (const target of targets) {
		const targetActor = target?.actor ?? target?.document?.actor;
		if (targetActor) await applyDamageAsGM(targetActor, [{ value: total, type }]);
	}
}

/**
 * The token an actor is using on the current scene.
 *
 * @param {Actor} actor - Actor to find a token for.
 * @returns {Token|undefined}
 */
export function tokenForActor(actor) {
	if (isMidiActive()) return MidiQOL.tokenForActor(actor);
	return actor?.token?.object ?? actor?.getActiveTokens()?.[0];
}

/**
 * Distance between two tokens, ignoring walls.
 *
 * @param {Token} a - First token.
 * @param {Token} b - Second token.
 * @returns {number} Distance in scene units.
 */
export function computeDistance(a, b) {
	if (isMidiActive()) return MidiQOL.computeDistance(a, b, { wallsBlock: false });
	return measureRangeDistance(a, b);
}

/**
 * Whether one token can see another. Without Midi, tests the viewer's detection modes against the
 * target the same way core vision does. Returns true when that can't be worked out, so callers
 * don't impose penalties on a guess.
 *
 * @param {Token} viewer - Token looking.
 * @param {Token} target - Token being looked at.
 * @returns {boolean}
 */
export function canSee(viewer, target) {
	if (isMidiActive() && typeof MidiQOL.canSee === "function")
		return MidiQOL.canSee(viewer, target);
	try {
		const vision = viewer?.vision;
		if (!canvas.visibility?.tokenVision || !vision?.active || !target) return true;
		const config = canvas.visibility._createVisibilityTestConfig(
			target.document.getVisibilityTestPoints(),
			{ tolerance: 0, object: target },
		);
		const modes = CONFIG.Canvas.detectionModes;
		for (const [id, mode] of Object.entries(viewer.document.detectionModes ?? {})) {
			if (modes[id]?.testVisibility(vision, mode, config)) return true;
		}
		return false;
	} catch (error) {
		console.warn("Elkan 5e | Couldn't test token vision:", error);
		return true;
	}
}

/**
 * Uses an activity against specific creatures without a configuration dialog. Without Midi, the
 * user's targets are swapped for those creatures while the activity is used, then put back.
 *
 * @param {Activity} activity - Activity to use.
 * @param {string[]} targetUuids - Token document UUIDs to target.
 * @param {object} [midiOptions] - Extra Midi-QOL workflow options.
 * @returns {Promise<*>}
 */
export async function completeActivityUse(activity, targetUuids, midiOptions = {}) {
	if (isMidiActive()) {
		return MidiQOL.completeActivityUse(
			activity,
			{ midiOptions: { targetUuids, ignoreUserTargets: true, ...midiOptions } },
			{ configure: false },
		);
	}
	const ids = targetUuids
		.map((uuid) => fromUuidSync(uuid, { strict: false })?.id)
		.filter(Boolean);
	return withTargets(ids, () => activity.use({}, { configure: false }));
}

/**
 * Targets the given tokens while a callback runs, then restores the user's previous targets.
 *
 * @param {string[]} tokenIds - Ids of the tokens to target.
 * @param {Function} callback - Work to do while they're targeted.
 * @returns {Promise<*>} The callback's result.
 * @throws {Error} If the callback fails; restoration of previous targets is attempted first.
 */
export async function withTargets(tokenIds, callback) {
	const previous = Array.from(game.user.targets).map((token) => token.id);
	canvas.tokens.setTargets(tokenIds);
	try {
		return await callback();
	} finally {
		canvas.tokens.setTargets(previous);
	}
}

/**
 * Rolls one side of a contest without a dialog.
 *
 * @param {object} side - Midi-QOL contestedRoll side ({ token, rollType, ability, rollOptions }).
 * @param {string} flavor - Chat flavor text.
 * @returns {Promise<number|null>} The roll total.
 */
async function rollContestSide(side, flavor) {
	const actor = side.token?.actor;
	if (!actor) return null;
	const advantage = Boolean(side.rollOptions?.advantage);
	if (side.rollType === "skill")
		return rollSkillForOwner(actor, side.ability, { advantage, flavor });
	const rolls = await actor.rollAbilityCheck(
		{ ability: side.ability, advantage },
		{ configure: false },
		{ data: { flavor } },
	);
	return rolls?.[0]?.total ?? null;
}

/**
 * Runs a contested roll (Midi-QOL's contestedRoll). Without Midi, both sides roll, the target's
 * owner rolling skill checks, and `success` runs when the source's total beats the target's.
 * Ties go to the target. No outcome callback runs if either side returns no roll total.
 *
 * @param {object} config - Midi-QOL contestedRoll options.
 * @param {object} config.source - Contesting side.
 * @param {object} config.target - Defending side.
 * @param {string} [config.flavor] - Chat flavor text.
 * @param {Function} [config.success] - Called when the source wins.
 * @param {Function} [config.failure] - Called when the target wins.
 * @param {boolean} [config.displayResults] - Whether to post the outcome to chat.
 * @returns {Promise<*>}
 */
export async function contestedRoll(config) {
	if (isMidiActive()) return MidiQOL.contestedRoll(config);
	const { source, target, flavor, success, failure, displayResults } = config;
	const sourceTotal = await rollContestSide(source, flavor);
	const targetTotal = await rollContestSide(target, flavor);
	if (sourceTotal === null || targetTotal === null) return;
	const won = sourceTotal > targetTotal;
	if (displayResults) {
		await ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ token: source.token.document }),
			content: `<p>${t(won ? "elkan5e.contest.won" : "elkan5e.contest.lost", {
				source: source.token.name,
				target: target.token.name,
				sourceTotal,
				targetTotal,
			})}</p>`,
		});
	}
	await (won ? success : failure)?.();
}
