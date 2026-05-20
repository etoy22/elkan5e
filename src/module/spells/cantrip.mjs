import { createLightRegion } from "../shared/helpers.mjs";

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
				sort: spellLevel,
			},
			"Light",
		);
	}
}
