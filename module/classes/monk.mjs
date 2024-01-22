/**
 * Makes it so that features use their proper cost (Only works on level up)
 *   @param {object[]} toCreate - Items that will be created on the actor.
 *   @param {object[]} toUpdate - Items that will be updated on the actor.
 */
export function advance_monk(toCreate,toUpdate){
    const kiID1 = toCreate.find(e => e.name === "Ki");
    const kiID2 = toUpdate.find(e => e.name === "Ki");
    if (kiID1 || kiID2){
        let ki = 0
        if (kiID1)
            ki = kiID1
        else
            ki = kiID2

        
        let featureNames = [
            "Flurry of Blows",
            "Patient Defense",
            "Step of the Wind",
            "Stillness of Mind",
            "Resilience in Motion",
            "Deflect Missiles [Throw Back]",
            "Empty Body",
            "Astral Projection [Monk]", 
            "Perfect Self",
            // Way of the Open Hand
            "Wholeness of Body",
            "Quivering Palm"
        ]
        
        for (let i = 0; i < featureNames.length;i++){
            let feats = toCreate.find(e => e.name ===  featureNames[i])
            if (feats){
                feats.system.consume.target = ki._id;
            }
            
        }
    }



}