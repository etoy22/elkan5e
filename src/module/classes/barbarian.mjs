/**
 * Adds functionality to Feral Instincts.
 *   @param {object} actor - The actor instance.
 */
export function feral(actor) {
    const rageFeature = actor.items.find(i => i.name === "Rage");
    if (rageFeature && actor.items.find(i => i.name === "Feral Instincts") && !actor.items.find(i => i.name === "Improved Feral Instincts")) {
        let uses = rageFeature.system.uses.max - rageFeature.system.uses.spent;
        if (uses > 0) {
            if (actor.isOwner) {
                ui.notifications.notify(`${actor.name} - Feral Instincts: When you roll initiative, you can enter Rage immediately. If you are surprised, you end the surprised condition when you enter Rage in this way. If you are not surprised, you can immediately move up to half of your movement.`);
            }
        }
    }
}

/**
 * Adds functionality to Improved Feral Instincts.
 *   @param {object} actor - The actor instance.
 */
export function improvedFeral(actor) {
    const rageFeature = actor.items.find(i => i.name === "Rage");
    if (rageFeature && actor.items.find(i => i.name === "Improved Feral Instinct")) {
        let uses = rageFeature.system.uses.max - rageFeature.system.uses.spent;
        if (uses > 0) {
            if (actor.isOwner) {
                ui.notifications.notify(`${actor.name} - Improved Feral Instinct: When you roll initiative, you can enter Rage immediately. If you are surprised, you end the surprised condition when you enter Rage in this way. You can immediately move up to your movement speed.`);
            }
        }
    }
}