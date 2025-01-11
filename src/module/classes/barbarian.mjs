/**
 * Adds functionality to Feral Instincts and Improved Feral Instincts.
 *   @param {object} actor - The actor instance.
 */
export function feral(actor) {
    const RAGE = actor.items.find(i => i.name === "Rage");
    
    // Set the default notification message
    let notification = "elkan5e.notifications.FeralInstincts";
    
    // Check if the actor has Feral Instincts or Improved Feral Instincts
    if (RAGE && (actor.items.find(i => i.name === "Feral Instincts") || actor.items.find(i => i.name === "Improved Feral Instincts"))) {
        if (actor.items.find(i => i.name === "Improved Feral Instincts")) {
            notification = "elkan5e.notifications.ImprovedFeralInstincts";
        }
        
        let uses = RAGE.system.uses.max - RAGE.system.uses.spent;
        if (uses > 0 && actor.isOwner) {
            ui.notifications.notify(game.i18n.format(notification, { name: actor.name }));
        }
    }
}