import { drainedEffect } from "../global.mjs";

export async function slicingBlow(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = workflow.token.actor.uuid;

	if (!caster || !casterToken) {
		console.warn("Slicing Blow aborted: missing actor or actorToken");
		return;
	}
	for (const dmgEntry of workflow.damageList) {
		const damage = (dmgEntry.hpDamage ?? 0);
		if (damage <= 0) continue;

		if (!dmgEntry.targetUuid) {
			console.warn("Slicing Blow: damageList entry missing targetUuid", dmgEntry);
			continue;
		}

		const parts = dmgEntry.targetUuid.split(".");
		if (parts.length < 4) {
			console.warn("Slicing Blow: Invalid targetUuid format", dmgEntry.targetUuid);
			continue;
		}
		const tokenId = parts[3];
		const targetToken = canvas.tokens.get(tokenId);
		if (!targetToken) {
			console.warn(`Slicing Blow: Token with ID ${tokenId} not found on canvas`);
			continue;
		}

		await drainedEffect(targetToken.actor, damage, "Slicing Blow", "icons/skills/melee/strike-sword-blood-red.webp", casterUuid);
	}
}
