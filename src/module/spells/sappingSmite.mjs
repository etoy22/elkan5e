import { drainedEffect } from "../global.mjs";

export async function sappingSmite(args) {
	ui.notifications.info("🧪 Sapping Smite Triggered!");
	console.log("🧪 Args received:", args);
	// console.log("Elkan 5e | Sapping Smite triggered");
	// const workflow = args?.workflow;
	// if (!workflow) return;

	// const target = workflow?.hitTargets?.first();
	// if (!target) return;

	// const actor = target.actor;
	// if (!actor) return;

	// let damage = args.workflow.damageTotal ?? 0;
	// const damageType = "necrotic";

	// const di = actor.system.traits.di.value || [];
	// const dr = actor.system.traits.dr.value || [];
	// const dv = actor.system.traits.dv.value || [];

	// if (di.includes(damageType)) return;
	// if (dr.includes(damageType)) damage = Math.floor(damage / 2);
	// if (dv.includes(damageType)) damage = damage * 2;

	// if (damage <= 0) return;

	// await drainedEffect(
	// 	target,
	// 	damage,
	// 	"Sapping Smite",
	// 	"icons/weapons/polearms/spear-flared-silver-pink.webp",
	// 	workflow.item?.uuid
	// );
}
