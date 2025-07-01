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
    const damageRoll = await new Roll(healAmount, {}, { type: "healing" }).evaluate({ async: true });
    new MidiQOL.DamageOnlyWorkflow(caster, casterToken, damageRoll.total, "healing", [casterToken], damageRoll, { itemData: itemData, flavor: `Infused Healer` });
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



export async function healingOverflow(workflow) {
    const [workflowData] = workflow.args;
    if (!workflow.item || workflow.item.type !== "spell" || workflow.item.system.actionType !== "heal" || workflow.item.system.level < 1) return;

    const healing = workflowData.damageTotal;
    if (!healing || healing === 0) return;

    const caster = workflow.actor;
    const casterToken = workflow.token;
    if (!caster || !casterToken) return;

    const targets = workflowData.targets ?? [];
    if (targets.length === 0) return;

    // Calculate max overflow healing from targets
    let maxOverflow = 0;
    for (const targetToken of targets) {
        const actor = targetToken.actor;
        if (!actor) continue;

        const { max, value } = actor.system.attributes.hp;
        const missingHP = max - value;
        const overflow = healing - missingHP;
        if (overflow > maxOverflow) maxOverflow = overflow;
    }
    if (maxOverflow <= 0) return;

    // Determine range from the spell item
    const range = workflow.item.system.range?.value ?? 0;

    // Find tokens within range that are missing HP
    const candidates = canvas.tokens.placeables.filter(token => {
        const actor = token.actor;
        if (!actor || token.document.hidden) return false;
        const hp = actor.system.attributes.hp;
        const inRange = canvas.grid.measureDistance(casterToken, token) <= range;
        return hp.value < hp.max && inRange;
    });
    if (candidates.length === 0) return;

    // Build dropdown options for the dialog
    const options = candidates.map(token => {
        const id = token.document.id;
        const name = token.document.name ?? token.name ?? "Unnamed";
        return `<option value="${id}">${name}</option>`;
    }).join("");

    const content = `
        <form>
            <div class="form-group">
                <label>Redirect overflow healing:</label>
                <select id="overflow-target">${options}</select>
            </div>
        </form>
    `;

    const itemData = {
        type: "feat",
        img: "icons/magic/light/explosion-star-glow-silhouette.webp"
    };

    const damageRoll = await new Roll(`${maxOverflow}`, {}, { type: "healing" }).evaluate({ async: true });

    new Dialog({
        title: "Healing Overflow",
        content,
        buttons: {
            ok: {
                label: "Apply",
                callback: async (html) => {
                    const targetId = html.find("#overflow-target").val();
                    const recipient = canvas.tokens.get(targetId);
                    if (!recipient) return;

                    new MidiQOL.DamageOnlyWorkflow(caster, casterToken, damageRoll.total, "healing", [recipient], damageRoll, { itemData, flavor: `Healing Overflow` });
                }
            },
            cancel: { label: "Cancel" }
        },
        default: "ok"
    }).render(true);
}
