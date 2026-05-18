import { drainedEffect, forEachDamagedTarget } from "../shared/helpers.mjs";
import { createEffect } from "../shared/effect-factories.mjs";

/**
 * Runs Haste lethargy automation.
 * Call this from the Haste effect's "off" (onDelete) DAE macro.
 * Applies Incapacitated to the caster for 1 turn when the Haste effect expires.
 *
 * @param {ActiveEffect} effect - The Haste effect that just ended.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function hasteLethargy(effect) {
	try {
		const actor = effect.parent;
		if (!actor) {
			console.warn("Haste Lethargy: could not resolve actor from effect");
			return;
		}

		const effectData = await createEffect("incapacitated", {
			name: "Haste Lethargy",
			img: "icons/magic/time/clock-analog-gray.webp",
			origin: effect.origin ?? effect.uuid,
			disabled: false,
			statuses: ["incapacitated"],
			duration: {
				rounds: 1,
				turns: 0,
				startRound: game.combat?.round ?? null,
				startTurn: game.combat?.turn ?? null,
			},
			flags: {
				dae: {
					specialDuration: ["turnEnd"],
					stackable: "noneName",
					macroRepeat: "none",
				},
			},
		});

		await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
	} catch (err) {
		console.error("Haste Lethargy |", err);
	}
}

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
