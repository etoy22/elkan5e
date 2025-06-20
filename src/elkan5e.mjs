import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/startDialog.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
import { perLeader, rallySurge } from "./module/classes/fighter.mjs";
import { healOver, infuseHeal } from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { feral, wildBlood } from "./module/classes/barbarian.mjs";
import { delayedDuration, delayedItem, wildSurge } from "./module/classes/sorcerer.mjs";
import { meldWithShadow, shadowMonk, hijackShadow } from "./module/classes/monk.mjs";
import { armor } from "./module/rules/armor.mjs";
import { conditions, icons } from "./module/rules/condition.mjs";
import { language } from "./module/rules/language.mjs";
import { formating } from "./module/rules/format.mjs";
import { references } from "./module/rules/references.mjs";
import { tools } from "./module/rules/tools.mjs";
import { weapons } from "./module/rules/weapon.mjs";
import { scroll } from "./module/rules/scroll.mjs";
// import { sanctuary } from "./module/spells/sanctuary.mjs";

Hooks.once("init", async () => {
    console.log("Elkan 5e | Initializing Elkan 5e");
    await gameSettingRegister();
    initWarlockSpellSlot();
    references();
    tools();
    conditions();
    weapons();
    armor();
    language();
    icons();
    formating();
    scroll();
    console.log("Elkan 5e  |  Done Initializing");
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
    try {
        focus(item, config);
    } catch (error) {
        console.error("Error in preRollAttackV2 hook:", error);
    }
});

/**
 * Adjust hit die roll for Undead Nature feature.
 * @param {object} config - The configuration for the hit die roll.
 */
Hooks.on("dnd5e.preRollHitDieV2", (config) => {
    try {
        const actor = config.subject;
        const HAS_UNDEAD_NATURE = actor.items.find(feature => feature.name === "Undead Nature");
        const HAS_GENTLE_REPOSE = actor.effects.find(effect => effect.name === "Gentle Repose");
        // Subtract Constitution modifier from hit die roll for undead characters without Gentle Repose
        if (HAS_UNDEAD_NATURE && !HAS_GENTLE_REPOSE) {
            config.rolls[0].parts[0] += '-@abilities.con.mod';
        }
    } catch (error) {
        console.error("Error in preRollHitDieV2 hook:", error);
    }
});

/**
 * Handle post-use activity.
 * @param {object} activity - The activity performed.
 * @param {object} usageConfig - The usage configuration.
 * @param {object} results - The results of the activity.
*/
Hooks.on("dnd5e.postUseActivity", (activity, usageConfig, results) => {
    try {
        wildSurge(activity);
        wildBlood(activity);
        infuseHeal(activity, usageConfig);
        perLeader(activity);
        rallySurge(activity);
        shadowMonk(activity);
    } catch (error) {
        console.error("Error in postUseActivity hook:", error);
    }
});

/**
 * Handle pre-roll initiative for various features.
 * @param {object} actor - The actor rolling initiative.
 * @param {object} roll - The resulting roll.
 */
Hooks.on("dnd5e.preRollInitiative", (actor, roll) => {
    try {
        archDruid(actor);
        feral(actor);
    } catch (error) {
        console.error("Error in preRollInitiative hook:", error);
    }
});

Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
    await delayedDuration(effect);
});

Hooks.on("deleteItem", async (item, options, userId) => {
    try {
        delayedItem(item);
        deleteGoodberryEffect(item)
    } catch (error) {
        console.error("Error in deleteItem hook:", error);
    }
});

/**
 * Handle end of turn activities.
 * @param {object} combatant - The combatant whose turn ended.
 * @param {object} turn - The turn data.
 */
Hooks.on("combatTurnChange", (combat, prior, current) => {
    try {
        let lastTurnActor = combat.combatants.get(prior.combatantId).actor;
        meldWithShadow(lastTurnActor);
        hijackShadow(lastTurnActor);
    } catch (error) {
        console.error("Error in combatTurnChange hook:", error);
    }
});

// Hooks.on("dnd5e.preRollAttackV2", async (config, dialog, message) => {
//     console.log("CONFIG:", config, dialog, message);
//     const actor = config.subject.actor; // Attacking Actor
//     const hitTargets = config.subject.workflow.hitTargets; // Targets Attacked
//     for (const target of hitTargets) {
//         if (config.subject.type === "attack") {
//             const sanc = await sanctuary(actor, target.actor);
//             console.log("RETURN VALUE", sanc);
//             if (!sanc) {
//                 console.log("Sanctuary Protection");
//                 return false;
//             }
//         }
//     }
// });