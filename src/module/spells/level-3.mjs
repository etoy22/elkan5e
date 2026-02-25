import { drainedEffect, forEachDamagedTarget } from "../shared/effects.mjs";

/**
 * Runs life Drain spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function lifeDrain(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = casterToken.actor.uuid;
	let totalHealing = 0;

	await forEachDamagedTarget(workflow, async (targetToken, damage) => {
		totalHealing += Math.floor(damage / 2);
		await drainedEffect(
			targetToken.actor,
			damage,
			"Life Drain",
			"icons/magic/control/debuff-energy-hold-green.webp",
			casterUuid,
		);
	});

	if (totalHealing <= 0) return;
	const healingRoll = await new Roll(`${totalHealing}`).evaluate({ async: true });
	new MidiQOL.DamageOnlyWorkflow(
		caster,
		casterToken,
		healingRoll.total,
		"healing",
		[casterToken],
		healingRoll,
		{ flavor: "Life Drain Healing" },
	);
}
/**
 * Applies the "Sapping Smite" drained effect to each target damaged by the smite.
 *
 * Iterates through the damage entries in the workflow, and for each valid damage
 * instance on a valid target token, applies the drainedEffect with the "Sapping Smite" effect.
 *
 * @param {object} workflow - The workflow object containing spell and damage details.
 * @param {Actor} workflow.actor - The caster of the Sapping Smite spell.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - The UUID of the caster actor, used as effect origin.
 * @param {Array<object>} workflow.damageList - Array of damage entries detailing damage dealt per target.
 *
 * @returns {Promise<void>} Resolves after all drained effects have been applied.
 */
