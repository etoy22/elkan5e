import {
	drainedEffect,
	forEachDamagedTarget,
	markUsedThisTurn,
	t,
	updateActorAsGM,
	usedThisTurn,
} from "../shared/helpers.mjs";

const DialogV2 = foundry.applications.api.DialogV2;

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
			workflow.activity.actionType === "mwak" &&
			!workflow.rolledItem?.system.properties?.has("heavy")
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

		if (precisionFeatures.length === 0) {
			// No other precision strikes — fire the sneak attack activity directly.
			const activity = macroItem.system.activities.contents[0];
			if (activity)
				await activity.use({ damage: { type: damageType } }, { event: workflow.event });
		} else {
			// Let the player pick: Sneak Attack or any precision feature.
			const choices = [
				{ label: macroItem.name, value: "sneak" },
				...precisionFeatures.map((f) => ({ label: f.name, value: f.uuid })),
			];
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

const hasFeature = (actor, identifier) =>
	Boolean(actor?.items.some((i) => i.system?.identifier === identifier));

/**
 * Runs Finishing Blow class feature automation: after a weapon hit leaves a creature with
 * 10 hit points or fewer, prompts the assassin to reduce it to 0 hit points. Once per turn.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {Promise<void>}
 */
export async function finishingBlow(workflow) {
	const actor = workflow.actor;
	if (!actor?.isOwner || !["mwak", "rwak"].includes(workflow.activity?.actionType)) return;
	if (!hasFeature(actor, "finishing-blow")) return;

	await forEachDamagedTarget(workflow, async (token) => {
		const target = token.actor;
		const hp = target?.system?.attributes?.hp;
		if (!hp || usedThisTurn(actor, "finishingBlowTime")) return;
		const remaining = (Number(hp.value) || 0) + (Number(hp.temp) || 0);
		if (hp.value <= 0 || remaining > 10) return;

		const confirmed = await DialogV2.confirm({
			window: { title: t("elkan5e.rogue.finishingBlowTitle") },
			content: `<p>${t("elkan5e.rogue.finishingBlowContent", { target: target.name, hp: remaining })}</p>`,
			rejectClose: false,
			modal: true,
		});
		if (!confirmed) return;
		await markUsedThisTurn(actor, "finishingBlowTime");
		await updateActorAsGM(target, {
			"system.attributes.hp.value": 0,
			"system.attributes.hp.temp": 0,
		});
	});
}

/**
 * Runs Brutal Fighting class feature automation: after the rogue wins a shove or grapple
 * contest, prompts them to deal their Brutal Fighting damage to that creature.
 *
 * @param {object} workflow - Workflow of the shove or grapple.
 * @param {Token} targetToken - Creature that was shoved or grappled.
 * @param {"shove"|"grapple"} action - Which contest was won.
 * @returns {Promise<void>}
 */
export async function brutalFighting(workflow, targetToken, action) {
	const actor = workflow?.actor;
	if (!actor?.isOwner || !targetToken?.actor) return;
	const feature = actor.items.find((i) => i.system?.identifier === "brutal-fighting");
	const damage = feature?.system.activities.getByType("damage")[0];
	if (!damage) return;

	const actionLabel = t(
		action === "grapple"
			? "elkan5e.rogue.brutalFightingGrapple"
			: "elkan5e.rogue.brutalFightingShove",
	);
	const confirmed = await DialogV2.confirm({
		window: { title: t("elkan5e.rogue.brutalFightingTitle") },
		content: `<p>${t("elkan5e.rogue.brutalFightingContent", { action: actionLabel, target: targetToken.actor.name })}</p>`,
		rejectClose: false,
		modal: true,
	});
	if (!confirmed) return;

	if (globalThis.MidiQOL?.completeActivityUse) {
		await MidiQOL.completeActivityUse(
			damage,
			{
				midiOptions: {
					targetUuids: [targetToken.document.uuid],
					ignoreUserTargets: true,
				},
			},
			{ configure: false },
		);
	} else {
		await damage.use({}, { configure: false });
	}
}

const REFLEXES_FLAG = "assassinsReflexes";

/**
 * Runs Assassin's Reflexes class feature automation when combat starts: every assassin who
 * isn't surprised gets a second combatant at their initiative minus 10. Runs on the active GM.
 *
 * @param {Combat} combat - Combat that started.
 * @returns {Promise<void>}
 */
export async function assassinsReflexesStart(combat) {
	if (!game.users.activeGM?.isSelf) return;
	const extraTurns = combat.combatants
		.filter(
			(c) =>
				!c.getFlag("elkan5e", REFLEXES_FLAG) &&
				c.initiative !== null &&
				hasFeature(c.actor, "assassins-reflexes") &&
				!c.actor.statuses.has("surprised"),
		)
		.map((c) => ({
			tokenId: c.tokenId,
			sceneId: c.sceneId,
			actorId: c.actorId,
			name: t("elkan5e.rogue.assassinsReflexesTurn", { name: c.name }),
			initiative: c.initiative - 10,
			hidden: c.hidden,
			flags: { elkan5e: { [REFLEXES_FLAG]: c.id } },
		}));
	if (extraTurns.length) await combat.createEmbeddedDocuments("Combatant", extraTurns);
}

/**
 * Removes the extra Assassin's Reflexes turns once the first round is over. Runs on the active GM.
 *
 * @param {Combat} combat - Combat that changed.
 * @param {object} changes - Changes to the combat.
 * @returns {Promise<void>}
 */
export async function assassinsReflexesEnd(combat, changes) {
	if (!game.users.activeGM?.isSelf || !(changes.round > 1)) return;
	const ids = combat.combatants.filter((c) => c.getFlag("elkan5e", REFLEXES_FLAG)).map((c) => c.id);
	if (ids.length) await combat.deleteEmbeddedDocuments("Combatant", ids);
}
