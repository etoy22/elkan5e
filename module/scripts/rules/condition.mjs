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