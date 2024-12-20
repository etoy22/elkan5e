// Persistent Leader

/**
 * Adds functionality to Persistent Leader which does this "When you use your Second Wind ability, you regain one use of your Rally feature and one use of your Commander's Strike feature."
 */
export function perLeader(item) {
    if (item.name === "Second Wind" && item.actor.items.find(i => i.name === "Persistent Leader")) {
        const rallyFeature = item.actor.items.find(i => i.name === "Rally");
        const commandersStrikeFeature = item.actor.items.find(i => i.name === "Commander's Strike");

        if (rallyFeature) {
            rallyFeature.update({ "data.uses.value": rallyFeature.data.data.uses.value + 1 });
        }

        if (commandersStrikeFeature) {
            commandersStrikeFeature.update({ "data.uses.value": commandersStrikeFeature.data.data.uses.value + 1 });
        }
        if (game.user.isGM || item.actor.isOwner) {
            ui.notifications.notify("Persistent Leader: Regained one use of Rally and Commander's Strike.");
        }
    }
}

