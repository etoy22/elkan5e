export function formating() {
    ruleType();
    activation();
    mats();
    subFeatures();
    sheets();
}

/*
 * Adds different rule types to Foundry
 */
export function ruleType() {
    CONFIG.DND5E.ruleTypes.weaponProperty = {
        label: "Weapon Property"
    };
}

/*
 * Adds new activation types that are used in Elkan 5e
 */
export function activation() {
    const activationTypes = {
        duringattack: "As Part of a Weapon Attack",
        once: "Once Per Turn",
        shortrest: "During a Short Rest",
        longrest: "During a Long Rest",
        nocost: "No Action Cost"
    };

    Object.assign(CONFIG.DND5E.abilityActivationTypes, activationTypes);
    Object.assign(CONFIG.DND5E.staticAbilityActivationTypes, activationTypes);

    // For the new version
    const activityActivationTypes = {
        duringattack: {
            label: "Once Per Turn",
            group: "DND5E.ACTIVATION.Category.Standard"
        },
        once: {
            label: "As Part of a Weapon Attack",
            group: "DND5E.ACTIVATION.Category.Standard"
        },
        shortrest: {
            label: "During a Short Rest",
            group: "DND5E.ACTIVATION.Category.Time",
            scalar: true
        },
        longrest: {
            label: "During a Long Rest",
            group: "DND5E.ACTIVATION.Category.Time",
            scalar: true
        },
        nocost: {
            label: "No Action Cost"
        }
    };

    Object.assign(CONFIG.DND5E.activityActivationTypes, activityActivationTypes);
}

/*
 * Adds spell Components to a type of Loot Types
 */
export function mats() {
    CONFIG.DND5E.lootTypes.spellComponents = {
        label: "Spell Components"
    };
}

/*
 * Adds Manuevers as a subtype of classes
 */
export function subFeatures() {
    CONFIG.DND5E.featureTypes.class.subtypes.precision = "Precision Attack";
    CONFIG.DND5E.featureTypes.class.subtypes.wild = "Wild Shape";

    CONFIG.DND5E.featureTypes.subclass = {
        label: "Subclass Feature",
        subtypes: {
            channelDivinity: "Channel Divinity",
            improvedfightingStyle: "Improved Fighting Style",
            huntersPrey: "Hunter's Prey",
            ki: "Ki Ability"
        }
    };

    CONFIG.DND5E.featureTypes.feat = {
        label: "Feat",
        subtypes: {
            manuevers: "Manuevers"
        }
    };
}

export function sheets() {
    CONFIG.DND5E.sourcePacks.BACKGROUNDS = "elkan5e.elkan5e-background";
    CONFIG.DND5E.sourcePacks.CLASSES = "elkan5e.elkan5e-class";
    CONFIG.DND5E.sourcePacks.RACES = "elkan5e.elkan-5e-ancestries";
    
    // Below breaks everything
    // CONFIG.DND5E.sourcePacks.ITEMS = "elkan5e.elkan5e-equipment";
}