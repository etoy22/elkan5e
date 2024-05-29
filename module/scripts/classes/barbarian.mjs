
/**
 * TODO: This will make it so if they have Feral Instincts a pop up will appear at roll of initative 
 * to remind the player that they can rage. This reminder should only appear if actor also doesn't
 * have suprised condition. Maybe dnd5e.rollInitiative
 * 
 * Adds functionality to Feral Instincts.
 *   @param {object[]} actor - The Actor that rolled initiative.
 *   @param {object[]} combatants - The associated Combatants whose initiative was updated.
 */
export function feral(actor,combatants){
    let improved = true
    if (improved){
        improvedFeral(actor,combatants)
    }else{
        
        // console.log("Nothing ")
    }
}

/**
 * TODO: This will make it so if they have Feral Instincts a pop up will appear at roll of initative 
 * to remind the player that they can rage. This reminder should only appear if actor also doesn't
 * have suprised condition. Maybe using dnd5e.rollInitiative
 * 
 * Adds functionality to Improved Feral Instincts.
 *   @param {object[]} actor - The Actor that rolled initiative.
 *   @param {object[]} combatants - The associated Combatants whose initiative was updated.
 */
export function improvedFeral(actor,combatants){
    // console.log("Nothing ")
}