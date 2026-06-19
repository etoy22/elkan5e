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
