/**
 * Adds functionality to Archdruid.
 * @param {object} actor - The actor instance.
 */
export function archDruid(actor) {
    if (actor.items.find(i => i.name === "Archdruid") && actor.isOwner) {
        ui.notifications.notify(`${actor.name} - Archdruid: You can use any of your Wild Shape abilities for free. If you are surprised, you instead use Wild Shape for free without an action cost at the beginning of your turn.`);
    }
}