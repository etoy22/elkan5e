import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/startDialog.mjs";
import { init } from "./module/initalizing.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
import { perLeader, rallySurge } from "./module/classes/fighter.mjs";
import { healOver, infuseHeal } from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { feral, wildBlood } from "./module/classes/barbarian.mjs";
import { wildSurge } from "./module/classes/sorcerer.mjs";

Hooks.once("init", async () => {
    console.log("Elkan 5e | Initializing Elkan 5e");
    await gameSettingRegister();
    await init();
    await initWarlockSpellSlot();
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
    const actor = config.subject;
    const HAS_UNDEAD_NATURE = actor.items.find(feature => feature.name === "Undead Nature");
    const HAS_GENTLE_REPOSE  = actor.effects.find(effect => effect.name === "Gentle Repose");
    // Subtract Constitution modifier from hit die roll for undead characters without Gentle Repose
    if (HAS_UNDEAD_NATURE && !HAS_GENTLE_REPOSE) {
        config.rolls[0].parts[0] += '-@abilities.con.mod';
    }
});

/**
 * Handle post-use activity.
 * @param {object} activity - The activity performed.
 * @param {object} usageConfig - The usage configuration.
 * @param {object} results - The results of the activity.
*/
Hooks.on("dnd5e.postUseActivity", (activity, usageConfig, results) => {
    wildSurge(activity);
    wildBlood(activity);
    infuseHeal(activity, usageConfig);
    perLeader(activity)
    rallySurge(activity);
});

/**
 * Handle pre-roll initiative for various features.
 * @param {object} actor - The actor rolling initiative.
 * @param {object} roll - The resulting roll.
 */
Hooks.on("dnd5e.preRollInitiative", (actor, roll) => {
    archDruid(actor);
    feral(actor);
});


Hooks.on("dnd5e.rollSkillV2", async (rolls, data) => {
    console.log("Rolls: ", rolls);
    console.log("Data: ", data);
    console.log("Next Attempt", rolls[0].terms[0].total);
    if (rolls[0].terms[0].total === 20) {
        console.log("Critical Success!");
        rolls.total += 5
    }
    if (rolls[0].terms[0].total === 1) {
        console.log("Critical Success!");
        rolls.total = rolls.total + 5
    }
    // Access the result of the first term
    // const result = data.terms[0].results[0].result;
    // console.log("Result: ", result);

    // Example usage: Check for a critical success
    // if (result === 20) {
    //     console.log("Critical Success!");
    //     // Modify the roll or perform additional actions here
    // }
});