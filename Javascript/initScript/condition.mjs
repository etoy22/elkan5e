/**
 * Adds the Elkan 5e conditions to Foundry.
 */
export function conditions(){
    console.log("Elkan 5e  |  Initializing Conditions")

    //Add conditions
    CONFIG.DND5E.conditionTypes.confused = "Confused";
    CONFIG.DND5E.conditionTypes.dazed = "Dazed";
    CONFIG.DND5E.conditionTypes.dominated = "Dominated";
    CONFIG.DND5E.conditionTypes.drained = "Drained";
    CONFIG.DND5E.conditionTypes.goaded = "Goaded";
    CONFIG.DND5E.conditionTypes.hasted = "Hasted";
    CONFIG.DND5E.conditionTypes.muted = "Muted";
    CONFIG.DND5E.conditionTypes.siphoned = "Siphoned";
    CONFIG.DND5E.conditionTypes.slowed = "Slowed";
    CONFIG.DND5E.conditionTypes.surprised = "Surprised";
    CONFIG.DND5E.conditionTypes.weakened = "Weakened";
}


//This is part of the siphoned and weakened thing to figure out
// Hook.once("dnd5e.preRollDamage", (item,config) => {

// })