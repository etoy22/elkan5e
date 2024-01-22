/**
 * Makes it so that features use their proper cost (Only works on level up)
 *   @param {object[]} toCreate - Items that will be created on the actor.
 *   @param {object[]} toUpdate - Items that will be updated on the actor.
 */
export function advance_cleric(toCreate,toUpdate){
    const cdID1 = toCreate.find(e => e.name === "Channel Divinity");
    const cdID2 = toUpdate.find(e => e.name === "Channel Divinity");
    if (cdID1 || cdID2){
        let channelDivinity = 0
        if (spID1)
            channelDivinity = cdID1
        else
            channelDivinity = cdID2

        const featureNames = [
            // Life Domain
            "Channel Divinity: Preserve Life"
        ]; 

        for (let i = 0; i < featureNames.length;i++){
            let feats = toCreate.find(e => e.name ===  featureNames[i])
            if (feats){
                feats.system.consume.target = channelDivinity._id;
            }
                
        }
    }
}


/**
 * TODO: This should see if a creature has how much health remaining and then tell the player the 
 * amount that they have left for the Healing overflow ability. Maybe use dnd5e.rollDamage
 * 
 * Adds functionality to Healing Overflow
 *   @param {object[]} item - The Actor that rolled initiative.
 *   @param {string} roll - The resulting roll.
 */
export function healOver(actor,combatants){    
    console.log("Nothing ")
}

/**
 * TODO: This would apply healing when the caster makes a healing spell
 * 
 * Adds functionality to Infused Healer
 *   @param 
 *   @param 
 */
export function infuseHeal(actor,combatants){    
    console.log("Nothing ")
}
