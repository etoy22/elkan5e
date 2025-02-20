/**
 * Handle the "Meld with Shadows" effect for the given actor.
 * 
 * This function checks if the actor has the "Meld with Shadows [Effect]" active.
 * If the actor also has any other effect that is not "Meld with Shadows [Attacks]",
 * the "Meld with Shadows [Effect]" will be deleted.
 * 
 * @param {object} actor - The actor object to be processed.
 * @returns {Promise<void>} A promise that resolves when the effect has been processed.
 */
export async function meldWithShadow(actor){
    const meldEffect = actor.effects.find(i => i.name === "Meld with Shadows [Effect]");
    if (meldEffect && actor.effects.find(i => i.name !== "Meld with Shadows [Attacks]")){
        await meldEffect.delete(); 
    }
}

