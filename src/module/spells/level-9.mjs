import { drainedEffect, forEachDamagedTarget } from "../shared/helpers.mjs";
import { damageOnly } from "../shared/midi-compat.mjs";

/**
 * Deals additional force damage to each target with recorded HP or temporary-HP damage:
 * half its maximum HP, rounded down and capped at 100. Targets that did not save also lose
 * that much maximum HP until a long rest.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function wrathOfTheReaper(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = casterToken.actor.uuid;
	const itemData = { type: "spell", img: "icons/magic/death/weapon-scythe-rune-green.webp" };

	await forEachDamagedTarget(workflow, async (targetToken, _damage, dmgEntry) => {
		const maxHp = targetToken.actor.system.attributes.hp.max;
		const forceDamage = Math.min(Math.floor(maxHp / 2), 100);
		if (forceDamage <= 0) return;

		const damageRoll = await new Roll(`${forceDamage}`).evaluate();
		await damageOnly(
			caster,
			casterToken,
			damageRoll.total,
			"force",
			[targetToken],
			damageRoll,
			{ itemData, flavor: "Wrath of the Reaper Damage" },
		);

		if (!dmgEntry.saved) {
			await drainedEffect(
				targetToken.actor,
				forceDamage,
				"Wrath of the Reaper",
				itemData.img,
				casterUuid,
			);
		}
	});
}
