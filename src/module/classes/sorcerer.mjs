const WILD_SURGE_THRESHOLD = 5;
const MAX_TABLE_LEVEL = 10
/**
 * Handle the wild surge effect after casting a spell.
 * @param {object} activity - The activity performed.
 */
export async function wildSurge(activity) {
    if (!activity?.actor?.items || !activity?.item?.system?.level) {
        console.warn("Invalid activity parameters for wildSurge");
        return;
    }
    const actor = activity.actor;
    const item = activity.item;
    const level = item.system.level;

    // Check if the item is a spell and its level is greater than 0 and the activity is a ritual or the spell consumes a spell slot or the item is a scroll
    if ((item.type === "spell" && level > 0 && (activity.name == "Ritual" || activity.consumption.spellSlot == true))|| (item.type=="consumable" && item.system.type.value=="scroll")) {
        const wild = actor.items.find(i => i.name === "Random Wild Surge");
        const volen = actor.effects.find(i => i.name === "Volentary Surge");
        const blowout = actor.effects.find(i => i.name === "Magical Blowout");
        let rollAbove = false;
        const tableUUIDs = [
            null, // No table for level 0 spells
            "GDE5tgmRfX1GiOQs",
            "mxwqgbo7xnNXSnIm",
            "Fwl1JxM19LzeYxjJ",
            "0TDp89O9iGt4zovG",
            "V4BRRp6vWntQNVwa",
            "4TsMG2a2EtcLdgkc",
            "wt2VfjYQyuvwftih",
            "xkUpS2XBuSdyVEah",
            "LV2skOm8hCwM1JRH",
            "O7JYPPoDS7gLGkNj"
        ];

        // Roll a d6 if the actor has the "Random Wild Surge" item
        if (wild) {
            try {
                const roll = await new Roll("1d6").roll({ async: true });
                await roll.toMessage({
                    flavor: "Random Wild Surge",
                    speaker: ChatMessage.getSpeaker({ actor: actor })
                });
            }
            catch (error){
                console.error("Error rolling wild surge: ", error);
                return; // Exit early if the roll fails
            }
            if (roll.total >= WILD_SURGE_THRESHOLD) {
                rollAbove = true;
            }
        }

        // Determine if a wild surge should occur
        if (rollAbove || volen || blowout) {
            let count = 0;
            if (rollAbove) count++;
            if (volen) count++;
            if (blowout) count++;

            // Calculate the table level based on the spell level and additional conditions
            let tableLevel = level - 1 + count;
            if (tableLevel > MAX_TABLE_LEVEL) tableLevel = MAX_TABLE_LEVEL;

            let tableUUID = tableUUIDs[tableLevel];

            // Draw from the appropriate roll table if it exists
            if (tableUUID) {
                const table = await fromUuid(`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${tableUUID}`);
                if (table) {
                    table.draw();
                }
            } else {
                console.log("No table found for this spell level.");
            }
        }
    }
}