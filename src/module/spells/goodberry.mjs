export async function goodberry(workflow) {
    const actor = workflow.actor;
    const item = workflow.item;
    // console.log(`${item.name} spell activated`);

    // Determine the spell level and calculate the number of berries
    const level = Math.max(item.system.level, 1);
    let berry = (level + 1) * 5;
    const img = item.img;

    // Define the item to be created
    const consumableItem = {
        "name": `${item.name} (Item)`,
        "type": "consumable",
        "img": `${img}`,
        "system": {
            "activities": {
                "aL7vnNQ8QKdl98gJ": {
                    "type": "heal",
                    "_id": "aL7vnNQ8QKdl98gJ",
                    "sort": 0,
                    "activation": {
                        "type": "action",
                        "value": null,
                        "override": false,
                        "condition": ""
                    },
                    "consumption": {
                        "scaling": {
                            "allowed": true,
                            "max": ""
                        },
                        "spellSlot": true,
                        "targets": [
                            {
                                "type": "itemUses",
                                "value": "1",
                                "target": "",
                                "scaling": {
                                    "mode": "amount"
                                }
                            }
                        ]
                    },
                    "duration": {
                        "units": "inst",
                        "concentration": false,
                        "override": false
                    },
                    "effects": [],
                    "range": {
                        "override": false,
                        "units": "touch",
                        "special": ""
                    },
                    "target": {
                        "template": {
                            "contiguous": false,
                            "units": "ft",
                            "type": ""
                        },
                        "affects": {
                            "choice": false,
                            "count": "",
                            "type": "creature",
                            "special": ""
                        },
                        "override": false,
                        "prompt": true
                    },
                    "uses": {
                        "spent": 0,
                        "recovery": [],
                        "max": ""
                    },
                    "healing": {
                        "number": null,
                        "denomination": 0,
                        "types": [
                            "healing"
                        ],
                        "custom": {
                            "enabled": true,
                            "formula": "1"
                        },
                        "scaling": {
                            "number": null,
                            "mode": "whole",
                            "formula": "1"
                        },
                        "bonus": ""
                    },
                    "macroData": {
                        "name": "",
                        "command": ""
                    }
                }
            },
            "uses": {
                "spent": 0,
                "recovery": [],
                "autoDestroy": true,
                "max": berry
            },
            "description": {
                "value": "",
                "chat": ""
            },
            "identifier": "",
            "source": {
                "revision": 1,
                "rules": "2024",
                "book": "Elkan 5e",
                "page": "",
                "custom": "",
                "license": ""
            },
            "identified": true,
            "unidentified": {
                "description": ""
            },
            "container": null,
            "quantity": 1,
            "weight": {
                "value": 0,
                "units": "lb"
            },
            "price": {
                "value": 0,
                "denomination": "gp"
            },
            "rarity": "",
            "attunement": "",
            "attuned": false,
            "equipped": false,
            "type": {
                "value": "food",
                "subtype": ""
            },
            "damage": {
                "base": {
                    "number": null,
                    "denomination": null,
                    "types": [],
                    "custom": {
                        "enabled": false
                    },
                    "scaling": {
                        "number": 1
                    }
                },
                "replace": false
            },
            "magicalBonus": null,
            "properties": [
                "mgc"
            ]
        }
    };

    // Ensure the actor exists
    if (!actor) {
        console.error("Actor not found for the spell.");
        return;
    }

    // Check if the item already exists on the actor
    const existingItem = actor.items.find(i => i.name === `${item.name} (Item)`);
    if (existingItem) {
        // Update the existing item's maximum uses
        await existingItem.update({ "system.uses.max": existingItem.system.uses.max + berry });
    } else {
        await actor.createEmbeddedDocuments("Item", [consumableItem]);
    }

    // Create an active effect to track the spell's duration
    const effectData = {
        name: `${item.name} Duration (Level ${level})`, // Added required name property
        label: `${item.name} Duration (Level ${level})`,
        icon: `${img}`,
        origin: item.uuid, // Tie to the existing item if it exists
        duration: { seconds: 3600 }, // 1 hour duration
        changes: [],
        flags: { dae: { specialDuration: ["longRest"] } }
    };

    const effect = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    if (effect.length > 0) {
        const effectId = effect[0].id;
    }
}

// Register global hook for deleting ActiveEffect
Hooks.on("deleteActiveEffect", async (deletedEffect, options, userId) => {
    const actor = deletedEffect.parent;
    if (!actor) {
        console.warn("deleteActiveEffect: No actor found for effect.");
        return;
    }
    if (!deletedEffect.name) {
        console.warn("deleteActiveEffect: Effect name is missing, skipping cleanup.");
        return;
    }
    const name = deletedEffect.name.replace(/ Duration \(Level \d+\)$/, "") + " (Item)";
    const levelMatch = deletedEffect.name.match(/Level (\d+)/);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : null;
    const item = actor.items.find(i => i.name === name);
    console.log("deleteActiveEffect: Triggered for name:", deletedEffect.name, "Looking for item:", name, "Found:", !!item, "Level:", level);
    if (item && level !== null) {
        await handleGoodberryItemCleanup(actor, level, item);
    } else {
        console.warn("deleteActiveEffect: No matching item found for cleanup.", { name, level });
    }
});

// Register global hook for deleting Item
Hooks.on("deleteItem", async (deletedItem, options, userId) => {
    const actor = deletedItem.parent;
    if (!actor) return;
    const name = deletedItem.name.replace(/ \(Item\)$/, "");
    const effects = actor.effects.filter(effect => effect.name && effect.name.includes(name));
    if (effects.length === 0) return;
    for (const effect of effects) {
        try {
            if (!await actor.effects.get(effect.id)) continue;
            await effect.delete();
            console.log("deleteItem: Deleted effect:", effect.name);
        } catch (error) {
            console.error(`Failed to delete effect: ${effect.name}`, error);
        }
    }
});

async function handleGoodberryItemCleanup(actor, level, itemOrName) {
    // Accepts either an item object or a name string
    let consumableItem = typeof itemOrName === "string" ? actor.items.find(i => i.name === itemOrName) : itemOrName;
    if (!consumableItem) {
        console.warn("handleGoodberryItemCleanup: Consumable item not found, skipping deletion.");
        return;
    }
    const berriesToRemove = (level + 1) * 5;
    const newMaxUses = Math.max(consumableItem.system.uses.max - berriesToRemove, 0);
    const newSpentUses = Math.min(Math.max(consumableItem.system.uses.spent - berriesToRemove, 0), newMaxUses);
    if (newMaxUses === 0 || newMaxUses === newSpentUses) {
        try {
            if (!consumableItem.flags?.elkan5e?.deleting) {
                await consumableItem.update({ "flags.elkan5e.deleting": true });
                await consumableItem.delete();
            } // else already being deleted
        } catch (error) {
            console.warn("handleGoodberryItemCleanup: Error during consumable item deletion or item already deleted:", error);
        }
    } else {
        await consumableItem.update({
            "system.uses.max": newMaxUses,
            "system.uses.spent": newSpentUses
        });
    }
}