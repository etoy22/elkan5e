import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/startDialog.mjs";
import { init } from "./module/initalizing.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
// import { perLeader } from "./module/classes/fighter.mjs";
// import { healOver, infuseHeal } from "./module/classes/cleric.mjs";
// import { archDruid } from "./module/classes/druid.mjs";
// import { feral, improvedFeral } from "./module/classes/barbarian.mjs";

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
 */
Hooks.on("dnd5e.preRollAttackV2", (item, config) => {
    focus(item, config);
});

/*
    Automation for Undead Nature
*/
Hooks.on("dnd5e.preRollHitDieV2", (config) => {
    const actor = config.subject;
    if (actor.items.find(feature => feature.name === "Undead Nature") && !actor.effects.find(effect => effect.name === "Gentle Repose")) {
        config.rolls[0].parts[0] += '-@abilities.con.mod';
    }
});

// Hooks.on("dnd5e.useItem", (item, config) => {
//     perLeader(item);
//     infuseHeal(item);

// });

// Hooks.on("dnd5e.rollDamage", (item, roll) => {
//     healOver(item, roll);
// });

// Hooks.on("dnd5e.preRollInitiative", (actor, roll) => {
//     // archDruid(actor);
//     improvedFeral(actor);
//     // feral(actor);
// });