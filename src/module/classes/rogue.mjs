import { drainedEffect, forEachDamagedTarget } from "../shared/effects.mjs";

/**
 * Runs slicing Blow class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function slicingBlow(workflow) {
	const casterUuid = workflow.token?.actor?.uuid;
	if (!workflow.actor || !workflow.token) {
		console.warn("Slicing Blow aborted: missing actor or actorToken");
		return;
	}

	await forEachDamagedTarget(workflow, async (token, damage) => {
		await drainedEffect(
			token.actor,
			damage,
			"Slicing Blow",
			"icons/skills/melee/strike-sword-blood-red.webp",
			casterUuid,
		);
	});
}
