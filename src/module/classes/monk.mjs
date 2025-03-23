import { deleteEffectRemoveEffect } from '../global.mjs';

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
export async function meldWithShadow(actor) {
    await deleteEffectRemoveEffect(
        actor,
        "elkan5e.monk.meldWithShadowsEffect",
        "elkan5e.monk.meldWithShadowsAttacks",
        ["elkan5e.monk.emptyBody"]
    );
}

/**
 * Handle the "Hijack Shadow" effect for the given actor.
 * 
 * This function checks if the actor has the "Hijack Shadow [Effect]" active.
 * If the actor also has any other effect that is not "Hijack Shadow [Attacks]",
 * the "Hijack Shadow [Effect]" will be deleted.
 * 
 * @param {object} actor - The actor object to be processed.
 * @returns {Promise<void>} A promise that resolves when the effect has been processed.
 */
export async function hijackShadow(actor) {
    await deleteEffectRemoveEffect(
        actor,
        "elkan5e.monk.hijackShadowEffect",
        "elkan5e.monk.hijackShadowAttacks",
        ["elkan5e.monk.emptyBody"]
    );
}

export async function shadowMonk(activity){
    const item = activity.item;
    if (item.name === game.i18n.localize("elkan5e.monk.meldWithShadows") || item.name === game.i18n.localize("elkan5e.monk.hijackShadow")){
        const actor = activity.actor;
        if(actor.items.find(i => i.name === game.i18n.localize("elkan5e.monk.emptyBody"))){
            const emptyBody = {
                "_id": "4dvYtqvbQGDsVi51",
                "changes": [
                    { "key": "system.traits.dr.value", "mode": 0, "value": "bludgeoning", "priority": 20 },
                    { "key": "system.traits.dr.value", "mode": 0, "value": "piercing", "priority": 20 },
                    { "key": "system.traits.dr.value", "mode": 0, "value": "slashing", "priority": 20 },
                    { "key": "system.traits.dv.value", "mode": 0, "value": "radiant", "priority": 20 }
                ],
                "disabled": false,
                "duration": { "seconds": 600 },
                "origin": "Item.xqRleciuHDZlYCl6",
                "name": game.i18n.localize("elkan5e.monk.emptyBody"),
                "statuses": ["invisible"],
                "img": "icons/magic/perception/silhouette-stealth-shadow.webp",
                "type": "base"
            };

            new Dialog({
                title: game.i18n.localize("elkan5e.dialog.emptyBodyTitle"),
                content: `<p>${game.i18n.localize("elkan5e.dialog.emptyBodyContent")}</p>`,
                buttons: {
                    yes: {
                        icon: "<i class='fas fa-check'></i>",
                        label: game.i18n.localize("elkan5e.dialog.yes"),
                        callback: async () => {
                            await actor.createEmbeddedDocuments("ActiveEffect", [emptyBody]);
                        }
                    },
                    no: {
                        icon: "<i class='fas fa-times'></i>",
                        label: game.i18n.localize("elkan5e.dialog.no")
                    }
                },
                default: "no"
            }).render(true);
        }
    }
}
