
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
    CONFIG.DND5E.featureTypes.feat = {
        label: "Feat",
        subtypes: {
            manuevers: "Manuevers"
        }
    }
}

