import { drainedEffect, forEachDamagedTarget } from "../shared/effects.mjs";

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
 * Applies the ongoing "Enervate" effect (e.g., for sustained or repeated necrotic damage).
 *
 * Similar to {@link enervate}, but can be triggered during subsequent rounds or turns.
 * Intended for ongoing damage processing hooks like `midi-qol.damageApplied` or custom macros.
 *
 * @param {object} workflow - The workflow object from MidiQOL or similar automation.
 * @param {Actor} workflow.actor - The caster of the spell.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - UUID for tracking origin of the effect.
 * @param {Array<object>} workflow.damageList - List of damage entries by target.
 * @returns {Promise<void>}
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
