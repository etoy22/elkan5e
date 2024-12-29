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
        const commandersStrikeFeature = actor.items.find(i => i.name === "Commander's Strike");

        if (rallyFeature) {
            rallyFeature.update({ "system.uses.spent": rallyFeature.system.uses.spent - 1 });
        }

        if (commandersStrikeFeature) {
            commandersStrikeFeature.update({ "system.uses.spent": commandersStrikeFeature.system.uses.spent - 1 });
        }
        if (game.user.isGM || actor.isOwner) {
            ui.notifications.notify(`${actor.name} - Your Persistent Leader feature has caused you to regain one use of Rally and one use of Commander's Strike. This has been automatically applied.`);
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
        const rallySurge = actor.items.find(i => i.name === "Rallying Surge");
        if (game.user.isGM || actor.isOwner) {
            ui.notifications.notify(`${actor.name} - Rallying Surge: Choose up to 3 allies within 60 ft. Each ally can use their reaction to immediately use an action, but they cannot cast a spell of 1st level or higher.`);
        }
    }
}
