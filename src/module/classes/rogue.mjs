import { drainedEffect } from "../global.mjs";

export async function slicingBlow(workflow) {
  const target = workflow?.args?.[0]?.hitTargets?.[0];
  if (!target) return;

  const actor = target.actors?.contents?.[0];
  if (!actor) return;

  let damage = workflow.args[0].damageTotal;
  const damageType = "slashing";

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
  if (damage <= 0) return; // No damage to apply

  await drainedEffect(
    target,
    damage,
    "Slicing Blow",
    "icons/skills/melee/strike-sword-blood-red.webp",
    workflow.item?.uuid
  );
}
