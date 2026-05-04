import { drainedEffect, forEachDamagedTarget } from "../shared/effects.mjs";

/**
 * Runs enervate spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function enervate(workflow) {
	const casterUuid = workflow.token.actor.uuid;
	await forEachDamagedTarget(workflow, (targetToken, damage) =>
		drainedEffect(
			targetToken.actor,
			damage,
			"Enervate",
			"icons/magic/death/skeleton-skull-soul-blue.webp",
			casterUuid,
		),
	);
}

/**
 * Runs enervate Ongoing spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function enervateOngoing(workflow) {
	const casterUuid = workflow.token.actor.uuid;
	await forEachDamagedTarget(workflow, (targetToken, damage) =>
		drainedEffect(
			targetToken.actor,
			damage,
			"Enervate",
			"icons/magic/death/skeleton-skull-soul-blue.webp",
			casterUuid,
		),
	);
}