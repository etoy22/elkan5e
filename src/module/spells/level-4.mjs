/**
 * Runs vampiric Smite spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function vampiricSmite(workflow) {
	const { damage, damageMultiplier } =
		workflow.damageItem.damageDetail[0].find((d) => d.type === "necrotic") || {};
	if (damage && workflow.hitTargets.size === 1) {
		const dmgToApply = Math.floor((damage * damageMultiplier) / 2);
		await MidiQOL.applyTokenDamage(
			[
				{
					damage: dmgToApply,
					type: "healing",
					flavor: "Life Steal",
				},
			],
			dmgToApply,
			new Set([token]),
			null,
			null,
		);
	}
}

/**
 * Grants an AC bonus based on spell level and the caster's equipped shield.
 *
 * @param {object} workflow - Workflow containing actor and item data.
 * @param {Actor} workflow.actor - The actor casting the spell.
 * @param {Item} workflow.item - The Shield spell item.
 * @returns {Promise<void>}
 */
