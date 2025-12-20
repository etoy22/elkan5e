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

export async function soulConduit(workflow) {
	try {
		console.log("Elkan 5e | Soul Conduit check");
		const item = workflow.item ?? workflow;
		if (!item || item.type !== "spell") return;

		const school = (item.system?.school || "").toLowerCase();
		const level = Number(item.system?.level ?? 0);
		if (school !== "necromancy" || level < 1) return;

		const actor = workflow.actor ?? (workflow.token ? workflow.token.actor : null);
		if (!actor) return;
		const hasSoul = actor.items.find(
			(i) => i.system?.identifier === "soul-conduit" || i.name === "Soul Conduit",
		);
		if (hasSoul && actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.SoulConduitReminder", { name: actor.name }),
			);
		}
	} catch (err) {
		console.error("elkan5e | soulConduit error:", err);
	}
}

export async function necromanticSurge(workflow) {
	try {
		console.log("Elkan 5e | Necromantic Surge check");
		const item = workflow.item ?? workflow;
		if (!item || item.type !== "spell") return;

		const school = (item.system?.school || "").toLowerCase();
		const level = Number(item.system?.level ?? 0);
		if (school !== "necromancy" || level < 3) return;

		const actor = workflow.actor ?? (workflow.token ? workflow.token.actor : null);
		if (!actor) return;
		const hasSurge = actor.items.find(
			(i) => i.system?.identifier === "necromantic-surge" || i.name === "Necromantic Surge",
		);
		if (hasSurge && actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.NecromanticSurgeReminder", {
					name: actor.name,
				}),
			);
			try {
				const content = `<p>${game.i18n.localize("elkan5e.notifications.NecromanticSurgeOptions") || "Choose an additional Necromantic Surge effect."}</p>`;
				const dialog = new globalThis.Dialog({
					title:
						game.i18n.localize("elkan5e.notifications.NecromanticSurgeReminderTitle") ||
						"Necromantic Surge",
					content,
					buttons: {
						ok: { label: game.i18n.localize("OK") || "OK" },
					},
				});
				dialog.render(true);
			} catch {
				// ignore dialog failures
			}
		}
	} catch (err) {
		console.error("elkan5e | necromanticSurge error:", err);
	}
}
