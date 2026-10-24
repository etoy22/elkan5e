import { measureRangeDistance, t } from "../shared/helpers.mjs";
import { damageOnly } from "../shared/midi-compat.mjs";

const DialogV2 = foundry.applications.api.DialogV2;

const getWorkflowActionType = (workflow) =>
	workflow?.activity?.actionType ??
	workflow?.activity?.type ??
	workflow?.item?.system?.actionType ??
	null;

const getWorkflowTargets = (workflow) =>
	Array.from(workflow?.targets ?? workflow?.hitTargets ?? []);

/**
 * Heals the caster for 2 + cast level after a healing spell of base level 1 or higher,
 * provided none of its targets is the caster. Requires a caster token.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function infusedHealer(workflow) {
	// Bail if not a healing spell of 1st level or higher
	let item = workflow.item;
	if (
		item?.type !== "spell" ||
		item.system.level < 1 ||
		getWorkflowActionType(workflow) !== "heal"
	)
		return;

	// Get caster's token and actor
	let casterToken = workflow.token ?? canvas.tokens.get(workflow.actor.token?.id);
	let caster = casterToken?.actor;
	if (!casterToken || !caster) {
		console.warn("Infused Healer | Could not resolve caster token.");
		return;
	}

	const targets = getWorkflowTargets(workflow);
	if (targets.some((t) => t.actor.id === caster.id)) return;

	// Use the level the spell was cast at, not its base level.
	const castLevel = Number(
		workflow.castData?.castLevel ?? workflow.spellLevel ?? item.system.level,
	);
	const healAmount = "" + (2 + castLevel);

	// Heal the caster
	const itemData = {
		type: "feat",
		img: "icons/magic/light/orbs-hand-gray.webp",
	};
	const damageRoll = await new Roll(healAmount, {}, { type: "healing" }).evaluate();
	await damageOnly(caster, casterToken, damageRoll.total, "healing", [casterToken], damageRoll, {
		itemData: itemData,
		flavor: `Infused Healer`,
	});
}

/**
 * Runs heal Over class feature automation.
 *
 * @param {*} itemOrWorkflow - Legacy item document or workflow-like payload.
 * @param {*} roll - Legacy roll payload.
 */
export async function healOver(itemOrWorkflow, roll) {
	const workflow =
		itemOrWorkflow?.item && itemOrWorkflow?.actor && itemOrWorkflow?.args
			? itemOrWorkflow
			: null;
	if (workflow) return healingOverflow(workflow);

	const item = itemOrWorkflow?.item ?? itemOrWorkflow;
	const actor = itemOrWorkflow?.actor ?? item?.actor ?? null;
	const actionType =
		itemOrWorkflow?.activity?.actionType ??
		itemOrWorkflow?.activity?.type ??
		item?.system?.actionType ??
		null;
	if (
		actionType !== "heal" ||
		!actor?.items?.find((i) => i.system.identifier === "healing-overflow")
	)
		return;

	const healingTotal = Number(roll?.total ?? 0);
	if (!Number.isFinite(healingTotal) || healingTotal <= 0) return;

	const hp = actor.system?.attributes?.hp;
	const remainingHealth = Number(hp?.max ?? 0) - Number(hp?.value ?? 0);
	const overflow = healingTotal - remainingHealth;
	if (overflow <= 0) return;

	ui.notifications.notify(
		game.i18n.format("elkan5e.notifications.HealingOverflow", {
			name: actor.name,
			overflow,
			target: actor.name,
		}),
	);
}

/**
 * Offers to redirect the greatest excess healing from a leveled healing spell to another
 * injured creature within range whose token is not hidden. Touch or unspecified range uses
 * one grid distance.
 * Resolves after opening the dialog; healing is applied when its Apply button is chosen.
 *
 * @param {*} workflow - MIDI-QOL workflow or macro scope containing it.
 * @returns {Promise<void>}
 */
export async function healingOverflow(workflow) {
	// Midi-QOL calls this as an actor on-use macro, passing its macro scope; the workflow is inside it.
	const wf = workflow?.workflow ?? workflow;
	const [workflowData] = workflow?.args ?? [];
	const item = wf?.item ?? workflow?.item;
	if (
		item?.type !== "spell" ||
		getWorkflowActionType(wf) !== "heal" ||
		Number(workflowData?.castData?.castLevel ?? wf?.castData?.castLevel ?? item.system.level) <
			1
	)
		return;

	const healing = workflowData?.damageTotal ?? wf?.damageTotal;
	if (!healing) return;

	const caster = wf.actor ?? workflow.actor;
	const casterToken = wf.token ?? workflow.token;
	if (!caster || !casterToken) return;

	const targets = [...(wf.targets ?? workflowData?.targets ?? [])];
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

	// The spell's range; touch spells reach an adjacent creature.
	const rangeData = wf.activity?.range ?? item.system.range ?? {};
	const range =
		rangeData.units === "touch"
			? (canvas.grid.distance ?? 5)
			: Number(rangeData.value ?? 0) || (canvas.grid.distance ?? 5);

	// Find other tokens within range that are missing HP
	const targetIds = new Set(targets.map((tk) => tk.document?.id ?? tk.id));
	const candidates = canvas.tokens.placeables.filter((token) => {
		const actor = token.actor;
		if (!actor || token.document.hidden || targetIds.has(token.document.id)) return false;
		const hp = actor.system.attributes.hp;
		const inRange = measureRangeDistance(casterToken, token) <= range;
		return hp.value < hp.max && inRange;
	});
	if (candidates.length === 0) return;

	// Build dropdown options for the dialog
	const options = candidates
		.map((token) => {
			const id = token.document.id;
			const name = token.document.name ?? token.name ?? "Unnamed";
			return `<option value="${id}">${name}</option>`;
		})
		.join("");

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
		img: "icons/magic/light/explosion-star-glow-silhouette.webp",
	};

	const damageRoll = await new Roll(`${maxOverflow}`, {}, { type: "healing" }).evaluate();

	new DialogV2({
		window: { title: "Healing Overflow" },
		content,
		buttons: [
			{
				action: "ok",
				label: "Apply",
				callback: async (_event, button, _dialog) => {
					const targetId = button.form.querySelector("#overflow-target")?.value;
					const recipient = canvas.tokens.get(targetId);
					if (!recipient) return;
					await damageOnly(
						caster,
						casterToken,
						damageRoll.total,
						"healing",
						[recipient],
						damageRoll,
						{ itemData, flavor: "Healing Overflow" },
					);
				},
			},
			{
				action: "cancel",
				label: "Cancel",
				default: true,
			},
		],
	}).render(true);
}

/**
 * Runs Holy Strike class feature automation.
 * Fires the Holy Strike activity once per turn, on the first hit only.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @param {Item} macroItem - The Holy Strike item.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function holyStrike(workflow, macroItem) {
	try {
		if (!workflow.actor || workflow.hitTargets.size === 0) return;
		if (!["mwak", "rwak"].includes(workflow.activity?.actionType)) return;

		const actor = workflow.actor;

		// Only fires on the first hit of the turn.
		if (game.combat) {
			const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
			if (actor.getFlag("elkan5e", "holyStrikeTime") === combatTime) return;
			await actor.setFlag("elkan5e", "holyStrikeTime", combatTime);
		}

		const activity = macroItem?.system.activities.contents[0];
		if (activity) await activity.use({ event: workflow.event });
	} catch (err) {
		console.error("Holy Strike |", err);
	}
}

/**
 * Runs Shadow Refuge class feature automation. When the caster spends a spell slot on an
 * illusion spell of 1st level or higher, reminds them that Shadow Refuge can be used.
 *
 * @param {object} activity - Activity that was used.
 * @param {object} usageConfig - Usage configuration for the activation.
 */
export function shadowRefuge(activity, usageConfig) {
	const item = activity?.item;
	const actor = activity?.actor;
	if (item?.type !== "spell" || item.system.school !== "ill" || !actor?.isOwner) return;

	const slot = usageConfig?.spell?.slot;
	if (!slot || usageConfig?.consume?.spellSlot === false) return;
	const level = Number(actor.system.spells?.[slot]?.level ?? 0);
	if (level < 1) return;

	if (!actor.items.some((i) => i.system?.identifier === "shadow-refuge")) return;

	ui.notifications.info(
		t("elkan5e.notifications.ShadowRefugeReminder", {
			name: actor.name,
			spell: item.name,
			level,
			dice: level * 2,
		}),
	);
}

/**
 * Runs Blessed Healing at dnd5e.preRollDamageV2: healing spells of 1st level or higher restore
 * an extra 2 + the cast level on the first healing roll. Mutates the roll configuration.
 *
 * @param {object} rollConfig - Damage roll configuration.
 */
export function blessedHealing(rollConfig) {
	const activity = rollConfig?.subject;
	if (activity?.type !== "heal") return;
	const item = activity.item;
	const roll = rollConfig.rolls?.[0];
	if (!roll || item?.type !== "spell") return;
	// The roll data has the level the spell was cast at.
	const level = Number(roll.data?.item?.level ?? item.system?.level ?? 0);
	if (level < 1) return;
	if (!activity.actor?.items.some((i) => i.system?.identifier === "blessed-healing")) return;
	roll.parts = [...(roll.parts ?? []), String(2 + level)];
}
