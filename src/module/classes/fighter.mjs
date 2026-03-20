/**
 * Runs second Wind class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function secondWind(workflow) {
	const actor = workflow.actor;
	persistentLeader(actor);
	rallySurge(actor);
}

/**
 * Runs persistent Leader class feature automation.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function persistentLeader(actor) {
	if (actor.items.find((i) => i.system.identifier === "persistent-leader")) {
		const rallyFeature = actor.items.find((i) => i.system.identifier === "rally");

		if (rallyFeature) {
			rallyFeature.update({
				"system.uses.spent": Math.max(rallyFeature.system.uses.spent - 1, 0),
			});
		}

		if (game.user.isGM || actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.PersistentLeader", {
					name: actor.name,
				}),
			);
		}
	}
}

/**
 * Runs rally Surge class feature automation.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function rallySurge(actor) {
	if (actor.items.find((i) => i.system.identifier === "rallying-surge")) {
		if (game.user.isGM || actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.RallyingSurge", {
					name: actor.name,
				}),
			);
		}
	}
}
