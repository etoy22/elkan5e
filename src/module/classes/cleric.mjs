/**
 * Adds functionality to Healing Overflow.
 *   @param {object} item - The item used.
 *   @param {object} roll - The resulting roll.
 */
export function healOver(item, roll) {
    if (item.data.type === "healing" && item.actor.items.find(i => i.name === "Healing Overflow")) {
        const remainingHealth = item.actor.data.data.attributes.hp.max - item.actor.data.data.attributes.hp.value;
        const overflow = roll.total - remainingHealth;
        if (overflow > 0) {
            const targets = item.actor.getActiveTokens().map(token => token.actor).filter(target => target !== item.actor && target.data.data.attributes.hp.value < target.data.data.attributes.hp.max);
            if (targets.length > 0) {
                const target = targets[0]; // Example: apply to the first valid target
                target.update({ "data.attributes.hp.value": Math.min(target.data.data.attributes.hp.value + overflow, target.data.data.attributes.hp.max) });
                ui.notifications.notify(`Healing Overflow: ${overflow} healing overflow applied to ${target.name}.`);
            }
        }
    }
}

/**
 * Adds functionality to Infused Healer.
 *   @param {object} item - The item used.
 */
export function infuseHeal(item) {
    if (item.data.type === "healing" && item.actor.items.find(i => i.name === "Infused Healer")) {
        const spellLevel = item.data.data.level;
        const infusedValue = 2 + spellLevel;
        item.actor.update({
            "data.attributes.hp.value": Math.min(item.actor.data.data.attributes.hp.value + infusedValue, item.actor.data.data.attributes.hp.max)
        });
        ui.notifications.notify("Infused Healer: Additional healing applied.");
    }
}
