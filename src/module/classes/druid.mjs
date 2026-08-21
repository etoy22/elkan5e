import { createLightRegion } from "../shared/helpers.mjs";

/**
 * Runs Lurking Fog automation: a murky, low-hanging bank of fog.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function lurkingFogDarkness(workflow) {
	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 0,
				bright: 15,
				alpha: 0.3,
				luminosity: 0.5,
				negative: true,
				color: "#4a5d4a",
				animation: {
					type: "fog",
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
 * Runs arch Druid class feature automation.
 *
 * @param {*} actor - Actor document to process.
 */
export function archDruid(actor) {
	if (
		actor.items.find((i) => i.system.identifier === "archdruid") &&
		(game.user.isGM || actor.isOwner)
	) {
		ui.notifications.notify(
			game.i18n.format("elkan5e.notifications.ArchDruidNotification", {
				name: actor.name,
			}),
		);
	}
}
