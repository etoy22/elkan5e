/**
 * Makes it so that features use their proper cost (Only works on level up)
 *   @param {object[]} toCreate - Items that will be created on the actor.
 *   @param {object[]} toUpdate - Items that will be updated on the actor.
 */
export function advance_bard(toCreate,toUpdate){
    const baiID1 = toCreate.find(e => e.name === "Bardic Inspiration");
    const baiID2 = toUpdate.find(e => e.name === "Bardic Inspiration");
    if (baiID1 || baiID2){
        let bardicInspiration = 0
        if (spID1){
            bardicInspiration = baiID1
        }
        else{
            bardicInspiration = baiID2
        }
        const featureNames = [
            // College of Noise
            "Blasting Volume",
            "Improved  Blasting Volume",
            // College of the Jester
            "Cutting Words"
        ]; 
        
        for (let i = 0; i < featureNames.length;i++){
            let feats = toCreate.find(e => e.name ===  featureNames[i])
            if (feats){
                feats.system.consume.target = bardicInspiration._id;
            }
            
        }
    }
}


/**
 * Makes it so that features use their proper cost (Only works on level up)
 *   @param {object[]} item - The Item5e.
 *   @param {object[]} sheet - The ItemSheet5e application.
 *   @param {object[]} data - The data that has been dropped onto the sheet.
 */
export function drop_bard(item,sheet,data){
    console.log("Elkan 5e Item |",item)
    console.log("Elkan 5e Sheet |",sheet)
    console.log("Elkan 5e Data |",data)
    // const baiID1 = toCreate.find(e => e.name === "Bardic Inspiration");
    // const baiID2 = toUpdate.find(e => e.name === "Bardic Inspiration");
}

/**
 * TODO: This will make it so if they have Archdruid a pop up will appear at roll of initative 
 * to remind the player that they can use the wild shape. This reminder should only appear if actor also doesn't
 * have suprised condition. Maybe dnd5e.rollInitiative
 * 
 * Adds functionality to Feral Archdruid.
 *   @param {object[]} actor - The Actor that rolled initiative.
 *   @param {object[]} combatants - The associated Combatants whose initiative was updated.
 */
export function archDruid(actor,combatants){
    console.log("Nothing ")
}