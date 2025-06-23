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
import { setupCombatReferences, setupDamageReferences, setupSpellcastingReferences, setupCreatureTypeReferences, setupSkillReferences } from "./module/rules/references.mjs";


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
        setupCombatReferences();
        setupDamageReferences();
        setupSpellcastingReferences();
        setupCreatureTypeReferences();
        setupSkillReferences();
        console.log("Elkan 5e  |  Done Initializing");
    }
    catch (error) {
        console.error("Elkan 5e | Initialization Error:", error);
    }
});

Hooks.once('ready', async () => {
    try {
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
    // Only handle effects created by the goodberry spell (must match the duration naming pattern)
    const match = deletedEffect.name.match(/^(.*) Duration \(Level (\d+)\)$/);
    if (!match) return; // Not a goodberry effect, skip
    const baseName = match[1];
    const level = parseInt(match[2], 10);
    if (level === null || isNaN(level)) return; // If level is null or not a number, skip
    const name = baseName + " (Item)";
    const item = actor.items.find(i => i.name === name);
    console.log("deleteActiveEffect: Triggered for name:", deletedEffect.name, "Looking for item:", name, "Found:", !!item, "Level:", level);
    if (item) {
        await handleGoodberryItemCleanup(actor, level, item);
    } else {
        console.warn("deleteActiveEffect: No matching item found for cleanup.", { name, level });
    }
});


Hooks.on("deleteItem", async (deletedItem, options, userId) => {
    const actor = deletedItem.parent;
    if (!actor) return;
    // Only handle items created by the goodberry spell (must end with " (Item)")
    if (!deletedItem.name.endsWith(" (Item)")) return;
    // Only target effects that match the goodberry duration naming pattern
    const baseName = deletedItem.name.replace(/ \(Item\)$/, "");
    const effects = actor.effects.filter(effect =>
        effect.name &&
        effect.name.startsWith(baseName) &&
        / Duration \(Level \d+\)$/.test(effect.name)
    );
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

// Hooks.on("dnd5e.preRollSkill", (rollData, info, options) => {
//   if (rollData.rolls?.length) {
//     if (!Array.isArray(rollData.rolls[0].parts)) {
//       rollData.rolls[0].parts = [];
//     }
//     rollData.rolls[0].parts.push("-5");
//   }
//   return true;
// });

// // 1. Pre-roll hook to add nothing or prepare
// Hooks.on("dnd5e.preRollSkill", (rollData, info, options) => {
//   // Don't modify anything here since we don't know the result yet
//   return true;
// });

// // 2. Post-roll hook to check roll and adjust
// Hooks.on("dnd5e.rollSkill", async (actor, roll, skillId) => {
//   const d20 = roll.dice.find(d => d.faces === 20);
//   if (!d20) return;

//   const result = d20.results[0]?.result;
//   if (result !== 1) return;  // Only continue if natural 1

//   // Subtract 5 from the natural 1 result
//   d20.results[0].result -= 5;
//   d20.results[0]._isModified = true;

//   // Update total
//   roll._total = roll.total;

//   await roll.toMessage({
//     flavor: `${actor.name} rolls ${skillId || "a skill check"} (Natural 1: -5 penalty applied)`,
//     speaker: ChatMessage.getSpeaker({ actor }),
//   });

//   // Prevent original unmodified roll from posting
//   return false;
// });








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