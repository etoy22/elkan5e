/**
 * Makes it so that features use their proper cost (Only works on level up)
 *   @param {object[]} toCreate - Items that will be created on the actor.
 *   @param {object[]} toUpdate - Items that will be updated on the actor.
 */
export function advance_ranger(toCreate,toUpdate){
    const baiID1 = toCreate.find(e => e.name === "Mark for Death");
    const baiID2 = toUpdate.find(e => e.name === "Mark for Death");
    if (baiID1 || baiID2){
        let markForDeath = 0
        if (spID1){
            markForDeath = baiID1
        }
        else{
            markForDeath = baiID2
        }
        const featureNames = [
            // Feats
            "Mark of Thorns",
            "Mark of Affliction" 
        ]; 
        
        for (let i = 0; i < featureNames.length;i++){
            let feats = toCreate.find(e => e.name ===  featureNames[i])
            if (feats){
                feats.system.consume.target = markForDeath._id;
            }
            
        }
    }
}
