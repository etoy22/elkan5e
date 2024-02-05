/**
 * Adds the Elkan 5e conditions to Foundry.
 */
export function conditions(){
    console.log("Elkan 5e  |  Initializing Conditions")
    //Replace icons
    // CONFIG.DND5E.conditionTypes.blinded.icon = "modules/elkan5e/icons/blinded.svg"
    // CONFIG.DND5E.conditionTypes.deafened.icon = "modules/elkan5e/icons/deafened.svg"
    // CONFIG.DND5E.conditionTypes.frightened.icon = "modules/elkan5e/icons/frightened.svg"
    // CONFIG.DND5E.conditionTypes.grappled.icon = "modules/elkan5e/icons/grappled.svg"
    // CONFIG.DND5E.conditionTypes.invisible.icon = "modules/elkan5e/icons/invisible.svg"
    // CONFIG.DND5E.conditionTypes.paralyzed.icon = "modules/elkan5e/icons/paralyzed.svg"
    // CONFIG.DND5E.conditionTypes.petrified.icon = "modules/elkan5e/icons/petrified.svg"
    // CONFIG.DND5E.conditionTypes.poisoned.icon = "modules/elkan5e/icons/poisoned.svg"
    // CONFIG.DND5E.conditionTypes.prone.icon = "modules/elkan5e/icons/prone.svg"
    // CONFIG.DND5E.conditionTypes.unconscious.icon = "icons/svg/unconscious.svg"
    
    //Replace References
    CONFIG.DND5E.conditionTypes.blinded.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SXTqmewRrCwPS8yW"
    CONFIG.DND5E.conditionTypes.charmed.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ieDILSkRbu9r8pmZ"
    CONFIG.DND5E.conditionTypes.deafened.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.AHgIwuNdpp0wKF2y"
    CONFIG.DND5E.conditionTypes.frightened.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ruwpm6lorwoPJsmt"
    CONFIG.DND5E.conditionTypes.grappled.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zaI1nuc41wANKoFX"
    CONFIG.DND5E.conditionTypes.incapacitated.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.PXI4uoXj7x6IsDXt"
    CONFIG.DND5E.conditionTypes.invisible.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.GfTD899cLRZxGG1H"
    CONFIG.DND5E.conditionTypes.paralyzed.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.w5RoCYZIujGYuiYt"
    CONFIG.DND5E.conditionTypes.petrified.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.n0BX8pLecgm7E3uH"
    CONFIG.DND5E.conditionTypes.poisoned.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.fzEf89TZ1WN90bFv"
    CONFIG.DND5E.conditionTypes.prone.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.y8L5Uq1jMVDsQjaS"
    CONFIG.DND5E.conditionTypes.restrained.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DiWd3u4HCD7JEw8V"
    CONFIG.DND5E.conditionTypes.stunned.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.JV8kbMo0p5S1YXUR"
    CONFIG.DND5E.conditionTypes.unconscious.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZwhWWUPJvpFCz8sK"
    CONFIG.DND5E.conditionTypes.exhaustion.reference ="Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.mPzXN6MW8L6ePFmq"
    
    //TODO: Talk about these condition   
    CONFIG.DND5E.rules.concentrating = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zY2CHn81NAqSs6gh"
    CONFIG.DND5E.spellTags.concentration.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv"
    CONFIG.DND5E.rules.surprise = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE"

    //Add conditions
    
    CONFIG.DND5E.conditionTypes.confused = {
        label:"Confused",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V"
    }
    CONFIG.DND5E.conditionTypes.dazed = {
        label:"Dazed",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq"
    }
    CONFIG.DND5E.conditionTypes.dominated = {
        label: "Dominated",
        statuses:["Charmed"],
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0OYaVPznKqYgchW9"
    };
    CONFIG.DND5E.conditionTypes.drained = {
        label: "Drained",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ"
    };
    CONFIG.DND5E.conditionTypes.goaded = {
        label: "Goaded",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN"
    };
    CONFIG.DND5E.conditionTypes.hasted = {
        label: "Hasted",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74"
    };
    CONFIG.DND5E.conditionTypes.muted = {
        label: "Muted",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.F51xrE7Mj8VeM3b8"
    };
    CONFIG.DND5E.conditionTypes.siphoned = {
        label: "Siphoned",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg"
    };
    CONFIG.DND5E.conditionTypes.slowed = {
        label: "Slowed",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T"
    };
    
    CONFIG.DND5E.conditionTypes.weakened = {
        label: "Weakened",
        reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.iJT3cWvyTNBv1L5h"
    };
    
    //Cover
    CONFIG.DND5E.rules.cover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.d2hBqe6EYHX2mxKD"
    CONFIG.DND5E.rules.halfcover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq"
    CONFIG.DND5E.rules.threequarterscover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.82ph4sMqvhxjLbiw"
    CONFIG.DND5E.rules.totalcover = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.hY5s70xMeG5ISFUA"
    
    delete CONFIG.DND5E.statusEffects.bleeding
    delete CONFIG.DND5E.statusEffects.burrowing
    delete CONFIG.DND5E.statusEffects.curse
    delete CONFIG.DND5E.statusEffects.flying
    delete CONFIG.DND5E.statusEffects.marked
    //Delete
}


/**
 * TODO: Adds functionality to Fey Ancestry to gain advantage on saves against charmed.
 *   
 */
export function feyAncest(){
}

/*
 * TODO: Automate grapple and give conditions according to the size of the attacker grappler and the
 * size of the grappled. Also roll to see if the creature is actually grappled
 */
export function grapple(){
    console.log("Grapple")
}

/**
 * TODO: Adds functionality to Dwarven Resilience to give advantage on saves via poison. Probably need to use midi to automate
 * maybe with looking at there overtime effects and how to mix that 
 */
export function dwarfResil(){

}

/**
 * Adds functionality to Sturdy to give advantage on saves via prone.   
 */
export function sturdy(){
}