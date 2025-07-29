const DialogV2 = foundry.applications.api.DialogV2;

export async function rage(workflow) {
    console.log("Elkan 5e | Rage triggered");
    const actor = workflow.actor;
    let notification = "elkan5e.notifications.FeralInstinctsMove";

    // Use system.identifier instead of name
    const hasFeral = actor.items.find(i => i.system.identifier === "feral-instinct");
    const hasImproved = actor.items.find(i => i.system.identifier === "improved-feral-instincts");

    if (hasFeral || hasImproved) {
        if (hasImproved) {
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

        let confirmed = await DialogV2.confirm({
            window: { title: game.i18n.localize("elkan5e.barbarian.wildBloodTitle") },
            content: `<p>${game.i18n.localize("elkan5e.barbarian.wildBloodContent")}</p>?`,
            rejectClose: false,
            modal: true
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