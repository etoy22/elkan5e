const DialogV2 = foundry.applications.api.DialogV2;

const getWorkflowActionType = (workflow) =>
	workflow?.activity?.actionType ??
	workflow?.activity?.type ??
	workflow?.item?.system?.actionType ??
	null;

const getWorkflowTargets = (workflow) =>
	Array.from(workflow?.targets ?? workflow?.hitTargets ?? []);

const measureRangeDistance = (from, to) => {
	if (!canvas?.grid) return Number.POSITIVE_INFINITY;
	const origin = from?.center ?? from;
	const destination = to?.center ?? to;
	if (typeof canvas.grid.measurePath === "function") {
		try {
			const path = canvas.grid.measurePath([origin, destination], {});
			if (Number.isFinite(path?.distance)) return path.distance;
		} catch (error) {
			void error;
		}
	}
	return canvas.grid.measureDistance(origin, destination);
};

/**
 * Runs infused Healer class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function infusedHealer(workflow) {
	// Bail if not a healing spell of 1st level or higher
	let item = workflow.item;
	if (
		item.type !== "spell" ||
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

	const healAmount = "" + (2 + item.system.level);

	// Heal the caster
	const itemData = {
		type: "feat",
		img: "icons/magic/light/orbs-hand-gray.webp",
	};
	const damageRoll = await new Roll(healAmount, {}, { type: "healing" }).evaluate({
		async: true,
	});
	new MidiQOL.DamageOnlyWorkflow(
		caster,
		casterToken,
		damageRoll.total,
		"healing",
		[casterToken],
		damageRoll,
		{ itemData: itemData, flavor: `Infused Healer` },
	);
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
 * Runs healing Overflow class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function healingOverflow(workflow) {
	const [workflowData] = workflow.args;
	if (
		!workflow.item ||
		workflow.item.type !== "spell" ||
		getWorkflowActionType(workflow) !== "heal" ||
		workflow.item.system.level < 1
	)
		return;

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
	const candidates = canvas.tokens.placeables.filter((token) => {
		const actor = token.actor;
		if (!actor || token.document.hidden) return false;
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

	const damageRoll = await new Roll(`${maxOverflow}`, {}, { type: "healing" }).evaluate({
		async: true,
	});

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
					new MidiQOL.DamageOnlyWorkflow(
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
 * Runs shadow Refuge class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function shadowRefuge(workflow) {
	try {
		console.log("Elkan 5e | Shadow Refuge check");
		const item = workflow.item ?? workflow;
		if (!item || item.type !== "spell") return;

		const school = (item.system?.school || "").toLowerCase();
		const level = Number(item.system?.level ?? 0);
		if (school !== "illusion" || level < 1) return;

		const actor = workflow.actor ?? (workflow.token ? workflow.token.actor : null);
		if (!actor) return;
		const hasShadow = actor.items.find(
			(i) => i.system?.identifier === "shadow-refuge" || i.name === "Shadow Refuge",
		);
		if (hasShadow && actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.ShadowRefugeReminder", {
					name: actor.name,
				}),
			);
		}
	} catch (err) {
		console.error("elkan5e | shadowRefuge error:", err);
	}
}
