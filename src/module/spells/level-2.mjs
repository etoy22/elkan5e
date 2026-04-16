import { drainedEffect } from "../shared/effects.mjs";

const SIZE_ORDER = ["tiny", "sm", "med", "lg", "huge", "grg"];
const SIZE_TO_GRID = {
	tiny: 0.5,
	sm: 1,
	med: 1,
	lg: 2,
	huge: 3,
	grg: 4,
};

/**
 * Runs well Of Corruption spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function wellOfCorruption(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = workflow.token.actor?.uuid;
	if (!caster || !casterToken || !casterUuid) {
		console.warn("Well of Corruption aborted: missing caster or casterToken");
		return;
	}

	const targetEntries = Array.from(workflow.targets ?? []);
	if (targetEntries.length === 0) {
		console.warn("Well of Corruption: No targets to affect");
		return;
	}

	const workflowCastLevel = Number(workflow.castData?.castLevel);
	const itemCastLevel = Number(workflow.item?.system?.level);
	const effectiveCastLevel = Math.max(
		Number.isFinite(workflowCastLevel)
			? workflowCastLevel
			: Number.isFinite(itemCastLevel)
				? itemCastLevel
				: 2,
		2,
	);
	const totalDice = 4 + Math.max(effectiveCastLevel - 2, 0) * 2;
	const damageRoll = await new Roll(`${totalDice}d8`).evaluate({ async: true });

	const tokenIdFromEntry = (entry) => {
		if (!entry) return null;
		if (typeof entry === "string") return entry;
		if (entry.document?.id) return entry.document.id;
		if (entry.id) return entry.id;
		if (entry.object?.document?.id) return entry.object.document.id;
		return null;
	};

	const buildIdSet = (collection) => {
		const ids = new Set();
		if (!collection) return ids;
		for (const entry of collection) {
			const id = tokenIdFromEntry(entry);
			if (id) ids.add(id);
		}
		return ids;
	};

	const failedSaveIds = buildIdSet(workflow.failedSaves);
	const successfulSaveIds = buildIdSet(workflow.saves);

	for (const targetEntry of targetEntries) {
		const tokenId = tokenIdFromEntry(targetEntry);
		if (!tokenId) {
			console.warn("Well of Corruption: Unable to resolve target token ID", targetEntry);
			continue;
		}

		const targetToken =
			typeof targetEntry === "string"
				? canvas.tokens.get(targetEntry)
				: (targetEntry.document?.object ??
					targetEntry.object ??
					canvas.tokens.get(tokenId));
		if (!targetToken) {
			console.warn(`Well of Corruption: Token with ID ${tokenId} not found on canvas`);
			continue;
		}

		const failedSave = failedSaveIds.has(tokenId);
		const saved = !failedSave && successfulSaveIds.has(tokenId);
		const damage = saved ? Math.floor(damageRoll.total / 2) : damageRoll.total;
		if (damage <= 0) continue;

		await drainedEffect(
			targetToken.actor,
			damage,
			"Well of Corruption",
			"icons/magic/unholy/orb-swirling-teal.webp",
			casterUuid,
		);
	}
}

/**
 * Runs enlarge spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function enlarge(workflow) {
	if (!workflow._failedSaves || workflow._failedSaves.size === 0) {
		ui.notifications.warn("No targets failed the roll — cannot apply enlarge.");
		return;
	}

	for (const failedToken of workflow._failedSaves) {
		let token;
		if (typeof failedToken === "string") {
			token = canvas.tokens.get(failedToken);
		} else {
			token = failedToken;
		}
		if (!token) continue;

		const actor = token.actor;
		if (!actor) continue;

		const flag = token.document.getFlag("elkan5e", "sizeChange") || {};
		if (flag.enlarged) {
			ui.notifications.info(`${actor.name} is already enlarged.`);
			continue;
		}
		if (flag.reduced) {
			ui.notifications.info(
				`${actor.name} is currently reduced — cannot enlarge until reduced effect removed.`,
			);
			continue;
		}

		const currentSize = actor.system.traits.size;
		const currentIndex = SIZE_ORDER.indexOf(currentSize);
		if (currentIndex === -1 || currentIndex >= SIZE_ORDER.length - 1) {
			ui.notifications.warn(`${actor.name} is already at maximum size or unknown size.`);
			continue;
		}

		const newSize = SIZE_ORDER[currentIndex + 1];
		const newGrid = SIZE_TO_GRID[newSize];

		if (!flag.originalSize) {
			flag.originalSize = currentSize;
			flag.originalWidth = token.document.width;
			flag.originalHeight = token.document.height;
		}
		flag.enlarged = true;

		await token.document.update({
			width: newGrid,
			height: newGrid,
			"flags.elkan5e.sizeChange": flag,
		});
		await actor.update({ "system.traits.size": newSize });

		ui.notifications.info(`${actor.name} has been enlarged to size ${newSize.toUpperCase()}.`);
	}
}

/**
 * Runs reduce spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function reduce(workflow) {
	if (!workflow._failedSaves || workflow._failedSaves.size === 0) {
		ui.notifications.warn("No targets failed the roll — cannot apply reduce.");
		return;
	}

	for (const failedToken of workflow._failedSaves) {
		let token;
		if (typeof failedToken === "string") {
			token = canvas.tokens.get(failedToken);
		} else {
			token = failedToken;
		}
		if (!token) continue;

		const actor = token.actor;
		if (!actor) continue;

		const flag = token.document.getFlag("elkan5e", "sizeChange") || {};
		if (flag.reduced) {
			// Already reduced, skip
			continue;
		}
		if (flag.enlarged) {
			// Currently enlarged, cannot reduce until enlarged removed
			continue;
		}

		const currentSize = actor.system.traits.size;
		const currentIndex = SIZE_ORDER.indexOf(currentSize);
		if (currentIndex <= 0) {
			// Already at minimum or unknown size, skip
			continue;
		}

		const newSize = SIZE_ORDER[currentIndex - 1];
		const newGrid = SIZE_TO_GRID[newSize];

		if (!flag.originalSize) {
			flag.originalSize = currentSize;
			flag.originalWidth = token.document.width;
			flag.originalHeight = token.document.height;
		}
		flag.reduced = true;

		await token.document.update({
			width: newGrid,
			height: newGrid,
			"flags.elkan5e.sizeChange": flag,
		});
		await actor.update({ "system.traits.size": newSize });

		// You can uncomment to notify
		// ui.notifications.info(`${actor.name} has been reduced to size ${newSize.toUpperCase()}.`);
	}
}

/**
 * Runs return To Normal Size spell automation.
 *
 * @param {*} effect - Active effect being handled.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function returnToNormalSize(effect) {
	const actor = effect.parent;

	if (!actor || !effect) {
		console.warn("Missing actor or effect, aborting returnToNormalSize.");
		return;
	}

	const name = effect.name?.toLowerCase();

	if (!name?.includes("enlarge") && !name?.includes("reduce")) {
		return;
	}

	const token = actor.getActiveTokens()[0];

	if (!token) {
		console.warn("No active token found for actor.");
		return;
	}

	const flag = token.document.getFlag("elkan5e", "sizeChange");

	if (!flag) {
		console.warn("No sizeChange flag found on token. Nothing to revert.");
		return;
	}

	let changed = false;

	if (name.includes("enlarge") && flag.enlarged) {
		flag.enlarged = false;
		changed = true;
	}
	if (name.includes("reduce") && flag.reduced) {
		flag.reduced = false;
		changed = true;
	}

	if (!changed) {
		console.warn("No matching size change flags to clear.");
		return;
	}

	if (!flag.enlarged && !flag.reduced) {
		await token.document.update({
			width: flag.originalWidth,
			height: flag.originalHeight,
		});
		await actor.update({ "system.traits.size": flag.originalSize });
		await token.document.unsetFlag("elkan5e", "sizeChange");
	} else {
		// If one effect remains active, update the flags only
		await token.document.update({
			"flags.elkan5e.sizeChange": flag,
		});
	}
}

/**
 * Runs create Light From Template spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @param {*} config - Configuration object.
 * @param {*} minLevel - Min Level.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function createLightFromTemplate(workflow, config, minLevel = 1) {
	const lastTemplate = canvas.templates.placeables.at(-1);
	if (!lastTemplate) {
		ui.notifications.warn("No measured template found.");
		return;
	}

	const { x, y, id: templateId } = lastTemplate;
	const spellLevel = Math.max(workflow.castData.castLevel - 1, minLevel);

	const lightData = {
		x,
		y,
		config: {
			priority: spellLevel,
			...config,
		},
		flags: {
			elkan5e: {
				linkedTemplate: templateId,
			},
		},
	};

	await canvas.scene.createEmbeddedDocuments("AmbientLight", [lightData]);
}

/**
 * Runs darkness spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function darkness(workflow) {
	return createLightFromTemplate(
		workflow,
		{
			dim: 0,
			bright: 15,
			alpha: 0.3,
			angle: 360,
			luminosity: 0.5,
			saturation: 0,
			contrast: 0,
			shadows: 0,
			negative: true,
			animation: {
				type: "",
				speed: 2,
				intensity: 5,
			},
		},
		1,
	);
}

/**
 * Runs continual Flame spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function continualFlame(workflow) {
	return createLightFromTemplate(
		workflow,
		{
			dim: 60,
			bright: 30,
			alpha: 0.3,
			angle: 360,
			luminosity: 0.5,
			saturation: 0,
			contrast: 0,
			shadows: 0,
			negative: false,
			animation: {
				type: "torch",
				speed: 2,
				intensity: 5,
			},
		},
		2,
	);
}

/**
 * Runs moon Beam spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function moonBeam(workflow) {
	return createLightFromTemplate(
		workflow,
		{
			dim: 5,
			bright: 0,
			alpha: 0.3,
			angle: 360,
			luminosity: 0.5,
			saturation: 0,
			contrast: 0,
			shadows: 0,
			negative: false,
			color: "#587BA5",
			animation: {
				type: "",
				speed: 2,
				intensity: 5,
			},
		},
		2,
	);
}

/**
 * Adjusts temporary hit points based on save results of the Rend Vigor spell.
 *
 * @param {object} workflow - Workflow containing `saves` and `failedSaves` collections.
 * @returns {Promise<void>}
 */
