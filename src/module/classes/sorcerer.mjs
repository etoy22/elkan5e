/**
 * Handle the wild surge effect after casting a spell.
 * @param {object} activity - The activity performed.
*/
export async function wildSurge(activity) {
    const actor = activity.actor;
    const item = activity.item;
    const level = item.system.level;
    const WILD_SURGE_THRESHOLD = 5;
    const MAX_TABLE_LEVEL = 10;
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

    if ((item.type === "spell" && level > 0 && (activity.name === "Ritual" || activity.consumption.spellSlot)) || 
        (item.type === "consumable" && item.system.type.value === "scroll")) {
        const wild = actor.items.find(i => i.name === "Random Wild Surge");
        const volen = actor.effects.find(i => i.name === "Voluntary Surge");
        const blowout = actor.effects.find(i => i.name === "Magical Blowout");
        let rollAbove = false;

        if (wild) {
            try {
                const roll = await new Roll("1d6").roll({ async: true });
                await roll.toMessage({
                    flavor: game.i18n.localize("elkan5e.wildMage.randomWildSurge"),
                    speaker: ChatMessage.getSpeaker({ actor: actor })
                });
                if (roll.total >= WILD_SURGE_THRESHOLD) {
                    rollAbove = true;
                }
            } catch (error) {
                console.error("Error rolling wild surge: ", error);
                return;
            }
        }

        if (rollAbove || volen || blowout) {
            let count = 0;
            if (rollAbove) count++;
            if (volen) count++;
            if (blowout) count++;
            let tableLevel = Math.min(level - 1 + count, MAX_TABLE_LEVEL);
            let tableUUID = TABLE_UUIDS[tableLevel];
            let rollResult = "";

            if (tableUUID) {
                try {
                    const table = await fromUuid(`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${tableUUID}`);
                    if (table) {
                        const results = await table.draw({ displayChat: true });
                        rollResult = results.results[0].text;
                    }
                } catch (error) {
                    console.error("Error drawing from roll table: ", error);
                }
                const avert = actor.items.find(i => i.name === "Avert Disaster");
                const delay = actor.items.find(i => i.name === "Delayed Surge");
                let buttons = {};

                if (avert) {
                    buttons.avert = {
                        label: game.i18n.localize("elkan5e.wildMage.avertDisaster"),
                        callback: async () => {
                            await avert.update({ "system.uses.spent": avert.system.uses.spent + 1 });
                            ui.notifications.info(game.i18n.localize("elkan5e.wildMage.avertDisasterUsed"));
                            try {
                                const table = await fromUuid(`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${tableUUID}`);
                                if (table) {
                                    await table.draw({ displayChat: true });
                                }
                            } catch (error) {
                                console.error("Error drawing from roll table: ", error);
                            }
                            let buttons = {}
                            const delayButton = await createDelayButton(actor, rollResult);
                            if (delayButton) buttons.delay = delayButton;
                            buttons.cancel = await createCancelButton();
            
                            if (Object.keys(buttons).length > 1 && delay.system.uses.spent < delay.system.uses.max) {
                                new Dialog({
                                    title: game.i18n.localize("elkan5e.wildMage.wildSurgeAbilities"),
                                    content: `
                                        <h2>${game.i18n.localize("elkan5e.wildMage.alterWildSurge")}</h2>
                                        <p>${game.i18n.localize("elkan5e.wildMage.abilityUsage")}</p>
                                        <p>${game.i18n.localize("elkan5e.wildMage.currentAbilities")}</p>
                                        ${delay ? `<p>${game.i18n.format("elkan5e.wildMage.delayedSurgeUses", { remaining: delay.system.uses.max - delay.system.uses.spent })}</p>` : ""}
                                    `,
                                    buttons: buttons
                                }).render(true);
                            } 
                        },
                        disabled: avert.system.uses.spent >= avert.system.uses.max
                    };
                }

                const delayButton = await createDelayButton(actor, rollResult);
                if (delayButton) buttons.delay = delayButton;
                buttons.cancel = await createCancelButton();

                if (Object.keys(buttons).length > 1 && (avert.system.uses.spent < avert.system.uses.max || delay.system.uses.spent < delay.system.uses.max)) {
                    new Dialog({
                        title: game.i18n.localize("elkan5e.wildMage.wildSurgeAbilities"),
                        content: `
                            <h2>${game.i18n.localize("elkan5e.wildMage.alterWildSurge")}</h2>
                            <p>${game.i18n.localize("elkan5e.wildMage.abilityUsage")}</p>
                            <p>${game.i18n.localize("elkan5e.wildMage.currentAbilities")}</p>
                            ${avert ? `<p>${game.i18n.format("elkan5e.wildMage.avertDisasterUses", { remaining: avert.system.uses.max - avert.system.uses.spent })}</p>` : ""}
                            ${delay ? `<p>${game.i18n.format("elkan5e.wildMage.delayedSurgeUses", { remaining: delay.system.uses.max - delay.system.uses.spent })}</p>` : ""}
                        `,
                        buttons: buttons
                    }).render(true);
                }
            }
        }
    }
}

async function createDelayButton(actor, rollResult) {
    const delay = actor.items.find(i => i.name === "Delayed Surge");
    if (!delay) return null;

    return {
        label: game.i18n.localize("elkan5e.wildMage.delayedSurge"),
        callback: async () => {
            await delay.update({ "system.uses.spent": delay.system.uses.spent + 1 });
            ui.notifications.info(game.i18n.localize("elkan5e.wildMage.delayedSurgeUsed"));
            const delayedSurge = {
                name: game.i18n.localize("elkan5e.wildMage.delayedWildSurge"),
                type: "consumable",
                img: "icons/magic/defensive/barrier-shield-dome-deflect-blue.webp",
                system: {
                    uses: {
                        spent: 0,
                        max: 1,
                        autoDestroy: true
                    },
                    description: {
                        value: game.i18n.format("elkan5e.wildMage.delayedWildSurgeDescription", { result: rollResult })
                    },
                    identifier: "delayed-wild-surge",
                    source: {
                        source: "Elkan5e"
                    },
                    properties: [
                        "mgc"
                    ]
                }
            };

            const delayedSurgeEffect = {
                name: game.i18n.localize("elkan5e.wildMage.delayedWildSurgeDuration"),
                transfer: false,
                img: "icons/magic/defensive/barrier-shield-dome-deflect-blue.webp",
                duration: {
                    seconds: 3600
                },
                flags: {
                    dae: {
                        selfTarget: true,
                        stackable: "multi",
                        specialDuration: [
                            "shortRest"
                        ]
                    }
                }
            };

            await actor.createEmbeddedDocuments("Item", [delayedSurge]);
            await actor.createEmbeddedDocuments("ActiveEffect", [delayedSurgeEffect]);
            ui.notifications.info(game.i18n.localize("elkan5e.wildMage.delayedWildSurgeAdded"));
        },
        disabled: delay.system.uses.spent >= delay.system.uses.max
    };
}

async function createCancelButton() {
    return {
        label: game.i18n.localize("elkan5e.wildMage.cancel"),
        callback: () => {
            ui.notifications.info(game.i18n.localize("elkan5e.wildMage.noAbilitiesUsed"));
        }
    };
}

export async function delayedDuration(effect){
    if (effect.name === game.i18n.localize("elkan5e.wildMage.delayedWildSurgeDuration")) {
        const actor = effect.parent;
        const delayed = actor.items.find(i => i.name === game.i18n.localize("elkan5e.wildMage.delayedWildSurge"));
        if (delayed) {
            const description = delayed.system.description.value.replace(game.i18n.localize("elkan5e.wildMage.delayedWildSurgeDescriptionPrefix"), "").trim();
            const chatData = {
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                content: `<p>${description}</p><p>${game.i18n.localize("elkan5e.wildMage.delayedWildSurgeEnded")}</p>`
            };
            ChatMessage.create(chatData);
            await delayed.delete();
        }
    }
}

export async function delayedItem(item){
    if (item.name === game.i18n.localize("elkan5e.wildMage.delayedWildSurge")) {
        const actor = item.parent;
        const effect = actor.effects.find(e => e.name === game.i18n.localize("elkan5e.wildMage.delayedWildSurgeDuration"));
        if (effect) {
            await effect.delete();
        }
    }
}