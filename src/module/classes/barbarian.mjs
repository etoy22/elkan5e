/**
 * Adds functionality to Feral Instincts.
 *   @param {object} actor - The actor instance.
 */
export function feral(actor) {
    console.log("feral called", { actor });
    const rageFeature = actor.items.find(i => i.name === "Rage");
    if (rageFeature && rageFeature.system.uses.value > 0 && actor.items.find(i => i.name === "Feral Instincts") && !actor.items.find(i => i.name === "Improved Feral Instincts") && !actor.effects.find(e => e.name === "Surprised")) {
        console.log("feral called", { actor });
        if (actor.isOwner) {
            console.log("feral called", { actor });
            ui.notifications.notify(`${actor.name} - Feral Instincts: When you roll initiative, you can enter Rage immediately. If you are surprised, you end the surprised condition when you enter Rage in this way. If you are not surprised, you can immediately move up to half of your movement.`);
        }
    }
}

/**
 * Adds functionality to Improved Feral Instincts.
 *   @param {object} actor - The actor instance.
 */
export function improvedFeral(actor) {
    console.log("ELKAN5e actor:", actor)
    const rageFeature = actor.items.find(i => i.name === "Rage");
    console.log("ELKAN5e Rage:", rageFeature)
    if (rageFeature && rageFeature.system.uses.value > 0 && actor.items.find(i => i.name === "Improved Feral Instincts")) {
        console.log("ELKAN5e actor:", actor)
        if (actor.isOwner || game.user.isGM) {
            console.log("ELKAN5e actor:", actor)
            ui.notifications.notify(`${actor.name} - Improved Feral Instincts: When you roll initiative, you can enter Rage immediately. If you are surprised, you end the surprised condition when you enter Rage in this way. You can immediately move up to your movement speed.`);
        }
    }
}