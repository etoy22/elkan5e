import { drainedEffect, forEachDamagedTarget } from "../shared/effects.mjs";

/**
 * Runs wrath Of The Reaper spell automation.
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

		const damageRoll = await new Roll(`${forceDamage}`).evaluate({ async: true });
		new MidiQOL.DamageOnlyWorkflow(
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

/**
 * Automation for the Enlarge spell: increases the size of each failed target by one step.
 *
 * @param {object} workflow - Workflow containing `_failedSaves` from the cast.
 * @returns {Promise<void>}
 */
