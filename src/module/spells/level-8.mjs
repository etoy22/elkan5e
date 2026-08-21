import { createLightRegion } from "../shared/helpers.mjs";

/**
 * Runs Incendiary Cloud spell automation: roiling smoke lit from within by
 * embers.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function incendiaryCloudDarkness(workflow) {
	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 0,
				bright: 15,
				alpha: 0.3,
				luminosity: 0.5,
				negative: true,
				color: "#e2703a",
				animation: {
					type: "torch",
					speed: 2,
					intensity: 5,
				},
				priority: 30,
			},
			"Darkness",
		);
	}
}
