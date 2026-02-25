import { drainedEffect, forEachDamagedTarget } from "../shared/effects.mjs";

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

export async function sappingSmite(workflow) {
	const originUuid = workflow.token.actor.uuid;
	const icon = "icons/weapons/polearms/spear-flared-silver-pink.webp";
	await forEachDamagedTarget(workflow, (token, dmg) =>
		drainedEffect(token.actor, dmg, "Sapping Smite", icon, originUuid),
	);
}

/**
 * Applies the "Well of Corruption" drained effect to each targeted creature even without damage rolls.
 *
 * Each failed save takes the full drain amount while successful saves take half.
 * Damage equals 4d8 at 2nd level (or when unidentified) plus 2d8 per slot above 2nd.
 *
 * @param {object} workflow - The workflow object representing the spell use.
 * @param {Actor} workflow.actor - The caster actor of the Well of Corruption spell.
 * @param {Token} workflow.token - The token representing the caster.
 * @param {string} workflow.token.actor.uuid - The caster's actor UUID, used as effect origin.
 * @param {Set<Token|TokenDocument|string>} workflow.targets - Set of targeted tokens.
 * @param {Set<Token|TokenDocument|string>} [workflow.failedSaves] - Targets that failed the save.
 * @param {Set<Token|TokenDocument|string>} [workflow.saves] - Targets that succeeded on the save.
 *
 * @returns {Promise<void>} Resolves after applying drained effects to all valid targets.
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
