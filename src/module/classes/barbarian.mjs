/**
 * Adds functionality to Feral Instincts and Improved Feral Instincts.
 *   @param {object} actor - The actor instance.
 */
export function feral(actor) {
    const RAGE = actor.items.find(i => i.name === "Rage");

    // Set the default notification message
    let notification = "elkan5e.notifications.FeralInstincts";

    // Check if the actor has Feral Instincts or Improved Feral Instincts
    if (RAGE && (actor.items.find(i => i.name === "Feral Instinct") || actor.items.find(i => i.name === "Improved Feral Instincts"))) {
        if (actor.items.find(i => i.name === "Improved Feral Instincts")) {
            notification = "elkan5e.notifications.ImprovedFeralInstincts";
        }

        let uses = RAGE.system.uses.max - RAGE.system.uses.spent;
        if (uses > 0 && actor.isOwner) {
            ui.notifications.notify(game.i18n.format(notification, { name: actor.name }));
        }
    }
}

export async function rage(workflow) {
    console.log("Elkan 5e | Rage triggered");
    const actor = workflow.actor;
    let notification = "elkan5e.notifications.FeralInstinctsMove";
    if ((actor.items.find(i => i.name === "Feral Instinct") || actor.items.find(i => i.name === "Improved Feral Instincts"))) {
        // console.log("Feral Instincts or Improved Feral Instincts found");
        if (actor.items.find(i => i.name === "Improved Feral Instincts")) {
            notification = "elkan5e.notifications.ImprovedFeralInstinctsMove";
        }
        if (actor.isOwner) {
            ui.notifications.notify(game.i18n.format(notification, { name: actor.name }));
        }
    }
}


export async function wildBlood(workflow) {
    const item = workflow.item;
    const scope = workflow.scope;
    if (!game.modules.get("elkan5e")?.active) return;

    if (item.type !== "spell" || !item.system.activities) return;

    const activityId = scope.workflow.uuid?.split(".").pop();
    let type = item.system.activities.find(a => a.id === activityId).type
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


    if (["Prismatic Bolt", "Mirror Image", "Blink", "Confusion", "Prismatic Spray"].includes(item.name)) {

        let confirmed = await new Promise((resolve) => {
            new Dialog({
                title: "Wild Surge",
                content: `<p>Do you want to trigger a Wild Surge?</p>`,
                buttons: {
                    yes: {
                        label: "Yes",
                        callback: () => resolve(true)
                    },
                    no: {
                        label: "No",
                        callback: () => resolve(false)
                    }
                },
                default: "no"
            }).render(true);
        });

        if (!confirmed) return;
        if (type != "utility" || ["Mirror Image", "Blink"].includes(item.name)) {
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