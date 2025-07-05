/**
 * Adds functionality to Archdruid.
 * @param {object} actor - The actor instance.
 */
export function archDruid(actor) {
    if (actor.items.find(i => i.system.identifier === "archdruid") && (game.user.isGM || actor.isOwner)) {
        ui.notifications.notify(game.i18n.format("elkan5e.notifications.ArchDruidNotification", { name: actor.name }));
    }
}