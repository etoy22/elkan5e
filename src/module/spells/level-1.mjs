import { drainedEffect, forEachDamagedTarget } from "../shared/helpers.mjs";
import { createGoodberryDurationEffect } from "../shared/effect-factories.mjs";

/**
 * Tracks attacker-defender pairs that have already passed a Sanctuary save
 * this combat turn. Keys are `${attackerActorId}-${defenderActorId}`.
 * Cleared by the combatTurnChange hook in elkan5e.mjs each turn.
 */
export const sanctuarySuccessCache = new Set();

/**
 * Runs goodberry spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
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
	const existingItem = actor.items.find((i) => i.system.identifier === "goodberry-item");
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
		existingItem ?? actor.items.find((i) => i.system.identifier === "goodberry-item");
	if (!linkedItem) {
		console.error("Goodberry item was not found after creation.");
		return;
	}
	const effectData = await createGoodberryDurationEffect(item, level, linkedItem.uuid);

	await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

/**
 * Runs goodberry Delete Active spell automation.
 *
 * @param {*} deletedEffect - Deleted Effect.
 * @returns {Promise<void>} Promise resolution result.
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
 * Runs goodberry Delete Item spell automation.
 *
 * @param {*} deletedItem - Deleted Item.
 * @returns {Promise<void>} Promise resolution result.
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
 * Runs sapping Smite spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function sappingSmite(workflow) {
	const originUuid = workflow.token.actor.uuid;
	const icon = "icons/weapons/polearms/spear-flared-silver-pink.webp";
	await forEachDamagedTarget(workflow, (token, dmg) =>
		drainedEffect(token.actor, dmg, "Sapping Smite", icon, originUuid),
	);
}

/**
 * Runs rend Vigor spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function rendVigor(workflow) {
	const resolveActor = (entry) =>
		entry?.actor ?? entry?.document?.actor ?? entry?.object?.actor ?? null;
	const savedTargets = Array.from(workflow.saves ?? []);
	const failedTargets = Array.from(workflow.failedSaves ?? []);

	for (const save of savedTargets) {
		const target = resolveActor(save);
		const tempHp = target?.system?.attributes?.hp?.temp;
		if (!target || tempHp == null) continue;
		await target.update({ "system.attributes.hp.temp": Math.floor(tempHp / 2) });
	}

	for (const fail of failedTargets) {
		const target = resolveActor(fail);
		if (!target || target.system?.attributes?.hp?.temp == null) continue;
		await target.update({ "system.attributes.hp.temp": null });
	}
}

/**
 * Runs Sanctuary spell automation (midi-qol preWaitForAttackRoll phase).
 * Triggered via flags.midi-qol.preWaitForAttackRoll = "ItemMacro" on the
 * warded creature's Sanctuary effect. Fires before the attack roll so the
 * attacker must succeed on a Wisdom save before committing to the attack.
 *
 * @param {object} workflow - midi-qol workflow at preWaitForAttackRoll.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function sanctuary(workflow) {
	if (!workflow?.targets?.size) return;

	const attackerActor = workflow.actor;
	if (!attackerActor) return;

	for (const token of Array.from(workflow.targets)) {
		const defenderActor = token.actor;
		if (!defenderActor) continue;

		const sanctuaryEffect = defenderActor.effects.find(
			(e) => !e.disabled && e.name === "Sanctuary",
		);
		if (!sanctuaryEffect) continue;

		// AoE exception: no save when the protected creature is not the only target
		if (workflow.targets.size > 1) continue;

		// If the attacker already passed the save against this creature this turn,
		// they can attack freely without rolling again.
		const cacheKey = `${attackerActor.id}-${defenderActor.id}`;
		if (sanctuarySuccessCache.has(cacheKey)) continue;

		// Resolve the original caster's spell save DC from the effect origin.
		// In dnd5e v5 the origin UUID points to the Activity, so step up to
		// the Item and then to the actor.
		const originDoc = sanctuaryEffect.origin
			? await fromUuid(sanctuaryEffect.origin).catch(() => null)
			: null;
		const originItem = originDoc ? (originDoc.item ?? originDoc.parent ?? originDoc) : null;
		const casterActor = originItem?.parent ?? null;
		const spellDC = casterActor?.system?.attributes?.spelldc ?? 13;

		// Roll Wisdom saving throw for the attacker.
		const saveRolls = await attackerActor.rollSavingThrow({
			ability: "wis",
			targetValue: spellDC,
			flavor: `Wisdom Save vs. Sanctuary (DC ${spellDC}) — targeting ${defenderActor.name}`,
		});
		const saveRoll = Array.isArray(saveRolls) ? saveRolls[0] : saveRolls;

		if (!saveRoll) continue;

		const passed = saveRoll.total >= spellDC;

		if (passed) {
			// Remember this success so further attacks this turn skip the save.
			sanctuarySuccessCache.add(cacheKey);
		} else {
			// Failed — remove the target before the attack roll so the attack never fires.
			workflow.targets.delete(token);
		}


	}

	// If every target was removed by failed saves, abort the attack entirely.
	if (workflow.targets.size === 0) {
		workflow.aborted = true;
	}
}

/**
 * Runs shield spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function shield(workflow) {
	const actor = workflow.actor;
	const item = workflow.item;

	if (!actor) {
		console.error("Actor not found for the spell.");
		return;
	}

	// Spell level (minimum 1); no bonus when cast at base level.
	const level = Math.max(item.system.level ?? 1, 1);
	if (level === 1) return;

	// Spell bonus: Just the bonnus from the spell level
	const spellBonus = Math.min(level - 1, 2);

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

	if (bonus <= 0) return;
	// Prepare active effect data
	const effectData = {
		name: item.name + " Level Bonus",
		label: item.name,
		icon: item.img,
		origin: item.uuid,
		duration: { value: 1, units: "round" },
		changes: [
			{
				key: "system.attributes.ac.bonus",
				mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				value: bonus,
				priority: 20,
			},
		],
	};

	await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}
