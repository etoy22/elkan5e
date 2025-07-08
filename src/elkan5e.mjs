import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/dialog.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
import { secondWind } from "./module/classes/fighter.mjs";
import { healingOverflow, infusedHealer } from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { rage, wildBlood } from "./module/classes/barbarian.mjs";
import { delayedDuration, delayedItem, wildSurge } from "./module/classes/sorcerer.mjs";
import { hijackShadow, meldWithShadows, rmvMeldShadow, rmvhijackShadow } from "./module/classes/monk.mjs";
import { armor, updateBarbarianDefense } from "./module/rules/armor.mjs";
import { conditions, conditionsReady } from "./module/rules/condition.mjs";
import { language } from "./module/rules/language.mjs";
import { formating } from "./module/rules/format.mjs";
import { tools } from "./module/rules/tools.mjs";
import { weapons } from "./module/rules/weapon.mjs";
import { scroll } from "./module/rules/scroll.mjs";
import { slicingBlow } from "./module/classes/rogue.mjs";
import { spectralEmpowerment } from "./module/classes/wizard.mjs";
import { skills } from "./module/rules/skills.mjs";
import { setupCombatReferences, setupDamageReferences, setupSpellcastingReferences, setupCreatureTypeReferences, setupSkillReferences } from "./module/rules/references.mjs";
import * as Spells from "./module/spells.mjs"
import * as Feats from "./module/feats.mjs"


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
        conditionsReady()
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
        Feats.undeadNature(config)
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
    Spells.goodberryDeleteActive(deletedEffect)
    Spells.returnToNormalSize(deletedEffect);
});


Hooks.on("deleteItem", async (deletedItem, options, userId) => {
    Spells.goodberryDeleteItem(deletedItem)
});


Hooks.on("updateMeasuredTemplate", async (template, data, options, userId) => {
    const linkedLight = canvas.lighting.placeables.filter(light =>
        light.document.getFlag("elkan5e", "linkedTemplate") === template.id
    );
    if  (linkedLight.length === 0) return
    for (const light of linkedLight) {
        await light.document.update({ x: template.x, y: template.y });
    }
})

Hooks.on("deleteMeasuredTemplate", async (template, options, userId) => {
    const linkedLight = canvas.lighting.placeables.filter(light =>
        light.document.getFlag("elkan5e", "linkedTemplate") === template.id
    );
    if  (linkedLight.length === 0) return
    const ids = linkedLight.map(l => l.id);

    await canvas.scene.deleteEmbeddedDocuments("AmbientLight", ids);
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
    goodberry: Spells.goodberry,
    sappingSmite: Spells.sappingSmite,
    enervate: Spells.enervate,
    enervateOngoing: Spells.enervateOngoing,
    lifeDrain: Spells.lifeDrain,
    wellOfCorruption: Spells.wellOfCorruption,
    wrathOfTheReaper: Spells.wrathOfTheReaper,
    enlarge: Spells.enlarge,
    reduce: Spells.reduce,
    darkness: Spells.darkness,
    light: Spells.light,
    continualFlame:Spells.continualFlame,
    moonBeam:Spells.moonBeam
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