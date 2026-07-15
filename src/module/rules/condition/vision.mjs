// Vision-based automation: attacking an unseen target imposes disadvantage.

/**
 * Runs on midi-qol.preAttackRollConfig (after midi-qol's own advantage/disadvantage
 * recompute, so this isn't reset): forces disadvantage on the attack whenever
 * the attacker cannot see the target (per midi-qol's vision-based canSee,
 * which accounts for darkvision, magical darkness, and walls).
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function darknessAttackDisadvantage(workflow) {
	try {
		const canSee = globalThis.MidiQOL?.canSee;
		if (typeof canSee !== "function") return;

		const attackerToken = workflow?.token;
		if (!attackerToken) return;

		for (const targetEntry of workflow.targets ?? []) {
			const targetToken = targetEntry?.document?.object ?? targetEntry?.object ?? targetEntry;
			if (!targetToken) continue;
			if (canSee(attackerToken, targetToken)) continue;

			workflow.attackRollModifierTracker?.disadvantage?.add("Unseen Target");
		}
	} catch (error) {
		console.error("Elkan 5e | Error in darknessAttackDisadvantage:", error);
	}
}
