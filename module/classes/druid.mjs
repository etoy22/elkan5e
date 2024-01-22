/**
 * Makes it so that features use their proper cost (Only works on level up)
 *   @param {object[]} toCreate - Items that will be created on the actor.
 *   @param {object[]} toUpdate - Items that will be updated on the actor.
 */
export function advance_druid(toCreate,toUpdate){
    const wildID1 = toCreate.find(e => e.name === "Wild Shape");
    const wildID2 = toUpdate.find(e => e.name === "Wild Shape");
    if (wildID1 || wildID2){
        let wildShape = 0
        if (spID1)
            wildShape = wildID1
        else
            wildShape = wildID2

        const featureNames = [
            "Cragged Path",
            "Herd's Momentum",
            "Howling Storm",
            "Ice Flow",
            "Lurking Fog",
            "Lesser Shifting",
            "Shifting Sands",
            "Shifting Sands",
            "Underworld Eyes",
            "Breath of the Sea",
            "Crawler's Claws",
            "Springing Step",
            "Drifting Tides",
            "Rising Mud",
            "Soaring Winds",
            // Shifter Circle
            "Wild Shapeshifting"
        ]; 

        for (let i = 0; i < featureNames.length;i++){
            let feats = toCreate.find(e => e.name ===  featureNames[i])
            if (feats){
                feats.system.consume.target = wildShape._id;
            }           
        }
    }
}