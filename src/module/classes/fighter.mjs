/**
 * Adds functionality to Persistent Leader which does this "When you use your Second Wind ability, you regain one use of your Rally feature and one use of your Commander's Strike feature."
 * TODO: Clean up and make it work. Max = xxxFeature.system.uses.max, Spent = xxxFeature.system.uses.spent
 */
export function perLeader(item) {
    if (item.name === "Second Wind" && actor.items.find(i => i.name === "Persistent Leader")) {
        const rallyFeature = item.actor.items.find(i => i.name === "Rally");
        const commandersStrikeFeature = item.actor.items.find(i => i.name === "Commander's Strike");

        if (rallyFeature) {
            rallyFeature.update({ "data.uses.spent": rallyFeature.data.uses.value + 1 });
        }

        if (commandersStrikeFeature) {
            commandersStrikeFeature.update({ "data.uses.value": commandersStrikeFeature.data.data.uses.value + 1 });
        }
        if (game.user.isGM || item.actor.isOwner) {
            ui.notifications.notify("Persistent Leader: Regained one use of Rally and Commander's Strike.");
        }
    }
}

