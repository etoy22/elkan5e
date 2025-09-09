import { drainedEffect } from "../global.mjs";

export async function lifeDrainGraveguard(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = workflow.token.actor.uuid;

	if (!caster || !casterToken) {
		console.warn("Life Drain aborted: missing actor or actorToken");
		return;
	}
	for (const dmgEntry of workflow.damageList) {
		const damage = (dmgEntry.tempDamage ?? 0) + (dmgEntry.hpDamage ?? 0);
		if (damage <= 0 || !dmgEntry.isHit) continue;

		if (!dmgEntry.targetUuid) {
			console.warn("Life Drain: damageList entry missing targetUuid", dmgEntry);
			continue;
		}

		const parts = dmgEntry.targetUuid.split(".");
		if (parts.length < 4) {
			console.warn("Life Drain: Invalid targetUuid format", dmgEntry.targetUuid);
			continue;
		}
		const tokenId = parts[3];
		const targetToken = canvas.tokens.get(tokenId);
		if (!targetToken) {
			console.warn(`Life Drain: Token with ID ${tokenId} not found on canvas`);
			continue;
		}

		await drainedEffect(
			targetToken.actor,
			damage,
			"Life Drain",
			"icons/magic/unholy/strike-hand-glow-pink.webp",
			casterUuid,
		);
	}
}
export async function spectralEmpowerment(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = workflow.token.actor.uuid;

	if (!caster || !casterToken) {
		console.warn("Spectral Empowerment aborted: missing actor or actorToken");
		return;
	}
	for (const dmgEntry of workflow.damageList) {
		const damage = (dmgEntry.tempDamage ?? 0) + (dmgEntry.hpDamage ?? 0);
		if (damage <= 0 || !dmgEntry.isHit) continue;

		if (!dmgEntry.targetUuid) {
			console.warn("Spectral Empowerment: damageList entry missing targetUuid", dmgEntry);
			continue;
		}

		const parts = dmgEntry.targetUuid.split(".");
		if (parts.length < 4) {
			console.warn("Spectral Empowerment: Invalid targetUuid format", dmgEntry.targetUuid);
			continue;
		}
		const tokenId = parts[3];
		const targetToken = canvas.tokens.get(tokenId);
		if (!targetToken) {
			console.warn(`Spectral Empowerment: Token with ID ${tokenId} not found on canvas`);
			continue;
		}

		await drainedEffect(
			targetToken.actor,
			damage,
			"Spectral Empowerment",
			"icons/magic/unholy/strike-hand-glow-pink.webp",
			casterUuid,
		);
	}
}
