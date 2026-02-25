import { createLightFromTemplate } from "./level-2.mjs";

/**
 * Runs light spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function light(workflow) {
	return createLightFromTemplate(
		workflow,
		{
			dim: 40,
			bright: 20,
			alpha: 0.3,
			angle: 360,
			luminosity: 0.5,
			saturation: 0,
			contrast: 0,
			shadows: 0,
			negative: false,
			animation: {
				type: "",
				speed: 2,
				intensity: 5,
			},
		},
		1,
	);
}

/**
 * Creates a continual flame light source from the last measured template.
 *
 * @param {object} workflow - Workflow for the spell cast.
 * @returns {Promise<void>}
 */
