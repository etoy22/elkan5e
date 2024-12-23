import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/startDialog.mjs";
import { init } from "./module/initalizing.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
import { perLeader } from "./module/classes/fighter.mjs";
import { healOver, infuseHeal } from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { feral, improvedFeral } from "./module/classes/barbarian.mjs";
import { wildSurge } from "./module/classes/sorcerer.mjs";

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
 * Handle focus when an attack is declared.
 * @param {object} item - The item used.
 * @param {object} config - The configuration for the attack roll.
 */
Hooks.on("dnd5e.preRollAttackV2", (item, config) => {
    focus(item, config);
});

/**
 * Adjust hit die roll for Undead Nature feature.
 * @param {object} config - The configuration for the hit die roll.
 */
Hooks.on("dnd5e.preRollHitDieV2", (config) => {
    console.log("preRollHitDieV2 Hook Triggered", { config });
    const actor = config.subject;
    if (actor.items.find(feature => feature.name === "Undead Nature") && !actor.effects.find(effect => effect.name === "Gentle Repose")) {
        config.rolls[0].parts[0] += '-@abilities.con.mod';
    }
});

/**
 * Handle post-use activity for Wild Mage Sorcerer.
 * @param {object} activity - The activity performed.
 */
Hooks.on("dnd5e.postUseActivity", async (activity) => {
    wildSurge(activity);
});

/**
 * Handle post-use activity for Infused Healer.
 * @param {object} activity - The activity performed.
 * @param {object} usageConfig - The usage configuration.
 * @param {object} results - The results of the activity.
 */
Hooks.on("dnd5e.postUseActivity", (activity, usageConfig, results) => {
    infuseHeal(activity, usageConfig);
});

/**
 * Handle pre-roll initiative for various features.
 * @param {object} actor - The actor rolling initiative.
 * @param {object} roll - The resulting roll.
 */
Hooks.on("dnd5e.preRollInitiative", (actor, roll) => {
    console.log("preRollInitiative Hook Triggered", { actor, roll });
    archDruid(actor);
    improvedFeral(actor);
    feral(actor);
});