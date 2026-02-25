/**
 * Runs arch Druid class feature automation.
 *
 * @param {*} actor - Actor document to process.
 * @returns {void} Operation result.
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
