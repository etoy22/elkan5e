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
		if ((workflow.activity?.actionType !== "mwak" && workflow.activity?.actionType !== "msak") || !workflow.hitTargets?.size) return;

		const attackerToken = workflow.token;
		if (!attackerToken) return;

		for (const targetToken of Array.from(workflow.hitTargets)) {
			const defenderActor = targetToken.actor;
			if (!defenderActor) continue;

			// Check if this target has an active Fire Shield effect (Hot or Cold).
			const shieldEffect = defenderActor.effects.find(
				(e) => !e.disabled && (e.name === "Fire Shield [Hot]" || e.name === "Fire Shield [Cold]"),
			);
			if (!shieldEffect) continue;

			// Find the Fire Shield item on the defender and get the damage formula
			// from its damage activity so it stays in sync with the item data.
			const shieldItem = defenderActor.items.find((i) => i.system.identifier === "fire-shield");
			const shieldActivity = shieldItem?.system.activities.find((a) => a.type === "damage");
			const damagePart = shieldActivity?.damage?.parts?.[0];
			const damageFormula = damagePart
				? `${damagePart.number}d${damagePart.denomination}[${damagePart.types?.[0] ?? "fire"}]`
				: "2d8[fire]";
			const damageType = damagePart?.types?.[0] ?? "fire";

			const damageRoll = await new Roll(damageFormula).evaluate();

			await new MidiQOL.DamageOnlyWorkflow(
				defenderActor,
				targetToken,
				damageRoll.total,
				damageType,
				[{ token: attackerToken, actor: attackerToken.actor }],
				{
					flavor: "Fire Shield",
					itemCardId: "new",
					isCritical: false,
					damageRoll,
				},
			);
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
