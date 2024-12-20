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
    // Adjust hit die roll for Undead Nature feature
    const actor = config.subject;
    if (actor.items.find(feature => feature.name === "Undead Nature") && !actor.effects.find(effect => effect.name === "Gentle Repose")) {
        config.rolls[0].parts[0] += '-@abilities.con.mod';
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

// /**
//  * Handle healing overflow on damage roll
//  *   @param {object} rolls - The resulting roll.
//  *   @param {object} activity - The activity that performed the roll.
// */
// Hooks.on("dnd5e.rollDamageV2", (rolls, data) => {
//     // healOver(activity.item, rolls);
//     // let actor = activity.actor; //Actor who is rolling
//     let activity = data.activity; //Activity performed
//     console.log("Rolls: ", rolls);
//     console.log("Data: ", data);
//     console.log("Activity: ", activity);
// });

/**
 * Handle pre-roll initiative for various features
 *   @param {object} actor - The actor rolling initiative.
 *   @param {object} roll - The resulting roll.
 */
Hooks.on("dnd5e.preRollInitiative", (actor, roll) => {
    archDruid(actor);
    improvedFeral(actor);
    feral(actor);
});