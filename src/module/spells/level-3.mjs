import {
	createLightRegion,
	deleteEffects,
	drainedEffect,
	forEachDamagedTarget,
	isIncorporeal,
	planTeleportForOwner,
} from "../shared/helpers.mjs";
import { createEffect } from "../shared/effect-factories.mjs";

/**
 * Runs Sleet Storm spell automation (shared by the base spell and the
 * elementalist monk's 4-Ki version): an icy, wind-driven curtain of sleet.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function sleetStormDarkness(workflow) {
	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 0,
				bright: 15,
				alpha: 0.3,
				luminosity: 0.5,
				negative: true,
				color: "#b8d4e3",
				animation: {
					type: "smokepatch",
					speed: 3,
					intensity: 5,
				},
				priority: 30,
			},
			"Darkness",
		);
	}
}

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
		// The origin is usually the Haste spell item, so resolve its owning actor.
		const origin = casterUuid ? await fromUuid(casterUuid) : null;
		const actor =
			origin instanceof CONFIG.Actor.documentClass
				? origin
				: (origin?.actor ?? origin?.parent ?? null);
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
			// Until the end of the caster's next turn.
			duration: { value: 1, units: "rounds", expiry: "turnEnd" },
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

/**
 * Runs Spectral Lance automation at midi-qol.preTargetSave: incorporeal
 * creatures make the save with disadvantage.
 *
 * @param {Token} target - Token making the save.
 * @param {*} workflow - midi-qol workflow.
 * @param {object} saveDetails - Save configuration midi is about to roll.
 */
export function spectralLance(target, workflow, saveDetails) {
	if (workflow.item?.system?.identifier !== "spectral-lance") return;
	if (isIncorporeal(target.actor)) saveDetails.disadvantage = true;
}

/**
 * Runs Blink automation at the start of a combatant's turn: if Blink made them Ethereal, they
 * return and choose a space within 10 ft. The Ethereal effect may already be expired by dnd5e.
 *
 * @param {Combat} combat - Combat whose turn changed.
 * @returns {Promise<void>}
 */
export async function blinkReturnTurnStart(combat) {
	const token = combat?.combatant?.token;
	const actor = token?.actor;
	if (!actor) return;
	const responsible =
		game.users.find((u) => u.active && !u.isGM && actor.testUserPermission(u, "OWNER")) ??
		game.users.activeGM;
	if (!responsible?.isSelf) return;

	const ethereal = actor.effects.filter((effect) => {
		if (!effect.statuses.has("ethereal")) return false;
		const origin = effect.origin ? fromUuidSync(effect.origin) : null;
		const item = origin?.item ?? origin;
		return item?.system?.identifier === "blink";
	});
	if (!ethereal.length) return;

	await deleteEffects(actor, ethereal);
	await planTeleportForOwner(token, 10, "blink");
}
