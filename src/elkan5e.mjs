import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/startDialog.mjs";
import { init } from "./module/initalizing.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
import { perLeader } from "./module/classes/fighter.mjs";
import { healOver, infuseHeal } from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { feral, improvedFeral } from "./module/classes/barbarian.mjs";

Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e");
    gameSettingRegister();
    init();
    initWarlockSpellSlot();
});

Hooks.once('ready', async () => {
    startDialog();
});

/**
 * Things that occur when an attack is declared
 *   @param {object} item - The item used.
 *   @param {object} config - The configuration for the attack roll.
 */
Hooks.on("dnd5e.preRollAttackV2", (item, config) => {
    // Handle focus when an attack is declared
    focus(item, config);
});

/*
    Automation for Undead Nature
 *   @param {object} config - The configuration for the hit die roll.
 */
Hooks.on("dnd5e.preRollHitDieV2", (config) => {
    console.log("preRollHitDieV2 Hook Triggered", { config });
    // Adjust hit die roll for Undead Nature feature
    const actor = config.subject;
    if (actor.items.find(feature => feature.name === "Undead Nature") && !actor.effects.find(effect => effect.name === "Gentle Repose")) {
        config.rolls[0].parts[0] += '-@abilities.con.mod';
    }
});

// TODO: Move all of these to macros use this -> flags.midi-qol.onUseMacroName | Custom | ItemMacro, preDamageApplication


/**
 * Handle pre-use activity for Wild Mage Sorcerer
 *   @param {object} activity - The activity performed.
 *   @param {object} usageConfig - The usage configuration.
 */
Hooks.on("dnd5e.postUseActivity", async (activity) => {
    // console.log(activity)
    // Wild Magic Surge
    const actor = activity.actor;
    const item = activity.item;
    if (item.type === "spell" && item.system.level > 0 && actor.items.find(i => i.name === "Random Wild Surge")) {
        const roll = await new Roll("1d6").roll({ async: true });
        await roll.toMessage({
            flavor: "Random Wild Surge",
            speaker: ChatMessage.getSpeaker({ actor: actor })
        });
        if (roll.total >= 5) {
            const tableUUIDs = [
                null, // No table for level 0
                "GDE5tgmRfX1GiOQs",
                "mxwqgbo7xnNXSnIm",
                "Fwl1JxM19LzeYxjJ",
                "0TDp89O9iGt4zovG",
                "V4BRRp6vWntQNVwa",
                "4TsMG2a2EtcLdgkc",
                "wt2VfjYQyuvwftih",
                "xkUpS2XBuSdyVEah",
                "LV2skOm8hCwM1JRH"
            ];
            const tableUUID = tableUUIDs[item.system.level];
            if (tableUUID) {
                const table = await fromUuid(`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${tableUUID}`);
                console.log("elkan5e table", table);
                if (table) {
                    table.draw();
                }
            } else {
                console.log("No table found for this spell level.");
            }
        }
    }
});

/**
 * Handle post-use activity for Infused Healer
 *   @param {object} activity - The activity performed.
 *   @param {object} usageConfig - The usage configuration.
 *   @param {object} results - The results of the activity.
 */
Hooks.on("dnd5e.postUseActivity", (activity, usageConfig, results) => {
    let actor = activity.actor;
    infuseHeal(actor, activity, usageConfig);
});

/**
 * Handle healing overflow on damage calculation
 *   @param {object} actor - The actor being damaged.
 *   @param {object} damages - The damage descriptions.
 *   @param {object} options - Additional damage application options.
 */
// Hooks.on("dnd5e.calculateDamage", (actor, damages, options) => {
//     console.log("calculateDamage Hook Triggered", { actor, damages, options });
//     // const item = options.item;
//     // const roll = damages[0]; // Assuming the first damage roll is the one to consider
//     // healOver(item, roll);
// });

/**
 * Handle pre-roll initiative for various features
 *   @param {object} actor - The actor rolling initiative.
 *   @param {object} roll - The resulting roll.
 */
Hooks.on("dnd5e.preRollInitiative", (actor, roll) => {
    console.log("preRollInitiative Hook Triggered", { actor, roll });
    archDruid(actor);
    improvedFeral(actor);
    feral(actor);
});