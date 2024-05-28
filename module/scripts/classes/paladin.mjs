/**
 * Makes it so that features use their proper cost (Only works on level up)
 *   @param {object[]} toCreate - Items that will be created on the actor.
 *   @param {object[]} toUpdate - Items that will be updated on the actor.
 */
export function advance_paladin(toCreate,toUpdate){
    const lay1 = toCreate.find(e => e.name === "Lay on Hands");
    const lay2 = toUpdate.find(e => e.name === "Lay on Hands");
    if (lay1 || lay2){
        let lay = 0
        if (kiID1){
            lay = lay1
        }
        else{
            lay = lay2
        }
        let featureNames = [
            "Cleansing Touch"
        ]
        
        for (let i = 0; i < featureNames.length;i++){
            let feats = toCreate.find(e => e.name ===  featureNames[i])
            if (feats){
                feats.system.consume.target = lay._id;
            }
            
        }
    }
}