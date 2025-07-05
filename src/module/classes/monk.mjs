import { deleteEffectRemoveEffect } from '../global.mjs';
const DialogV2 = foundry.applications.api.DialogV2;

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
export async function rmvMeldShadow(actor) {
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
export async function rmvhijackShadow(actor) {
    await deleteEffectRemoveEffect(
        actor,
        "elkan5e.monk.hijackShadowEffect",
        "elkan5e.monk.hijackShadowAttacks",
        ["elkan5e.monk.emptyBody"]
    );
}

export async function hijackShadow(workflow) {
    const actor = workflow.actor;
    emptyBody(actor);
}


export async function meldWithShadows(workflow) {
    const actor = workflow.actor;
    emptyBody(actor);
}

export async function emptyBody(actor) {
    if (!actor.isOwner ) return;
    if (actor.items.find(i => i.system.identifier === "empty-body")) {
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
        let confirm = await DialogV2.confirm({
            window: { title: game.i18n.localize("elkan5e.monk.emptyBodyTitle") },
            content: `<p>${game.i18n.localize("elkan5e.monk.emptyBodyContent")}</p>`,
            rejectClose: false,
            modal: true
        });
        if (confirm) {
            await actor.createEmbeddedDocuments("ActiveEffect", [emptyBody]);
        }
    }
}