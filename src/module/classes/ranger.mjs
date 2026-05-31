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

export async function markForDeath(workflow) {
	try {
		if (workflow.hitTargets.size === 0) return {};
		const target = workflow.hitTargets.first();
		const isMarked = target.actor?.effects?.find((ef) => {
			const byName = ef.name === "Mark for Death";
			if (!byName) return false;
			const sourceItem = MidiQOL.getItemFromEffectOrigin(ef.origin ?? "");
			return sourceItem?.uuid === macroItem.uuid;
		});
		if (!isMarked) return {};

		// ── Damage formula: prefer the ranger scale value, fall back to 1d4
		const scaleValue = workflow.actor?.system?.scale?.ranger?.["mark-for-death"];
		const formula = scaleValue?.formula ?? "1d4";
		const base = workflow.item?.system?.damage?.base;
		let damageType = "slashing";

		if (base?.types instanceof Set && base.types.size > 0) {
			[damageType] = [...base.types]; // dnd5e v4 / Foundry v14
		}

		const isCritical = workflow.isCritical;
		return await new CONFIG.Dice.DamageRoll(
			formula,
			{},
			{ type: damageType, isCritical, flavor: macroItem.name },
		).evaluate();
	} catch (err) {
		console.error("markForDeath |", err);
		return {};
	}
}
