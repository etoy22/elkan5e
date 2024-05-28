/**
 * Makes it so that features use their proper cost (Only works on level up)
 *   @param {object[]} toCreate - Items that will be created on the actor.
 *   @param {object[]} toUpdate - Items that will be updated on the actor.
 */
export function advance_sorcerer(toCreate,toUpdate){
    const spID1 = toCreate.find(e => e.name === "Sorcery Points");
    const spID2 = toUpdate.find(e => e.name === "Sorcery Points");
    if (spID1 || spID2){
        let sorceryPoints = 0
        if (spID1){
            sorceryPoints = spID1
        }
        else{
            sorceryPoints = spID2
        }
        
        const featureNames = [
            "Magic Coalescence",
            //Metamagic
            "Accurate Spell",
            "Careful Spell",
            "Distant Spell",
            "Empowered Spell",
            "Extended Spell",
            "Heightened Spell",
            "Raw Spell",
            "Quickened Spell",
            "Subtle Spell",
            "Twinned Spell",
            "Shield of Will",
            // Draconic Origin
            "Frightful Gaze"
        ]; 

        for (let i = 0; i < featureNames.length;i++){
            let feats = toCreate.find(e => e.name ===  featureNames[i])
            if (feats){
                feats.system.consume.target = sorceryPoints._id;
            }
        }
    }
}
