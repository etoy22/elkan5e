/**
 * Handles Death Ward spell.
 * Triggered by the dnd5e.damageActor hook after damage has been applied.
 *
 * @param {Actor5e} actor - Actor document that was damaged.
 * @returns {Promise<void>}
 */
export async function deathWard(actor) {
	if (!actor) return;
	const hp = Number(actor.system?.attributes?.hp?.value);
	if (hp !== 0) return;

	const effect = actor.effects.find(
		(e) => e.name === "Death Ward" && e.origin?.startsWith("Compendium.elkan5e."),
	);
	if (!effect) return;

	await effect.delete();
	await actor.update({ "system.attributes.hp.value": 1 });
}

/**
 * Runs Fire Shield spell automation.
 * Triggered globally at midi-qol.RollComplete whenever a melee weapon attack
 * lands. Checks each hit target for an active Fire Shield effect and fires the
 * retaliatory damage activity on the attacker.
 *
 * @param {*} workflow - midi-qol workflow at RollComplete.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function fireShield(workflow) {
	try {
		// Only retaliate against melee weapon attacks.
		if (
			(workflow.activity?.actionType !== "mwak" &&
				workflow.activity?.actionType !== "msak") ||
			!workflow.hitTargets?.size
		)
			return;

		const attackerToken = workflow.token;
		if (!attackerToken) return;

		for (const targetToken of workflow.hitTargets) {
			const targetActor = targetToken.actor;
			if (!targetActor) continue;

			// Check if the target has an active Fire Shield effect.
			const hasFireShield = targetActor.effects.some(
				(e) => e.name?.startsWith("Fire Shield") && !e.disabled,
			);
			if (!hasFireShield) continue;

			// Find the Fire Shield item on the target's actor.
			const shieldItem = targetActor.items.find(
				(i) => i.system?.identifier === "fire-shield" || i.name === "Fire Shield",
			);
			if (!shieldItem) continue;

			const activity = shieldItem.system.activities.get("66Qhs5vOSnBGeqBW");
			if (!activity) {
				console.warn("Fire Shield: activity 66Qhs5vOSnBGeqBW not found on item");
				continue;
			}

			// Temporarily target the attacker so the activity fires on them.
			const previousTargets = Array.from(game.user.targets).map((t) => t.id);
			game.user.updateTokenTargets([attackerToken.id]);

			await activity.use({ event: workflow.event });

			// Restore whatever the user had targeted before.
			game.user.updateTokenTargets(previousTargets);
		}
	} catch (err) {
		console.error("Fire Shield |", err);
	}
}

/**
 * Runs vampiric Smite spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function vampiricSmite(workflow) {
	const { actor: caster, token: casterToken, damageItem } = workflow;
	if (!caster || !casterToken || workflow.hitTargets.size !== 1) return;

	const damageDetail = Array.isArray(damageItem?.damageDetail?.[0])
		? damageItem.damageDetail.flat()
		: (damageItem?.damageDetail ?? []);
	const necroticEntry = damageDetail.find((d) => d.type === "necrotic");
	const necroticDamage = Number(necroticEntry?.damage ?? necroticEntry?.value ?? 0);

	if (necroticDamage <= 0) return;

	const damageMultiplier = Number(necroticEntry?.damageMultiplier ?? 1);
	const healAmount = Math.floor(necroticDamage * damageMultiplier * 0.5);
	if (healAmount <= 0) return;

	const healingRoll = await new Roll(`${healAmount}`).evaluate();
	new MidiQOL.DamageOnlyWorkflow(
		caster,
		casterToken,
		healingRoll.total,
		"healing",
		[casterToken],
		healingRoll,
		{ flavor: "Life Steal" },
	);
}

/**
 * Runs Blight spell automation. Wired at preambleComplete, before saves and
 * damage are rolled. Any targeted creature that is a plant creature or
 * magical plant saves with disadvantage.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function blight(workflow) {
	try {
		for (const target of workflow.targets ?? []) {
			const targetActor = target?.actor ?? target?.document?.actor;
			if (!targetActor) continue;

			if (targetActor.system?.details?.type?.value !== "plant") continue;

			const tokenId = target?.document?.id ?? target?.id;
			if (tokenId) {
				(workflow.disadvantageSaves ??= new Set()).add(tokenId);
			}
		}
	} catch (err) {
		console.error("Blight |", err);
	}
}

/**
 * Runs Blight spell automation: tops up damage for any plant/magical-plant
 * target to the maximum the shared damage roll's formula could have dealt
 * (halved if that target succeeded its save, matching the normal onSave
 * rule), without affecting damage already dealt to other targets in the
 * same cast.
 *
 * @param {object} workflow - MIDI-QOL workflow at RollComplete.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function blightMaximizePlantDamage(workflow) {
	try {
		const item = workflow.item;
		if (item?.system?.identifier !== "blight") return;

		const damageRoll = workflow.damageRoll;
		if (!damageRoll?.formula) return;

		const caster = workflow.actor;
		const casterToken = workflow.token;
		if (!caster || !casterToken) return;

		const maxRoll = await new Roll(damageRoll.formula, damageRoll.data).evaluate({
			maximize: true,
		});
		const maxTotal = maxRoll.total;
		if (!maxTotal) return;

		const failedSaveIds = new Set(
			[...(workflow.failedSaves ?? [])].map((e) => e?.document?.id ?? e?.id ?? e),
		);

		for (const dmgEntry of workflow.damageList ?? []) {
			if (!dmgEntry.targetUuid) continue;

			const targetDoc = await fromUuid(dmgEntry.targetUuid).catch(() => null);
			const targetActor = targetDoc?.actor ?? targetDoc;
			if (!targetActor || targetActor.system?.details?.type?.value !== "plant") continue;

			const tokenId = dmgEntry.targetUuid.split(".").at(-1);
			const targetToken = canvas.tokens.get(tokenId);
			if (!targetToken) continue;

			const failed = failedSaveIds.has(tokenId);
			const effectiveMax = failed ? maxTotal : Math.floor(maxTotal / 2);
			const actualDamage = (dmgEntry.hpDamage ?? 0) + (dmgEntry.tempDamage ?? 0);
			const shortfall = effectiveMax - actualDamage;
			if (shortfall <= 0) continue;

			const topUpRoll = await new Roll(`${shortfall}`).evaluate();
			new MidiQOL.DamageOnlyWorkflow(
				caster,
				casterToken,
				topUpRoll.total,
				"necrotic",
				[targetToken],
				topUpRoll,
				{ flavor: "Blight (maximized)" },
			);
		}
	} catch (err) {
		console.error("Blight |", err);
	}
}
