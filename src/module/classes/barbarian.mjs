/**
 * Adds functionality to Feral Instincts and Improved Feral Instincts.
 *   @param {object} actor - The actor instance.
 */
export function feral(actor) {
    const rageFeature = actor.items.find(i => i.name === "Rage");
    let notification = "elkan5e.notifications.FeralInstincts";
    if (rageFeature && (actor.items.find(i => i.name === "Feral Instincts") || actor.items.find(i => i.name === "Improved Feral Instincts"))) {
        if (actor.items.find(i => i.name === "Improved Feral Instincts")) {
            notification = "elkan5e.notifications.ImprovedFeralInstincts";
        }
        let uses = rageFeature.system.uses.max - rageFeature.system.uses.spent;
        if (uses > 0 && actor.isOwner) {
            ui.notifications.notify(game.i18n.format(notification, { name: actor.name }));
        }
    }
}