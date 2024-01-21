export function focus(item,config){
    //checks if both Focused Slaughter​ and Reckless Attack Exists
    const effects = item.actor.appliedEffects;
    const hasFocus = effects.some(e => e.name === "Focused Slaughter");
    const hasReckless = effects.some(e => e.name === "Reckless Attack");

    if (hasFocus && hasReckless){
        if (config.data.item.actionType == "mwak" && config.advantage){
            config.elvenAccuracy = true;
        }
    }
}   