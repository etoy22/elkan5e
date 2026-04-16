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

	const healingRoll = await new Roll(`${healAmount}`).evaluate({ async: true });
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
 * Grants an AC bonus based on spell level and the caster's equipped shield.
 *
 * @param {object} workflow - Workflow containing actor and item data.
 * @param {Actor} workflow.actor - The actor casting the spell.
 * @param {Item} workflow.item - The Shield spell item.
 * @returns {Promise<void>}
 */
