import { drainedEffect } from "../shared/helpers.mjs";

const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Runs life Drain Graveguard class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
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
/**
 * Runs spectral Empowerment class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
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

/**
 * Runs soul Conduit class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
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

/**
 * Runs Necromantic Surge class feature automation, matching the Lesser
 * Restoration spell's pattern: presents a dialog showing which removable
 * conditions the caster currently has (plus an exhaustion option), lets
 * them pick one, then removes it. Only applies when the caster targets
 * themself with a necromancy spell of 3rd level or higher.
 *
 * Removable conditions: blinded, deafened, poisoned, weakened.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function necromanticSurge(workflow) {
	try {
		const item = workflow.item ?? workflow;
		if (!item || item.type !== "spell") return;

		const school = (item.system?.school || "").toLowerCase();
		const level = Number(item.system?.level ?? 0);
		if (school !== "necromancy" || level < 3) return;

		const actor = workflow.actor ?? (workflow.token ? workflow.token.actor : null);
		if (!actor || !actor.isOwner) return;

		const hasSurge = actor.items.find(
			(i) => i.system?.identifier === "necromantic-surge" || i.name === "Necromantic Surge",
		);
		if (!hasSurge) return;

		// The condition/exhaustion option only applies when the caster targeted themself.
		const targetsSelf = [...(workflow.targets ?? [])].some(
			(t) => (t.actor ?? t.document?.actor) === actor,
		);
		if (!targetsSelf) return;

		const REMOVABLE = [
			{ id: "blinded", label: "Blinded" },
			{ id: "deafened", label: "Deafened" },
			{ id: "poisoned", label: "Poisoned" },
			{ id: "weakened", label: "Weakened" },
		];

		const present = REMOVABLE.filter(
			(c) =>
				actor.statuses.has(c.id) ||
				actor.effects.some((e) => !e.disabled && e.statuses.has(c.id)),
		);

		const exhaustionLevel = Number(actor.system?.attributes?.exhaustion ?? 0);
		if (exhaustionLevel > 0) present.push({ id: "exhaustion", label: "1 level of Exhaustion" });

		if (present.length === 0) {
			ui.notifications.info(
				`${actor.name} has none of the conditions Necromantic Surge can remove.`,
			);
			return;
		}

		// Build one button per present condition, plus Cancel.
		const chosen = await DialogV2.wait({
			window: { title: "Necromantic Surge" },
			content: `<p>Which condition on <strong>${actor.name}</strong> do you want to remove?</p>`,
			buttons: [
				...present.map((cond) => ({ label: cond.label, action: cond.id })),
				{ label: "Cancel", action: "cancel" },
			],
			default: present[0].id,
			rejectClose: false,
		});

		if (!chosen || chosen === "cancel") return;

		if (chosen === "exhaustion") {
			await actor.update({ "system.attributes.exhaustion": exhaustionLevel - 1 });
		} else {
			// Remove every active effect that carries this status (handles stacked effects).
			const toDelete = actor.effects
				.filter((e) => e.statuses.has(chosen) && !e.disabled)
				.map((e) => e.id);
			if (toDelete.length) await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);
		}

		const label = present.find((c) => c.id === chosen)?.label ?? chosen;
		await ChatMessage.create({
			content: `<p><strong>Necromantic Surge</strong> removes <em>${label}</em> from <strong>${actor.name}</strong>.</p>`,
			speaker: ChatMessage.getSpeaker({ actor }),
		});
	} catch (err) {
		console.error("Necromantic Surge |", err);
	}
}

/**
 * Runs Overchannel class feature automation: arms the feature when its
 * activity is used, so the next qualifying spell can consume it.
 *
 * @param {*} activity - Activity that was just used.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function overchannelArm(activity) {
	try {
		if (activity?.item?.system?.identifier !== "overchannel") return;
		const actor = activity.actor;
		if (!actor) return;

		const existing = actor.effects.find((ef) => ef.name === "Overchannel" && !ef.disabled);
		if (existing) return;

		await actor.createEmbeddedDocuments("ActiveEffect", [
			{
				name: "Overchannel",
				img: activity.item.img,
				origin: activity.item.uuid,
				transfer: false,
				disabled: false,
				duration: { rounds: 1 },
				changes: [],
				flags: {
					dae: {
						stackable: "none",
						durationExpression: "",
						macroRepeat: "none",
						specialDuration: [],
					},
				},
			},
		]);
	} catch (err) {
		console.error("Overchannel |", err);
	}
}

/**
 * Runs Overchannel class feature automation: while armed, forces maximum
 * damage on a wizard spell of up to 5th level cast with a spell slot, then
 * applies escalating, unavoidable self-damage for repeat uses before the
 * next long rest (none on the first use, 2d12/spell level on the second,
 * +1d12/spell level for each subsequent use).
 *
 * @param {object} rollConfig - dnd5e damage roll configuration.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function overchannelOnDamageRoll(rollConfig) {
	try {
		const activity = rollConfig?.subject;
		const actor = activity?.actor;
		if (!actor) return;

		const overchannelEffect = actor.effects.find(
			(ef) => ef.name === "Overchannel" && !ef.disabled,
		);
		if (!overchannelEffect) return;

		const item = activity.item;
		if (item?.type !== "spell") return;

		const spellLevel = item.system?.level ?? 0;
		if (spellLevel < 1 || spellLevel > 5) return;

		const usesSlot = Boolean(activity.consumption?.spellSlot);
		if (!usesSlot) return;

		for (const roll of rollConfig.rolls ?? []) {
			roll.options = { ...(roll.options ?? {}), maximize: true };
		}

		await overchannelEffect.delete();

		const uses = (actor.getFlag("elkan5e", "overchannelUses") ?? 0) + 1;
		await actor.setFlag("elkan5e", "overchannelUses", uses);

		if (uses <= 1) return; // First use since the last long rest: no adverse effect.

		const selfDamageFormula = `${uses * spellLevel}d12`;
		const selfRoll = await new Roll(selfDamageFormula).evaluate();
		await selfRoll.toMessage({
			flavor: `Overchannel — backlash (${selfDamageFormula}, cannot be reduced or avoided)`,
			speaker: ChatMessage.getSpeaker({ actor }),
		});

		const hpPath = "system.attributes.hp.value";
		const hp = foundry.utils.getProperty(actor, hpPath);
		if (typeof hp === "number") {
			await actor.update({ [hpPath]: Math.max(0, hp - selfRoll.total) });
		}
	} catch (err) {
		console.error("Overchannel |", err);
	}
}

/**
 * Resets the Overchannel escalation counter after a long rest.
 *
 * @param {*} actor - Actor document to process.
 * @param {*} result - Rest result data.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function overchannelOnLongRest(actor, result) {
	try {
		if (!result?.longRest) return;
		if (actor?.getFlag("elkan5e", "overchannelUses") === undefined) return;
		await actor.unsetFlag("elkan5e", "overchannelUses");
	} catch (err) {
		console.error("Overchannel |", err);
	}
}
