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

		const activity = macroItem.system.activities.get("66Qhs5vOSnBGeqBW");
		if (!activity) {
			console.warn("Fire Shield: activity 66Qhs5vOSnBGeqBW not found on item");
			return;
		}

		// Temporarily target the attacker so the activity fires on them.
		const previousTargets = Array.from(game.user.targets).map(t => t.id);
		game.user.updateTokenTargets([attackerToken.id]);

		await activity.use({ event: workflow.event });

		// Restore whatever the user had targeted before.
		game.user.updateTokenTargets(previousTargets);
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
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const damageDetail = workflow.damageItem?.damageDetail ?? [];
	const flatDamageDetail = Array.isArray(damageDetail[0]) ? damageDetail.flat() : damageDetail;
	const necroticEntry = flatDamageDetail.find((d) => d.type === "necrotic");
	const necroticDamage = Number(necroticEntry?.damage ?? necroticEntry?.value ?? 0);
	const damageMultiplier = Number(necroticEntry?.damageMultiplier ?? 1);
	if (!caster || !casterToken || necroticDamage <= 0 || workflow.hitTargets.size !== 1) return;

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
