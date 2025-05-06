// TODO: delete eventually
export async function deleteGoodberryEffect (item){
    if (item.name === game.i18n.localize("elkan5e.spell.GoodberryItem")) {
        await deletedItemRemovesEffect(item, game.i18n.localize("elkan5e.spell.Goodberry"));
    }
}
// TODO: This function works but causes errors when deleting the item with multiple effects
export async function goodberry({ actor, item, }) {
    console.log(`${item.name} spell activated`);

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
        console.log("Effect created with ID:", effectId);
        Hooks.on("deleteActiveEffect", async (deletedEffect) => {
            const name = deletedEffect.label.replace(/ Duration \(Level \d+\)$/, "") + " (Item)";
            const levelMatch = deletedEffect.label.match(/Level (\d+)/);
            const level = levelMatch ? parseInt(levelMatch[1], 10) : null;
            const item = actor.items.find(i => i.name === name);
            
            if (item) {
                if (!level) {
                    console.warn("Could not determine spell level from effect label:", deletedEffect.label);
                    return;
                }
                
                await handleGoodberryItemCleanup(actor, level, name);
            } else {
                console.warn("No matching item found for cleanup:", name);
            }
        });
    }
  
    // Hook to handle the deletion of the item
    Hooks.on("deleteItem", async (deletedItem) => {
        if (!actor) {
            console.warn("Actor not found, skipping item cleanup.");
            return;
        }
        console.log(`${deletedItem.name} item deleted, cleaning up associated effects.`);
        const name = deletedItem.name.replace(/ \(Item\)$/, "");
        const effects = actor.effects.filter(effect => effect.label.includes(name));

        if (effects.length === 0) {
            console.log("No effects found for cleanup.");
            return;
        }

        for (const effect of effects) {
            try {
                // Skip if the effect is already deleted
                if (!await actor.effects.get(effect.id)) {
                    console.warn(`Effect already deleted: ${effect.label}`);
                    continue;
                }
                await effect.delete();
                console.log(`Deleted effect: ${effect.label}`);
            } catch (error) {
                console.error(`Failed to delete effect: ${effect.label}`, error);
            }
        }
    });
}

async function handleGoodberryItemCleanup(actor, level, itemName) {
    // Handle cleanup of the item when an effect is deleted
    const consumableItem = await actor.items.find(i => i.name === itemName);
    if (!consumableItem) {
        console.warn("Consumable item not found, skipping deletion.");
        return;
    }

    const berriesToRemove = (level + 1) * 5;
    const newMaxUses = Math.max(consumableItem.system.uses.max - berriesToRemove, 0);
    const newSpentUses = Math.min(Math.max(consumableItem.system.uses.spent - berriesToRemove, 0), newMaxUses);

    // console.log("Current max uses:", consumableItem.system.uses.max);
    // console.log("Berries to remove:", berriesToRemove);
    // console.log("New max uses:", newMaxUses);
    // console.log("New spent uses:", newSpentUses);

    if (newMaxUses === 0 || newMaxUses === newSpentUses) {
        console.log("Deleting consumable item as max uses reached zero or matches spent uses.");
        try {
            // Ensure the item exists and is not already being deleted
            if (!consumableItem.flags?.elkan5e?.deleting) {
                console.log("Marking consumable item as being deleted.");
                await consumableItem.update({ "flags.elkan5e.deleting": true }); // Mark as being deleted
                await consumableItem.delete();
                console.log("Consumable item successfully deleted.");
            } else {
                console.warn("Consumable item already marked as being deleted, skipping.");
            }
        } catch (error) {
            console.warn("Error during consumable item deletion or item already deleted:", error);
        }
    } else {
        console.log("Updating consumable item with new max and spent uses.");
        await consumableItem.update({
            "system.uses.max": newMaxUses,
            "system.uses.spent": newSpentUses
        });
    }
}