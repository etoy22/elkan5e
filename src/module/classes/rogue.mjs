import { drainedEffect, forEachDamagedTarget } from "../shared/helpers.mjs";

/**
 * Runs slicing Blow class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function slicingBlow(workflow) {
	const casterUuid = workflow.token?.actor?.uuid;
	if (!workflow.actor || !workflow.token) {
		console.warn("Slicing Blow aborted: missing actor or actorToken");
		return;
	}

	await forEachDamagedTarget(workflow, async (token, damage) => {
		await drainedEffect(
			token.actor,
			damage,
			"Slicing Blow",
			"icons/skills/melee/strike-sword-blood-red.webp",
			casterUuid,
		);
	});
}

export async function sneakAttack(workflow) {
	try {
		if (!["mwak", "rwak"].includes(workflow.activity.actionType)) return {};
		if (
			(!workflow.activity.actionType === "mwak" || workflow.activity.actionType === "rwak") &&
			workflow.iWtem.system.properties.has("heavy")
		)
			return {};
		if (workflow.hitTargets.size < 1) return {};
		if (!workflow.actor || !workflow.token) return {};

		const actor = workflow.actor;

		const target = workflow.hitTargets.first();
		if (!target) {
			console.error("Sneak Attack: no target found");
			return {};
		}

		// Once-per-turn guard — check before doing anything else.
		if (game.combat) {
			const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
			if (actor.getFlag("elkan5e", "sneakAttackTime") === combatTime) {
				console.warn("Sneak Attack: already used this turn");
				return {};
			}
		}

		// Eligible if we have advantage OR a qualifying enemy is adjacent to the target.
		let foundEnemy = false;
		let isSneak = workflow.advantage;

		if (!isSneak) {
			const nearbyTokens = canvas.tokens.placeables.filter(
				(t) =>
					t.actor &&
					t.actor.id !== actor.id &&
					t.id !== target.id &&
					t.actor.system.attributes?.hp?.value > 0 &&
					t.document.disposition !== target.document.disposition &&
					MidiQOL.computeDistance(t, target, { wallsBlock: false }) <= 5,
			);
			foundEnemy = nearbyTokens.some(
				(t) => t.document.disposition === -target.document.disposition,
			);
			isSneak = nearbyTokens.length > 0;
		}

		if (!isSneak) {
			console.warn("Sneak Attack: no advantage or qualifying ally adjacent to target");
			return {};
		}

		// Record the turn so sneak attack can't fire twice.
		if (game.combat) {
			const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
			if (actor.getFlag("elkan5e", "sneakAttackTime") !== combatTime) {
				await actor.setFlag("elkan5e", "sneakAttackTime", combatTime);
			}
		}

		const base = workflow.item?.system?.damage?.base;
		const parts = workflow.item?.system?.damage?.parts;
		let damageType = "piercing";
		if (base?.types instanceof Set && base.types.size > 0) {
			[damageType] = [...base.types];
		} else if (Array.isArray(parts) && parts[0]?.[1]) {
			damageType = parts[0][1];
		}
		// Check for other precision-strike features on the actor.
		const precisionFeatures = actor.items.filter(
			(i) => i.system?.type?.subtype === "precision",
		);
		const macroItem = actor.items.filter((i) => i.system.identifier === "sneak-attack");
		if (precisionFeatures.length === 1) {
			const activity = macroItem[0].system.activities.contents[0];
			if (activity)
				await activity.use({ damage: { type: damageType } }, { event: workflow.event });
		} else {
			// Let the player pick: Sneak Attack or any precision feature.
			const choices = [...precisionFeatures.map((f) => ({ label: f.name, value: f.uuid }))];
			const optionsHtml = choices
				.map((c) => `<option value="${c.value}">${c.label}</option>`)
				.join("");

			const chosen = await foundry.applications.api.DialogV2.prompt({
				window: { title: "Precision Strike" },
				content: `<div style="margin-bottom:8px;">Choose which feature to use:</div>
				          <select name="choice" style="width:100%">${optionsHtml}</select>`,
				ok: { label: "Use", callback: (_ev, btn) => btn.form.elements.choice.value },
				rejectClose: false,
				modal: true,
			});
			if (!chosen) return {};

			const targetItem = chosen === "sneak" ? macroItem : await fromUuid(chosen);
			if (!targetItem) return {};

			const activity = targetItem.system.activities.contents[0];
			// Sneak attack inherits the weapon's damage type; precision features define their own.
			const useConfig = chosen === "sneak" ? { damage: { type: damageType } } : {};
			if (activity) await activity.use(useConfig, { event: workflow.event });
		}
	} catch (err) {
		console.error("Sneak Attack |", err);
	}
}
