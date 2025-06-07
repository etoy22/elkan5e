import { drainedEffect } from "../global.mjs";

export async function enervate(workflow) {
	if (workflow.args[0].hitTargets.length > 0) {
		const target = workflow?.args?.[0]?.hitTargets?.[0];
		if (!target) return;

		const actor = target.actors?.contents?.[0];
		if (!actor) return;

		let damage = workflow.args[0].damageTotal;
		const damageType = "necrotic";

		// Check damage traits
		const di = actor.system.traits.di.value || [];
		const dr = actor.system.traits.dr.value || [];
		const dv = actor.system.traits.dv.value || [];

		if (di.includes(damageType)) {
			return; // Immune to this damage type, no effect
		} else {
			if (dr.includes(damageType)) {
				damage = Math.floor(damage / 2);
			}
			if (dv.includes(damageType)) {
				damage = damage * 2;
			}
		}
		drainedEffect(
			target,
			damage,
			"Enervate",
			"icons/magic/death/skeleton-skull-soul-blue.webp",
			workflow.item?.uuid
		);
	}
	else if (workflow.args[0].failedSaves.length > 0) {
		const target = workflow?.args?.[0]?.failedSaves?.[0];
		if (!target) return;

		const actor = target.actors?.contents?.[0];
		if (!actor) return;

		let damage = workflow.args[0].damageTotal;
		const damageType = "necrotic";

		// Check damage traits
		const di = actor.system.traits.di.value || [];
		const dr = actor.system.traits.dr.value || [];
		const dv = actor.system.traits.dv.value || [];

		if (di.includes(damageType)) {
			return; // Immune to this damage type, no effect
		} else {
			if (dr.includes(damageType)) {
				damage = Math.floor(damage / 4);
			}
			else if (dv.includes(damageType)) {
				damage = damage;
			}
			else {
				damage = Math.floor(damage / 2);
			}
		}
		if (damage <= 0) return; // No damage to apply
		drainedEffect(
			target,
			damage,
			"Enervate",
			"icons/magic/death/skeleton-skull-soul-blue.webp",
			workflow.item?.uuid
		);

	}
}

//TODO:FIX OVERTIME DAMAGE
export async function enervateOngoing(workflow) {

}
