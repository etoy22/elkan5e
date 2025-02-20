/**
 * Adds functionality to Persistent Leader which does this:
 * "When you use your Second Wind ability, you regain one use of your Rally feature and one use of your Commander's Strike feature."
 * @param {object} activity - The activity performed.
 */
export function perLeader(activity) {
    const item = activity.item;
    const actor = activity.actor;

    if (item.name === "Second Wind" && actor.items.find(i => i.name === "Persistent Leader")) {
        const rallyFeature = actor.items.find(i => i.name === "Rally");

        if (rallyFeature) {
            rallyFeature.update({ "system.uses.spent": Math.max(rallyFeature.system.uses.spent - 1, 0) })
        }

       
        if (game.user.isGM || actor.isOwner) {
            ui.notifications.notify(game.i18n.format("elkan5e.notifications.PersistentLeader", { name: actor.name }));
        }
    }
}

/**
 * Adds functionality to Rallying Surge which does this:
 * "When you use your Action Surge, choose up to 3 allies within 60 ft. You shout a command, and each ally can use their reaction to immediately use an action. They can use any action available to them, but they cannot cast a spell of 1st level or higher."
 * @param {object} activity - The activity performed.
 */
export function rallySurge(activity) {
    const item = activity.item;
    const actor = activity.actor;

    if (item.name === "Action Surge" && actor.items.find(i => i.name === "Rallying Surge")) {
        if (game.user.isGM || actor.isOwner) {
            ui.notifications.notify(game.i18n.format("elkan5e.notifications.RallyingSurge", { name: actor.name }));
        }
    }
}
