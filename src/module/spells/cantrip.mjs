import { createLightRegion } from "../shared/helpers.mjs";

/**
 * Runs Smoke Field spell automation: a thick, brownish-grey cloud of
 * mundane smoke.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function smokeFieldDarkness(workflow) {
	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 0,
				bright: 15,
				alpha: 0.3,
				luminosity: 0.5,
				negative: true,
				color: "#5b5b52",
				animation: {
					type: "roiling",
					speed: 2,
					intensity: 5,
				},
				priority: 30,
			},
			"Darkness",
		);
	}
}

/**
 * Runs light spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function light(workflow) {
	const workflowCastLevel = Number(workflow.castData?.castLevel);
	const itemSpellLevel = Number(workflow.item?.system?.level);
	const spellLevel = Number.isFinite(workflowCastLevel)
		? workflowCastLevel
		: Number.isFinite(itemSpellLevel)
			? itemSpellLevel
			: 0;

	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 40,
				bright: 20,
				alpha: 0.3,
				luminosity: 0.5,
				animation: {
					type: "",
					speed: 2,
					intensity: 5,
				},
				priority: spellLevel,
			},
			"Light",
		);
	}
}
