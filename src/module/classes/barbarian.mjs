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

export async function wildBlood(activity) {
    const actor = activity.actor;
    const item = activity.item;
    const level = item.system.level;
    const TABLE_UUIDS = [
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
    const wild = actor.items.find(i => i.name === "Wild Blood");
    if (wild && ["Prismatic Bolt", "Mirror Image", "Blink", "Confusion", "Prismatic Spray"].includes(item.name)) {
        const activityType = activity.type;
        console.log(activityType);
        if (activityType != "utility" || ["Mirror Image", "Blink"].includes(item.name)) {
            let tableUUID = TABLE_UUIDS[level];
            if (tableUUID) {
                try {
                    const table = await fromUuid(`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${tableUUID}`);
                    if (table) {
                        table.draw({ displayChat: true });
                    }
                }
                catch (error) {
                    console.error("Error drawing from Wild Blood table: ", error);
                }
            }
        }
    }

}