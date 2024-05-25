
/*
 * Adds different rule types to Foundry
 */
export function ruleType(){
    CONFIG.DND5E.ruleTypes.weaponProperty = {
        label: "Weapon Property"
    }
}

/*
 * Adds new activation types that are used in Elkan 5e
 */
export function activation(){
    CONFIG.DND5E.abilityActivationTypes.duringattack = "As Part of a Weapon Attack"
    CONFIG.DND5E.abilityActivationTypes.shortrest = "During a Short Rest"
    CONFIG.DND5E.abilityActivationTypes.longrest = "During a Long Rest"
    CONFIG.DND5E.abilityActivationTypes.nocost = "No Action Cost"
}

/*
 * Adds spell Components to a type of Loot Types
 */
export function mats(){
    CONFIG.DND5E.lootTypes.spellComponents ={
        label: "Spell Components"
    }
}


/*
 * Adds Manuevers as a subtype of classes
 */
export function subFeatures(){

    CONFIG.DND5E.featureTypes.class.subtypes.precision = "Precision Attack"
    CONFIG.DND5E.featureTypes.class.subtypes.wild = "Wild Shape"

    CONFIG.DND5E.featureTypes.subclass = {
        label: "Subclass Feature"
    }

    CONFIG.DND5E.featureTypes.feat = {
        label: "Feat",
        subtypes: {
            manuevers: "Manuevers"
        }
    }
}

export function sheets(){
    CONFIG.DND5E.sourcePacks.BACKGROUNDS = "elkan5e.elkan5e-background"
    CONFIG.DND5E.sourcePacks.CLASSES = "elkan5e.elkan5e-class"
    CONFIG.DND5E.sourcePacks.RACES = "elkan5e.elkan-5e-ancestries"
    
    // Below breaks everything
    // CONFIG.DND5E.sourcePacks.ITEMS = "elkan5e.elkan5e-mundane-items"
    // {
    //     "BACKGROUNDS": "elkan5e.elkan5e-background",
    //     "CLASSES": "elkan.classes",
    //     "ITEMS": "dnd5e.items",
    //     "RACES": "dnd5e.races"
    // }
}