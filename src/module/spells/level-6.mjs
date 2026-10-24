import { isIncorporeal, removeStatuses, updateActorAsGM } from "../shared/helpers.mjs";

/** Conditions each healing spell cures, keyed by spell identifier. */
const HEALING_CURES = {
	heal: ["blinded", "deafened", "paralyzed", "poisoned", "weakened", "diseased"],
	"mass-heal": ["blinded", "deafened", "diseased"],
	"power-cure": [
		"diseased",
		"blinded",
		"charmed",
		"confused",
		"dazed",
		"deafened",
		"drained",
		"frightened",
		"goaded",
		"paralyzed",
		"petrified",
		"poisoned",
		"stunned",
		"weakened",
		"cursed",
	],
};

/**
 * Runs Heal, Mass Heal, and Power Cure automation.
 * Removes the conditions the spell cures from each target after the healing is applied.
 * Power Cure also removes all levels of exhaustion.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function healConditions(workflow) {
	try {
		const identifier = workflow.item?.system?.identifier;
		const cures = HEALING_CURES[identifier];
		if (!cures) return;
		for (const target of workflow.targets ?? []) {
			const actor = target?.actor ?? target?.document?.actor;
			if (!actor) continue;
			await removeStatuses(actor, cures);
			if (identifier === "power-cure" && actor.system?.attributes?.exhaustion) {
				await updateActorAsGM(actor, { "system.attributes.exhaustion": 0 });
			}
		}
	} catch (err) {
		console.error("Heal |", err);
	}
}

/**
 * Runs Sunbeam and Sunburst automation at midi-qol.preTargetSave: undead and
 * oozes make the save with disadvantage.
 *
 * @param {Token} target - Token making the save.
 * @param {*} workflow - midi-qol workflow.
 * @param {object} saveDetails - Save configuration midi is about to roll.
 */
export function sunbeam(target, workflow, saveDetails) {
	if (!["sunbeam", "sunburst"].includes(workflow.item?.system?.identifier)) return;
	const type = target.actor?.system?.details?.type?.value;
	if (type === "undead" || type === "ooze") saveDetails.disadvantage = true;
}

/**
 * Runs Disintegrate automation at midi-qol.preTargetSave: incorporeal creatures
 * automatically succeed on the save. When midi-qol gives no modifier tracker to mark the
 * success on, they roll with advantage instead.
 *
 * @param {Token} target - Token making the save.
 * @param {*} workflow - midi-qol workflow.
 * @param {object} saveDetails - Save configuration midi is about to roll.
 */
export function disintegrate(target, workflow, saveDetails) {
	if (workflow.item?.system?.identifier !== "disintegrate") return;
	if (!isIncorporeal(target.actor)) return;
	// succeed() sets the auto-success; addAttribution alone only labels it.
	if (typeof saveDetails.modifierTracker?.succeed === "function") {
		saveDetails.modifierTracker.succeed("disintegrate", "Incorporeal");
	} else {
		saveDetails.advantage = true;
	}
}
