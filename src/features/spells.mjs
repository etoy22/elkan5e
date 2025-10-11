import { drainedEffect, forEachDamagedTarget } from "./global.mjs";

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
 * Applies the "Enervate" drained effect to each damaged target after the initial spell cast.
 *
 * This function processes each damage entry in the workflow's damage list. If a valid token
 * target is found and damage was dealt, it applies the drained effect using {@link drainedEffect}.
 *
 * @param {object} workflow - The workflow object from MidiQOL or similar automation.
 * @param {Actor} workflow.actor - The caster of the spell.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - UUID for tracking origin of the effect.
 * @param {Array<object>} workflow.damageList - List of damage entries by target.
 * @returns {Promise<void>}
 */
export async function enervate(workflow) {
	const casterUuid = workflow.token.actor.uuid;
	await forEachDamagedTarget(workflow, (targetToken, damage) =>
		drainedEffect(
			targetToken.actor,
			damage,
			"Enervate",
			"icons/magic/death/skeleton-skull-soul-blue.webp",
			casterUuid,
		),
	);
}

/**
 * Applies the ongoing "Enervate" effect (e.g., for sustained or repeated necrotic damage).
 *
 * Similar to {@link enervate}, but can be triggered during subsequent rounds or turns.
 * Intended for ongoing damage processing hooks like `midi-qol.damageApplied` or custom macros.
 *
 * @param {object} workflow - The workflow object from MidiQOL or similar automation.
 * @param {Actor} workflow.actor - The caster of the spell.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - UUID for tracking origin of the effect.
 * @param {Array<object>} workflow.damageList - List of damage entries by target.
 * @returns {Promise<void>}
 */
export async function enervateOngoing(workflow) {
	const casterUuid = workflow.token.actor.uuid;
	await forEachDamagedTarget(workflow, (targetToken, damage) =>
		drainedEffect(
			targetToken.actor,
			damage,
			"Enervate",
			"icons/magic/death/skeleton-skull-soul-blue.webp",
			casterUuid,
		),
	);
}

/**
 * Creates or updates a Goodberry consumable item on the actor based on spell level,
 * and applies a duration effect linked to the consumable.
 *
 * @param {object} workflow - The workflow object from the spell use containing actor and item.
 * @param {Actor} workflow.actor - The actor casting the spell.
 * @param {Item} workflow.item - The spell item being cast.
 *
 * @returns {Promise<void>} Resolves when item creation/update and effect creation are complete.
 */
export async function goodberry(workflow) {
	const actor = workflow.actor;
	const item = workflow.item;

	// Determine the spell level and calculate the number of berries
	const level = Math.max(item.system.level, 1);
	let berry = (level + 1) * 5;
	const img = item.img;

	// Define the item to be created
	const consumableItem = {
		name: `${item.name} (Item)`,
		type: "consumable",
		img: `${img}`,
		system: {
			activities: {
				aL7vnNQ8QKdl98gJ: {
					type: "heal",
					_id: "aL7vnNQ8QKdl98gJ",
					sort: 0,
					activation: {
						type: "action",
						value: null,
						override: false,
						condition: "",
					},
					consumption: {
						scaling: {
							allowed: true,
							max: "",
						},
						spellSlot: true,
						targets: [
							{
								type: "itemUses",
								value: "1",
								target: "",
								scaling: {
									mode: "amount",
								},
							},
						],
					},
					duration: {
						units: "inst",
						concentration: false,
						override: false,
					},
					effects: [],
					range: {
						override: false,
						units: "touch",
						special: "",
					},
					target: {
						template: {
							contiguous: false,
							units: "ft",
							type: "",
						},
						affects: {
							choice: false,
							count: "",
							type: "creature",
							special: "",
						},
						override: false,
						prompt: true,
					},
					uses: {
						spent: 0,
						recovery: [],
						max: "",
					},
					healing: {
						number: null,
						denomination: 0,
						types: ["healing"],
						custom: {
							enabled: true,
							formula: "1",
						},
						scaling: {
							number: null,
							mode: "whole",
							formula: "1",
						},
						bonus: "",
					},
					macroData: {
						name: "",
						command: "",
					},
				},
			},
			uses: {
				spent: 0,
				recovery: [],
				autoDestroy: true,
				max: berry,
			},
			description: {
				value: "",
				chat: "",
			},
			identifier: "goodberry-item",
			source: {
				revision: 1,
				rules: "2024",
				book: "Elkan 5e",
				page: "",
				custom: "",
				license: "",
			},
			identified: true,
			unidentified: {
				description: "",
			},
			container: null,
			quantity: 1,
			weight: {
				value: 0,
				units: "lb",
			},
			price: {
				value: 0,
				denomination: "gp",
			},
			rarity: "",
			attunement: "",
			attuned: false,
			equipped: false,
			type: {
				value: "food",
				subtype: "",
			},
			damage: {
				base: {
					number: null,
					denomination: null,
					types: [],
					custom: {
						enabled: false,
					},
					scaling: {
						number: 1,
					},
				},
				replace: false,
			},
			magicalBonus: null,
			properties: ["mgc"],
		},
	};

	// Ensure the actor exists
	if (!actor) {
		console.error("Actor not found for the spell.");
		return;
	}

	// Check if the item already exists on the actor
	const existingItem = actor.items.find((i) => i.identifier === "goodberry-item");
	if (existingItem) {
		// Update the existing item's maximum uses
		await existingItem.update({
			"system.uses.max": existingItem.system.uses.max + berry,
		});
	} else {
		await actor.createEmbeddedDocuments("Item", [consumableItem]);
	}

	// Create an active effect to track the spell's duration
	const linkedItem =
		existingItem ?? (await actor.items.find((i) => i.system.identifier === "goodberry-item"));
	const effectData = {
		name: `${item.name} Duration (Level ${level})`, // Added required name property
		label: `${item.name} Duration (Level ${level})`,
		icon: `${img}`,
		origin: item.uuid,
		duration: { seconds: 3600 }, // 1 hour duration
		changes: [],
		flags: {
			dae: { specialDuration: ["longRest"] },
			elkan5e: { goodberryItemId: linkedItem.uuid },
		},
	};

	await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

/**
 * Handles cleanup when a Goodberry duration active effect is deleted.
 * It reduces the uses of the linked Goodberry consumable item accordingly or deletes it if depleted.
 *
 * @param {ActiveEffect} deletedEffect - The active effect being deleted.
 *   Must have a flag `flags.elkan5e.goodberryItemId` linking to the consumable item.
 *
 * @returns {Promise<void>} Resolves when cleanup is complete or if no action is needed.
 */
export async function goodberryDeleteActive(deletedEffect) {
	const actor = deletedEffect.parent;
	if (!actor) {
		console.warn("deleteActiveEffect: No actor found for effect.");
		return;
	}
	if (!deletedEffect.flags?.elkan5e?.goodberryItemId) return;
	const itemId = deletedEffect.flags?.elkan5e?.goodberryItemId;

	const item = await fromUuid(itemId);
	if (item == null) return;

	const match = deletedEffect.name.match(/^(.*) Duration \(Level (\d+)\)$/);

	if (!match) return;

	const level = parseInt(match[2], 10);

	if (level === null || isNaN(level)) return;

	const berriesToRemove = (level + 1) * 5;
	const newMaxUses = Math.max(item.system.uses.max - berriesToRemove, 0);
	const newSpentUses = Math.min(
		Math.max(item.system.uses.spent - berriesToRemove, 0),
		newMaxUses,
	);
	if (newMaxUses === 0) {
		try {
			await item.delete();
		} catch (error) {
			console.warn(
				"handleGoodberryItemCleanup: Error during consumable item deletion or item already deleted:",
				error,
			);
		}
	} else {
		await item.update({
			"system.uses.max": newMaxUses,
			"system.uses.spent": newSpentUses,
		});
	}
}

/**
 * Handles cleanup when a Goodberry consumable item is deleted.
 * It deletes all active effects on the actor that reference the deleted item's UUID via the flag `flags.elkan5e.goodberryItemId`.
 *
 * @param {Item} deletedItem - The consumable item that was deleted.
 *   Must have `system.identifier` set to `"goodberry-item"` to trigger cleanup.
 *
 * @returns {Promise<void>} Resolves when all linked effects are deleted.
 */
export async function goodberryDeleteItem(deletedItem) {
	const actor = deletedItem.parent;
	if (!actor) return;

	// Only handle items created by goodberry, identified by your custom identifier flag
	if (deletedItem.system.identifier !== "goodberry-item") return;

	// // Find all active effects on the actor whose origin matches this deleted item's UUID + suffix
	// const expectedOrigin = deletedItem.uuid + " (goodberry-effect)";

	const effectsToDelete = actor.effects.filter(
		(effect) => effect.flags?.elkan5e?.goodberryItemId !== undefined,
	);

	for (const effect of effectsToDelete) {
		try {
			await effect.delete();
		} catch (error) {
			console.error(`Failed to delete effect with origin ${effect.origin}`, error);
		}
	}
}

/**
 * Applies the "Life Drain" drained effect to each damaged target and heals the caster.
 *
 * Processes each damage entry in the workflow's damage list, applying the drainedEffect
 * to targets that took damage. The caster is then healed for half the total damage dealt.
 *
 * @param {object} workflow - The workflow object representing the damage event.
 * @param {Actor} workflow.actor - The caster actor who is healed by the life drain.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - The caster's actor UUID for effect origin.
 * @param {Array<object>} workflow.damageList - List of damage entries including damage amounts and target UUIDs.
 *
 * @returns {Promise<void>} Resolves once all effects and healing are applied.
 */
export async function lifeDrain(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = casterToken.actor.uuid;
	let totalHealing = 0;

	await forEachDamagedTarget(workflow, async (targetToken, damage) => {
		totalHealing += Math.floor(damage / 2);
		await drainedEffect(
			targetToken.actor,
			damage,
			"Life Drain",
			"icons/magic/control/debuff-energy-hold-green.webp",
			casterUuid,
		);
	});

	if (totalHealing <= 0) return;
	const healingRoll = await new Roll(`${totalHealing}`).evaluate({ async: true });
	new MidiQOL.DamageOnlyWorkflow(
		caster,
		casterToken,
		healingRoll.total,
		"healing",
		[casterToken],
		healingRoll,
		{ flavor: "Life Drain Healing" },
	);
}
/**
 * Applies the "Sapping Smite" drained effect to each target damaged by the smite.
 *
 * Iterates through the damage entries in the workflow, and for each valid damage
 * instance on a valid target token, applies the drainedEffect with the "Sapping Smite" effect.
 *
 * @param {object} workflow - The workflow object containing spell and damage details.
 * @param {Actor} workflow.actor - The caster of the Sapping Smite spell.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - The UUID of the caster actor, used as effect origin.
 * @param {Array<object>} workflow.damageList - Array of damage entries detailing damage dealt per target.
 *
 * @returns {Promise<void>} Resolves after all drained effects have been applied.
 */
export async function sappingSmite(workflow) {
	const originUuid = workflow.token.actor.uuid;
	const icon = "icons/weapons/polearms/spear-flared-silver-pink.webp";
	await forEachDamagedTarget(workflow, (token, dmg) =>
		drainedEffect(token.actor, dmg, "Sapping Smite", icon, originUuid),
	);
}

/**
 * Applies the "Well of Corruption" drained effect to each target damaged by the spell.
 *
 * Iterates over each damage entry in the workflow's damage list. For each valid target
 * that received damage, applies the drainedEffect with the "Well of Corruption" effect.
 *
 * @param {object} workflow - The workflow object representing the spell's damage application.
 * @param {Actor} workflow.actor - The caster actor of the Well of Corruption spell.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - The caster's actor UUID, used as effect origin.
 * @param {Array<object>} workflow.damageList - List of damage entries with damage amounts and target UUIDs.
 *
 * @returns {Promise<void>} Resolves after applying drained effects to all valid targets.
 */
export async function wellOfCorruption(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = workflow.token.actor.uuid;
	if (!caster || !casterToken) {
		console.warn("Well of Corruption aborted: missing caster or casterToken");
		return;
	}

	for (const dmgEntry of workflow.damageList) {
		const damage = (dmgEntry.tempDamage ?? 0) + (dmgEntry.hpDamage ?? 0);
		if (damage <= 0) continue;

		if (!dmgEntry.targetUuid) {
			console.warn("Well of Corruption: damageList entry missing targetUuid", dmgEntry);
			continue;
		}

		const parts = dmgEntry.targetUuid.split(".");
		if (parts.length < 4) {
			console.warn("Well of Corruption: Invalid targetUuid format", dmgEntry.targetUuid);
			continue;
		}
		const tokenId = parts[3];
		const targetToken = canvas.tokens.get(tokenId);
		if (!targetToken) {
			console.warn(`Well of Corruption: Token with ID ${tokenId} not found on canvas`);
			continue;
		}

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
 * Applies the "Wrath of the Reaper" effect during a damage workflow.
 *
 * For each target damaged by the triggering workflow, this function:
 * - Validates and retrieves the target token from the canvas.
 * - Calculates damage as half the target's max HP, capped at 100.
 * - Rolls the calculated damage as force damage.
 * - Applies the damage to the target via MidiQOL's DamageOnlyWorkflow.
 * - If the target failed a save (dmgEntry.saved is false), applies the "drainedEffect" to the target.
 *
 * @param {object} workflow - The workflow object representing the triggering action.
 * @param {Actor} workflow.actor - The caster actor applying Wrath of the Reaper.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - The caster's actor UUID for effect origin.
 * @param {Array<object>} workflow.damageList - List of damage entries with target info.
 *
 * @returns {Promise<void>} Resolves once all damage and effects are applied.
 */
export async function wrathOfTheReaper(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = casterToken.actor.uuid;
	const itemData = { type: "spell", img: "icons/magic/death/weapon-scythe-rune-green.webp" };

	await forEachDamagedTarget(workflow, async (targetToken, _damage, dmgEntry) => {
		const maxHp = targetToken.actor.system.attributes.hp.max;
		const forceDamage = Math.min(Math.floor(maxHp / 2), 100);
		if (forceDamage <= 0) return;

		const damageRoll = await new Roll(`${forceDamage}`).evaluate({ async: true });
		new MidiQOL.DamageOnlyWorkflow(
			caster,
			casterToken,
			damageRoll.total,
			"force",
			[targetToken],
			damageRoll,
			{ itemData, flavor: "Wrath of the Reaper Damage" },
		);

		if (!dmgEntry.saved) {
			await drainedEffect(
				targetToken.actor,
				forceDamage,
				"Wrath of the Reaper",
				itemData.img,
				casterUuid,
			);
		}
	});
}

/**
 * Automation for the Enlarge spell: increases the size of each failed target by one step.
 *
 * @param {object} workflow - Workflow containing `_failedSaves` from the cast.
 * @returns {Promise<void>}
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
 * Automation for the Reduce spell: decreases the size of failed targets by one step.
 *
 * @param {object} workflow - Workflow containing `_failedSaves` from the cast.
 * @returns {Promise<void>}
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
 * Restores a token to its original dimensions when an enlarge or reduce effect ends.
 *
 * @param {ActiveEffect} effect - The size-changing effect being removed.
 * @returns {Promise<void>}
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
 * Creates an ambient light at the position of the last measured template.
 *
 * @param {object} workflow - Workflow containing spell casting data.
 * @param {object} config - Base light configuration.
 * @param {number} [minLevel=1] - Minimum spell level used for light priority.
 * @returns {Promise<void>}
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
 * Creates a darkness light effect from the last measured template.
 *
 * @param {object} workflow - Workflow for the spell cast.
 * @returns {Promise<void>}
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
 * Creates a standard light effect from the last measured template.
 *
 * @param {object} workflow - Workflow for the spell cast.
 * @returns {Promise<void>}
 */
export async function light(workflow) {
	return createLightFromTemplate(
		workflow,
		{
			dim: 40,
			bright: 20,
			alpha: 0.3,
			angle: 360,
			luminosity: 0.5,
			saturation: 0,
			contrast: 0,
			shadows: 0,
			negative: false,
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
 * Creates a continual flame light source from the last measured template.
 *
 * @param {object} workflow - Workflow for the spell cast.
 * @returns {Promise<void>}
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
 * Creates a moonbeam light source from the last measured template.
 *
 * @param {object} workflow - Workflow for the spell cast.
 * @returns {Promise<void>}
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
export async function rendVigor(workflow) {
	let saves = workflow.saves;
	let failed = workflow.failedSaves;

	saves.forEach((save) => {
		let target = save.actor;
		if (target.system.attributes.hp.temp != null) {
			target.system.attributes.hp.temp = Math.floor(target.system.attributes.hp.temp / 2);
		}
	});

	failed.forEach((fail) => {
		let target = fail.actor;
		if (target.system.attributes.hp.temp != null) {
			target.system.attributes.hp.temp = null;
		}
	});
}

/**
 * Scales a Fog Cloud template's radius based on spell level.
 *
 * @param {object} workflow - Workflow providing template and cast level information.
 * @returns {Promise<void>}
 */
export async function fogCloud(workflow) {
	const template = workflow.template;

	if (!template) {
		ui.notifications.warn("No template ID found in workflow.");
		return;
	}

	const baseRadius = 20;
	const spellLevel = Math.max(workflow.castData.castLevel, 1);
	const radius = baseRadius + (spellLevel - 1) * 20;

	await template.update({ distance: radius });
	ui.notifications.info(`Fog Cloud radius set to ${radius} ft.`);
}

/**
 * Heals the caster for half the necrotic damage dealt when a single target is hit.
 *
 * @param {object} workflow - Damage workflow containing result information.
 * @returns {Promise<void>}
 */
export async function vampiricSmite(workflow) {
	const { damage, damageMultiplier } =
		workflow.damageItem.damageDetail[0].find((d) => d.type === "necrotic") || {};
	if (damage && workflow.hitTargets.size === 1) {
		const dmgToApply = Math.floor((damage * damageMultiplier) / 2);
		await MidiQOL.applyTokenDamage(
			[
				{
					damage: dmgToApply,
					type: "healing",
					flavor: "Life Steal",
				},
			],
			dmgToApply,
			new Set([token]),
			null,
			null,
		);
	}
}

/**
 * Grants an AC bonus based on spell level and the caster's equipped shield.
 *
 * @param {object} workflow - Workflow containing actor and item data.
 * @param {Actor} workflow.actor - The actor casting the spell.
 * @param {Item} workflow.item - The Shield spell item.
 * @returns {Promise<void>}
 */
export async function shield(workflow) {
	const actor = workflow.actor;
	const item = workflow.item;

	if (!actor) {
		console.error("Actor not found for the spell.");
		return;
	}

	// Spell level (minimum 1)
	const level = Math.max(item.system.level ?? 1, 1);

	// Spell bonus: level + 2 capped at 5
	const spellBonus = Math.min(level + 2, 5);

	// Find equipped shield
	const shield = actor.items.find(
		(i) =>
			i.type === "equipment" &&
			i.system.type?.value === "shield" &&
			i.system.equipped === true,
	);

	// Calculate shield bonus (armor value + magical bonus if any)
	let shieldBonus = 0;
	if (shield) {
		shieldBonus = Number(shield.system.armor?.value ?? 0);
		if (shield.system.armor?.magicalBonus) {
			shieldBonus += Number(shield.system.armor.magicalBonus);
		}
	}

	// Calculate net bonus to AC
	const bonus = spellBonus - shieldBonus;

	// Prepare active effect data
	const effectData = {
		name: item.name,
		label: item.name,
		icon: item.img,
		origin: item.uuid,
		duration: { seconds: 7 },
		changes: [
			{
				key: "system.attributes.ac.bonus",
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: bonus,
				priority: 20,
			},
		],
		flags: {
			dae: { specialDuration: ["turnEndSource"] },
		},
	};

	await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}
