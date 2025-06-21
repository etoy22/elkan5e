import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/dialog.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
import { secondWind } from "./module/classes/fighter.mjs";
import { healingOverflow, infusedHealer } from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { feral, rage, wildBlood } from "./module/classes/barbarian.mjs";
import { delayedDuration, delayedItem, wildSurge } from "./module/classes/sorcerer.mjs";
import { hijackShadow, meldWithShadows, rmvMeldShadow, rmvhijackShadow } from "./module/classes/monk.mjs";
import { armor, updateBarbarianDefense } from "./module/rules/armor.mjs";
import { conditions } from "./module/rules/condition.mjs";
import { language } from "./module/rules/language.mjs";
import { formating } from "./module/rules/format.mjs";
import { tools } from "./module/rules/tools.mjs";
import { weapons } from "./module/rules/weapon.mjs";
import { scroll } from "./module/rules/scroll.mjs";
import { goodberry } from "./module/spells/goodberry.mjs";
import { slicingBlow } from "./module/classes/rogue.mjs";
import { sappingSmite } from "./module/spells/sappingSmite.mjs";
import { spectralEmpowerment } from "./module/classes/wizard.mjs";
import { enervate, enervateOngoing } from "./module/spells/enervate.mjs";
import { skills } from "./module/rules/skills.mjs";
import { setupCombatReferences, setupDamageReferences, setupSpellcastingReferences, setupCreatureTypeReferences } from "./module/rules/references.mjs";


Hooks.once("init", async () => {
    try {
        console.log("Elkan 5e | Initializing Elkan 5e");
        await gameSettingRegister();
        initWarlockSpellSlot();
        // Ensure conditions and icons are initialized before other systems
        conditions();
        skills();
        tools();
        weapons();
        armor();
        language();
        formating();
        scroll();
        console.log("Elkan 5e  |  Done Initializing");
    }
    catch (error) {
        console.error("Elkan 5e | Initialization Error:", error);
    }
});

Hooks.once('ready', async () => {
    try {
        setupCombatReferences();
        setupDamageReferences();
        setupSpellcastingReferences();
        setupCreatureTypeReferences();
        startDialog();
    } catch (error) {
        console.error("Elkan 5e | Ready Hook Error:", error);
    }
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
        console.error("Elkan 5e | Error in preRollAttackV2 hook:", error);
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
        console.error("Elkan 5e | Error in preRollHitDieV2 hook:", error);
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
    } catch (error) {
        console.error("Elkan 5e | Error in postUseActivity hook:", error);
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
        console.error("Elkan 5e | Error in preRollInitiative hook:", error);
    }
});

Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
    try {
        await delayedDuration(effect);
    } catch (error) {
        console.error("Elkan 5e | Error in deleteActiveEffect hook:", error);
    }
});

Hooks.on("deleteItem", async (item, options, userId) => {
    try {
        delayedItem(item);
    } catch (error) {
        console.error("Elkan 5e | Error in deleteItem hook:", error);
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
        rmvMeldShadow(lastTurnActor);
        rmvhijackShadow(lastTurnActor);
    } catch (error) {
        console.error("Elkan 5e | Error in combatTurnChange hook:", error);
    }
});

Hooks.on("updateItem", (item) => {
    try {
        const actor = item.parent;
        updateBarbarianDefense(actor, "updateItem");
    } catch (error) {
        console.error("Elkan 5e | Error in updateItem hook:", error);
    }
});

Hooks.on("updateActor", async (actor, changes) => {
    try {
        await updateBarbarianDefense(actor, "updateActor");
    } catch (error) {
        console.error("Elkan 5e | Error in updateActor hook:", error);
    }
});

let features = {
    rage: rage,
    infusedHealer: infusedHealer,
    healingOverflow: healingOverflow,
    wildBlood: wildBlood,
    secondWind, secondWind,
    hijackShadow: hijackShadow,
    meldWithShadows: meldWithShadows,
    slicingBlow: slicingBlow,
}

let spells = {
    goodberry: goodberry,
    sappingSmite: sappingSmite,
    enervate: enervate,
    enervateOngoing: enervateOngoing,
};

let monsterFeatures = {
    spectralEmpowerment: spectralEmpowerment,
}

let macros = {
    spells: spells,
    features: features,
    monsterFeatures: monsterFeatures,
};

globalThis['elkan5e'] = {
    macros: macros
};