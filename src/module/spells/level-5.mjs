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

/**
 * Creates or updates a Goodberry consumable item on the actor based on spell level,
 * and applies a duration effect linked to the consumable.
 *
 * @param {object} workflow - The workflow object from the spell use containing actor and item.
 * @param {Actor} workflow.actor - The actor casting the spell.
 * @param {Item} workflow.item - The spell item being cast.
 *
 * @returns {Promise<void>} Resolves when item creation/update and effect creation are complete.
 */
