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
    //     console.log("Elkan 5e | Healing Overflow triggered");

    const item = workflow.item;
    if (item.type !== "spell" || item.system.actionType !== "heal" || item.system.level < 1) return;
    const healing = workflow.damageTotal
    const caster = workflow.actor;
    const casterToken = workflow.token;
    const targets = [...workflow.targets];
    if (!caster || !casterToken || targets.length === 0 || healing === 0) return;


    let maxOverflow = 0;
    for (let target of targets) {
        const actor = target.actor;
        const maxHP = actor.system.attributes.hp.max;
        const currentHP = actor.system.attributes.hp.value;
        const missingHP = maxHP - currentHP;
        if (healing - missingHP > 0 && healing - missingHP > maxOverflow) {
            maxOverflow = healing - missingHP;
        }
    }
    if (maxOverflow <= 0) return

    //     console.log("Elkan 5e | Max Overflow:", maxOverflow);
    const range = item.system.range?.value;
    //     console.log("Elkan 5e | Range:", range);
    const candidates = canvas.tokens.placeables.filter(t =>
        !t.document.hidden &&
        t.actor &&
        t.actor.system?.attributes?.hp?.value < t.actor.system?.attributes?.hp?.max &&
        canvas.grid.measureDistance(casterToken, t) <= range
    );
    //     console.log("Elkan 5e | Candidates:", candidates);
    if (candidates.length === 0) return

    let options = "";
    try {
        options = candidates.map(t => {
            const id = t.document?.id;
            const name = t.document?.name ?? t.name ?? "Unnamed";
            return `<option value="${id}">${name}</option>`;
        }).join("");
    } catch (err) {
        console.error("Error building dropdown options", err);
    }


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
    }
    const damageRoll = await new Roll("" + maxOverflow, {}, { type: "healing" }).evaluate({ async: true });


    await new Dialog({
        title: "Healing Overflow",
        content,
        buttons: {
            ok: {
                label: "Apply",
                callback: async (html) => {
                    const targetId = html.find("#overflow-target").val();
                    const recipient = canvas.tokens.get(targetId);
                    if (!recipient) return;

                    new MidiQOL.DamageOnlyWorkflow(caster, casterToken, damageRoll.total, "healing", [recipient], damageRoll, { itemData: itemData, flavor: `Healing Overflow` });
                }
            },
            cancel: { label: "Cancel" }
        },
        default: "ok"
    }).render(true);
}
