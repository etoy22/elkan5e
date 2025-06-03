import { drainedEffect } from "../global.mjs";

export async function spectralEmpowerment(workflow) {
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
      // Resistant: half damage
      damage = Math.floor(damage / 2);
    }
    if (dv.includes(damageType)) {
      // Vulnerable: double damage
      damage = damage * 2;
    }
  }
  drainedEffect(
    target,
    damage,
    "Sapping Smite",
    "icons/weapons/polearms/spear-flared-silver-pink.webp",
    workflow.item?.uuid
  );
}
