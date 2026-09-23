import { deleteEffects } from "../shared/helpers.mjs";

/**
 * Runs Mark of Affliction class feature automation.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {Promise<void>}
 */
export async function markOfAffliction(workflow) {
	try {
		if (!workflow.actor || workflow.hitTargets.size === 0) return;

		// Fire on weapon attacks or spell-based damage/saves
		const actionType = workflow.activity?.actionType;
		const isWeaponAttack = ["mwak", "rwak"].includes(actionType);
		const isSpell = ["msak", "rsak", "save"].includes(actionType);
		if (!isWeaponAttack && !isSpell) return;

		const actor = workflow.actor;

		const markEffect = actor.effects.find(
			(ef) => ef.name === "Mark of Affliction" && !ef.disabled,
		);
		if (!markEffect) return;

		// Once-per-turn guard
		if (game.combat) {
			const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
			if (actor.getFlag("elkan5e", "markOfAfflictionTime") === combatTime) return;
			await actor.setFlag("elkan5e", "markOfAfflictionTime", combatTime);
		}

		// Prompt the player — the ability is optional ("you can attempt to poison them")
		const dc = actor.system?.attributes?.spell?.dc ?? "?";
		const confirmed = await foundry.applications.api.DialogV2.confirm({
			window: { title: "Mark of Affliction" },
			content: `<p>Attempt to poison the target? (Constitution save, DC&nbsp;${dc})</p>`,
			rejectClose: false,
			modal: true,
		});
		if (!confirmed) return;

		const markItem = actor.items.find(
			(i) => i.system?.identifier === "mark-of-affliction-ranger",
		);
		if (!markItem) {
			ui.notifications.warn("Mark of Affliction | Feat item not found on actor.");
			return;
		}

		const saveActivity = markItem.system.activities.contents.find((a) => a.type === "save");
		// configure: false skips dialogs and fires immediately against current targets.
		if (saveActivity) await saveActivity.use({}, { configure: false });
	} catch (err) {
		console.error("Mark of Affliction |", err);
	}
}

/**
 * Runs Mark of Thorns class feature automation.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {Promise<void>}
 */
export async function markOfThorns(workflow) {
	try {
		if (!workflow.actor || workflow.hitTargets.size === 0) return;

		// Only melee attacks trigger the retaliation
		if (workflow.activity?.actionType !== "mwak") return;

		const attackerActor = workflow.actor;
		const attackerToken = workflow.token;
		if (!attackerToken) return;

		for (const targetToken of workflow.hitTargets) {
			const targetActor = targetToken.actor;
			if (!targetActor) continue;

			// Look for the Mark of Thorns (Target) effect on the struck ally
			const thornsEffect = targetActor.effects.find(
				(ef) => ef.name === "Mark of Thorns (Target)" && !ef.disabled,
			);
			if (!thornsEffect) continue;

			// Resolve the caster via the effect's origin UUID. In dnd5e v5 the
			// origin points to the Activity, so step up to Item then Actor.
			let casterActor = null;
			if (thornsEffect.origin) {
				const originDoc = await fromUuid(thornsEffect.origin).catch(() => null);
				const originItem = originDoc
					? (originDoc.item ?? originDoc.parent ?? originDoc)
					: null;
				casterActor = originItem?.parent ?? null;
			}

			// Fallback: find any actor that still has the Mark of Thorns (Caster) effect
			if (!casterActor) {
				casterActor = game.actors.find((a) =>
					a.effects.some((ef) => ef.name === "Mark of Thorns (Caster)" && !ef.disabled),
				);
			}

			if (!casterActor) {
				console.warn("Mark of Thorns | Could not resolve caster actor.");
				continue;
			}

			// Get the thorn damage formula from the ranger's Mark for Death scale value
			const scaleEntry = casterActor.system?.scale?.ranger?.["mark-for-death"];
			const formula =
				scaleEntry?.formula ??
				(typeof scaleEntry === "string" ? scaleEntry : null) ??
				"1d4";

			const casterToken = casterActor.getActiveTokens()?.[0] ?? attackerToken;

			// Roll and apply piercing thorn damage to the attacker
			const damageRoll = await new CONFIG.Dice.DamageRoll(
				formula,
				{},
				{ type: "piercing", isCritical: false, flavor: "Mark of Thorns" },
			).evaluate();

			await new MidiQOL.DamageOnlyWorkflow(
				casterActor,
				casterToken,
				damageRoll.total,
				"piercing",
				[{ token: attackerToken, actor: attackerActor }],
				{
					flavor: "Mark of Thorns",
					itemCardId: "new",
					isCritical: false,
					damageRoll,
				},
			);
		}
	} catch (err) {
		console.error("Mark of Thorns |", err);
	}
}

// Unrelenting Focus is handled in its item data: a damage rule that applies while the
// ranger doesn't have the rangerMark status that every ranger mark's self effect carries.
const MARK_FOR_DEATH = "Mark for Death";

/**
 * Checks whether an effect was applied by the given actor, using its origin.
 *
 * @param {ActiveEffect} effect - Effect to check.
 * @param {Actor} actor - Possible source actor.
 * @returns {boolean}
 */
function isEffectFrom(effect, actor) {
	if (!effect.origin) return false;
	const origin =
		globalThis.MidiQOL?.getItemFromEffectOrigin?.(effect.origin) ??
		fromUuidSync(effect.origin, { strict: false });
	const item = origin?.item ?? origin;
	return item?.actor?.id === actor.id;
}

/**
 * Gets the Mark for Death effects a ranger has placed on a creature.
 *
 * @param {Actor} target - Creature to check.
 * @param {Actor} ranger - Ranger who may have marked them.
 * @returns {ActiveEffect[]}
 */
const marksBy = (target, ranger) =>
	target.effects.filter(
		(ef) => ef.name === MARK_FOR_DEATH && !ef.disabled && isEffectFrom(ef, ranger),
	);

/**
 * Mark for Death damage bonus (DamageBonusMacro). Adds the Mark for Death die to weapon hits
 * against the ranger's marked creature. This needs a script because dnd5e's damage rules
 * can't see the target.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @param {Item} [item] - The Mark for Death item.
 * @returns {Promise<Roll|object>} Bonus damage roll, or an empty object for none.
 */
export async function markForDeath(workflow, item) {
	try {
		if (!["mwak", "rwak"].includes(workflow.activity?.actionType)) return {};
		const actor = workflow.actor;
		const target = workflow.hitTargets.first()?.actor;
		if (!actor || !target) return {};

		if (!marksBy(target, actor).length) return {};

		const formula = actor.system?.scale?.ranger?.["mark-for-death"]?.formula ?? "1d4";
		const types = workflow.item?.system?.damage?.base?.types;
		const damageType = types?.size ? types.first() : "slashing";
		return await new CONFIG.Dice.DamageRoll(
			formula,
			{},
			{
				type: damageType,
				isCritical: workflow.isCritical,
				flavor: item?.name ?? MARK_FOR_DEATH,
			},
		).evaluate();
	} catch (err) {
		console.error("markForDeath |", err);
		return {};
	}
}

/**
 * Keeps Mark for Death on one creature: when the ranger marks a new target, their mark is
 * removed from every other creature.
 *
 * @param {object} activity - Activity that was used.
 * @returns {Promise<void>}
 */
export async function moveMarkForDeath(activity) {
	if (activity?.item?.system?.identifier !== "mark-for-death" || !activity.effects?.length)
		return;
	const ranger = activity.actor;
	const targets = game.user.targets;
	if (!ranger || !targets.size) return;

	for (const token of canvas.tokens.placeables) {
		if (!token.actor || targets.has(token)) continue;
		const marks = marksBy(token.actor, ranger);
		if (marks.length) await deleteEffects(token.actor, marks);
	}
}

/**
 * Runs Precise Hunter class feature automation: grants advantage on attack
 * rolls made against a creature the ranger has marked with Mark for Death.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {Promise<void>}
 */
export async function preciseHunterAdvantage(workflow) {
	try {
		const actor = workflow.actor;
		if (!actor) return;

		const hasPreciseHunter = actor.items.find((i) => i.system?.identifier === "precise-hunter");
		if (!hasPreciseHunter) return;

		for (const targetEntry of workflow.targets ?? []) {
			const targetToken = targetEntry?.document?.object ?? targetEntry?.object ?? targetEntry;
			const targetActor = targetToken?.actor;
			if (!targetActor) continue;

			if (marksBy(targetActor, actor).length) {
				workflow.attackRollModifierTracker?.advantage?.add("Precise Hunter");
				break;
			}
		}
	} catch (err) {
		console.error("Precise Hunter |", err);
	}
}
