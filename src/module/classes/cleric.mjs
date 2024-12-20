/**
 * Adds functionality to Infused Healer.
 *   @param {object} actor - The actor using the item.
 *   @param {object} activity - The activity performed.
 *   @param {object} usageConfig - The usage configuration.
 */
export function infuseHeal(actor, activity, usageConfig) {
    if (activity.type === "heal" && actor.items.find(i => i.name === "Infused Healer")) {
        const spellLevel = parseInt(usageConfig.spell.slot.replace('spell', ''));
        const infusedValue = 2 + spellLevel;
        if (actor.system.attributes.hp.value !== actor.system.attributes.hp.max) {
            let newHpValue = Math.min(actor.system.attributes.hp.value + infusedValue,actor.system.attributes.hp.max)
            actor.update({
                "system.attributes.hp.value": newHpValue
            });
            if (actor.isOwner) {
                ui.notifications.notify("Infused Healer: Additional healing applied.");
            }
        }
    }
}
/**
 * Adds functionality to Healing Overflow.
 *   @param {object} item - The item used.
 *   @param {object} roll - The resulting roll.
 */
export function healOver(item, roll) {
    if (activity.type === "heal" && actor.items.find(i => i.name === "Healing Overflow")) {
        const remainingHealth = item.actor.system.attributes.hp.max - item.actor.system.attributes.hp.value;
        const overflow = roll.total - remainingHealth;
        if (overflow > 0) {
            const targets = item.actor.getActiveTokens().map(token => token.actor).filter(target => target !== item.actor && target.system.attributes.hp.value < target.system.attributes.hp.max);
            if (targets.length > 0) {
                const target = targets[0]; // Example: apply to the first valid target
                target.update({ "system.attributes.hp.value": Math.min(target.system.attributes.hp.value + overflow, target.system.attributes.hp.max) });
                ui.notifications.notify(`Healing Overflow: ${overflow} healing overflow applied to ${target.name}.`);
            }
        }
    }
}

