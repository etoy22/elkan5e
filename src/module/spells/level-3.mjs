import { drainedEffect, forEachDamagedTarget } from "../shared/helpers.mjs";
import { createEffect } from "../shared/effect-factories.mjs";

/**
 * Runs Haste lethargy automation.
 * Call this from the Haste effect's "off" (onDelete) DAE macro.
 * Applies Incapacitated to the caster for 1 turn when the Haste effect expires.
 *
 * @param {object} effect - The DAE expiry payload for the Haste effect that just ended.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function hasteLethargy(effect) {
	const casterUuid = effect.origin?.split(".ActiveEffect.")[0];
	try {
		const actor = await fromUuid(casterUuid);
		if (!actor) {
			console.warn(
				"Haste Lethargy: could not resolve caster actor from effect.origin",
				effect.origin,
			);
			return;
		}

		const effectData = await createEffect("incapacitated", {
			name: "Haste Lethargy",
			img: "icons/magic/time/clock-analog-gray.webp",
			origin: effect.origin ?? effect.effectUuid,
			disabled: false,
			statuses: ["incapacitated"],
			duration: {
				rounds: 1,
				startRound: game.combat?.round ?? null,
				startTurn: game.combat?.turn ?? null,
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
	await casterToken.actor.update({
		"system.attributes.hp.value": caster.system.attributes.hp.value + totalHealing,
	});
}
