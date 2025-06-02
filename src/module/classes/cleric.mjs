export async function infusedHealer(workflow) {
    // Bail if not a healing spell of 1st level or higher
    let item = workflow.item;
    if (item.type !== "spell" || item.system.level < 1 || item.system.actionType !== "heal") return;
    
    // Get caster's token and actor
    let casterToken = workflow.token ?? canvas.tokens.get(workflow.actor.token?.id);
    let caster = casterToken?.actor;
    if (!casterToken || !caster) {
        console.warn("Infused Healer | Could not resolve caster token.");
        return;
    }
    
    const targets = [...workflow.targets];
    if (targets.some(t => t.actor.id === caster.id)) return;
    
    const healAmount = "" + (2 + item.system.level);
    
    // Heal the caster
    const itemData = {
        type: "feat",
        img: "icons/magic/light/orbs-hand-gray.webp"
    }
    const damageRoll = await new Roll(healAmount,{},{type:"healing"}).evaluate({async:true});
    new MidiQOL.DamageOnlyWorkflow(caster, casterToken, damageRoll.total, "healing", [casterToken], damageRoll, {itemData:itemData,flavor: `Infused Healer`});
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
                ui.notifications.notify(game.i18n.format("elkan5e.notifications.HealingOverflow", { name: actor.name, overflow: overflow, target: target.name }));
            }
        }
    }
}

