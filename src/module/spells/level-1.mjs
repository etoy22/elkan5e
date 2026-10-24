import {
	createLightRegion,
	deleteEffects,
	drainedEffect,
	excludeTargets,
	forEachDamagedTarget,
	planTeleportForOwner,
	removeStatuses,
	SIZE_ORDER,
	t,
} from "../shared/helpers.mjs";
import { createGoodberryDurationEffect } from "../shared/effect-factories.mjs";

/**
 * Runs Fog Cloud spell automation: a pale, drifting mist that blocks vision.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function fogCloudDarkness(workflow) {
	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 0,
				bright: 15,
				alpha: 0.3,
				luminosity: 0.5,
				negative: true,
				color: "#c9d6dd",
				animation: {
					type: "fog",
					speed: 2,
					intensity: 5,
				},
				priority: 30,
			},
			"Darkness",
		);
	}
}

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
				rules: "",
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
		const spellDC =
			casterActor?.system?.attributes?.spell?.dc ??
			casterActor?.system?.attributes?.spelldc ??
			13;

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
			excludeTargets(workflow, [token]);
		}
	}
}

const PRISMATIC_BOLT_DAMAGE_TYPES = [
	"fire",
	"thunder",
	"lightning",
	"acid",
	"cold",
	"force",
	"necrotic",
	"radiant",
];

/**
 * Runs Prismatic Bolt spell automation (midi-qol preDamageRoll phase).
 * Rolls 1d8 to pick the beam's damage type per the spell's table, forces the attack's
 * damage roll to use that single type instead of prompting a manual choice, and adds the
 * +10 bonus when an 8 (radiant) is rolled.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @param {*} activity - Activity about to roll damage.
 * @param {*} _config - Damage roll configuration being built (unused).
 * @param {*} dialog - Damage roll dialog configuration being built.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function prismaticBolt(workflow, activity, _config, dialog) {
	try {
		if (workflow?.item?.system?.identifier !== "prismatic-bolt") return;
		if (activity?.type !== "attack" || !activity.damage?.parts?.length) return;

		let type = workflow.elkan5ePrismaticBoltType;
		if (!type) {
			const roll = await new Roll("1d8").evaluate();
			type = PRISMATIC_BOLT_DAMAGE_TYPES[roll.total - 1];
			workflow.elkan5ePrismaticBoltType = type;

			await roll.toMessage({
				flavor: `Prismatic Bolt — the beam flares ${type[0].toUpperCase()}${type.slice(1)}!`,
				speaker: ChatMessage.getSpeaker({ actor: workflow.actor }),
			});
		}

		const part = activity.damage.parts[0];
		part.types = new Set([type]);
		part.bonus = type === "radiant" ? "10" : "";

		if (dialog) dialog.configure = false;
	} catch (err) {
		console.error("Prismatic Bolt |", err);
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
	const level = Math.max(
		Number(workflow.castData?.castLevel ?? workflow.spellLevel ?? item.system.level ?? 1),
		1,
	);
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
		img: item.img,
		origin: item.uuid,
		duration: { value: 1, units: "rounds" },
		system: {
			changes: [
				{
					key: "system.attributes.ac.bonus",
					type: "add",
					value: String(bonus),
					priority: 20,
				},
			],
		},
	};

	await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

const SHADOW_STRIKE_IDENTIFIERS = new Set(["shadow-strike", "shadow-strike-shadow-casting"]);
const SHADOW_STRIKE_RETURN_ID = "shdwStrikeRetrn0";
const SHADOW_STRIKE_FLAG = "shadowStrikeOrigin";

const isShadowStrike = (activity) =>
	SHADOW_STRIKE_IDENTIFIERS.has(activity?.item?.system?.identifier);

/**
 * Teleports a token back to its stored Shadow Strike origin and clears the flag.
 *
 * @param {TokenDocument} tokenDoc - Token to return.
 * @returns {Promise<boolean>} Whether the token had an origin to return to.
 */
async function returnToShadowStrikeOrigin(tokenDoc) {
	const origin = tokenDoc?.getFlag("elkan5e", SHADOW_STRIKE_FLAG);
	if (!origin) return false;
	// The Return activity's use and its teleport button can both trigger this; move only once.
	if (returningTokens.has(tokenDoc.uuid)) return true;
	returningTokens.add(tokenDoc.uuid);
	try {
		const { x, y, elevation } = origin;
		if (typeof tokenDoc.move === "function") {
			await tokenDoc.move({ x, y, elevation, action: "blink" });
		} else {
			await tokenDoc.update({ x, y, elevation });
		}
		await tokenDoc.unsetFlag("elkan5e", SHADOW_STRIKE_FLAG);
	} finally {
		returningTokens.delete(tokenDoc.uuid);
	}
	return true;
}

// Tokens currently moving back to their Shadow Strike origin.
const returningTokens = new Set();

/**
 * Runs Shadow Strike automation at dnd5e.teleport: records each token's position
 * before the strike teleport so the Return activity can snap back to it.
 *
 * @param {Activity} activity - The teleport activity being used.
 * @param {{ token: Token }[]} plans - Planned teleport movements.
 */
export function shadowStrikeRecordOrigin(activity, plans) {
	if (!isShadowStrike(activity) || activity.id === SHADOW_STRIKE_RETURN_ID) return;
	for (const { token } of plans ?? []) {
		const { x, y, elevation } = token.document;
		token.document.setFlag("elkan5e", SHADOW_STRIKE_FLAG, { x, y, elevation });
	}
}

/**
 * Runs Shadow Strike automation at dnd5e.preTeleport: the Return activity skips
 * manual placement when a stored origin exists.
 *
 * @param {Activity} activity - The teleport activity being used.
 * @param {{ tokens: Token[] }} config - Teleport configuration.
 * @returns {boolean|void} False to cancel manual teleport planning.
 */
export function shadowStrikePreReturn(activity, config) {
	if (!isShadowStrike(activity) || activity.id !== SHADOW_STRIKE_RETURN_ID) return;
	const tokens = (config?.tokens ?? []).filter((tk) =>
		tk.document.getFlag("elkan5e", SHADOW_STRIKE_FLAG),
	);
	if (!tokens.length) return;
	for (const token of tokens) {
		returnToShadowStrikeOrigin(token.document).catch((error) => {
			console.error("Elkan 5e | Error returning Shadow Strike token:", error);
		});
	}
	return false;
}

/**
 * Runs Shadow Strike automation at dnd5e.postUseActivity: the strike gives the caster its
 * advantage effect. Midi-QOL doesn't apply effects from teleport activities.
 *
 * @param {Activity} activity - The activity that was used.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function shadowStrikeAdvantage(activity) {
	if (!isShadowStrike(activity) || activity.id === SHADOW_STRIKE_RETURN_ID) return;
	const actor = activity.actor;
	if (!actor?.isOwner) return;
	const origin = activity.item.uuid;
	const effects = activity.effects
		.map(({ effect }) => effect)
		.filter(
			(effect) =>
				effect && !actor.effects.some((e) => e.origin === origin && e.name === effect.name),
		)
		.map((effect) => {
			const data = effect.toObject();
			delete data._id;
			return { ...data, origin, transfer: false };
		});
	if (effects.length) await actor.createEmbeddedDocuments("ActiveEffect", effects);
}

/**
 * Runs Shadow Strike automation at dnd5e.postUseActivity: using Return
 * immediately snaps the caster's token back to where it started.
 *
 * @param {Activity} activity - The activity that was used.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function shadowStrikeReturn(activity) {
	if (!isShadowStrike(activity) || activity.id !== SHADOW_STRIKE_RETURN_ID) return;
	const actor = activity.actor;
	let returned = false;
	for (const token of actor?.getActiveTokens() ?? []) {
		returned = (await returnToShadowStrikeOrigin(token.document)) || returned;
	}
	if (!returned) {
		ui.notifications.warn(t("elkan5e.spells.shadowStrikeNoOrigin", { name: actor?.name }));
	}
}

/**
 * Runs Ensnaring Vine automation at midi-qol.preTargetSave: Large or larger
 * creatures have advantage on the save.
 *
 * @param {Token} target - Token making the save.
 * @param {*} workflow - midi-qol workflow.
 * @param {object} saveDetails - Save configuration midi is about to roll.
 */
export function ensnaringVineSize(target, workflow, saveDetails) {
	if (workflow.item?.system?.identifier !== "ensnaring-vine") return;
	const size = SIZE_ORDER.indexOf(target.actor?.system?.traits?.size);
	if (size >= SIZE_ORDER.indexOf("lg")) saveDetails.advantage = true;
}

/**
 * Runs Hideous Laughter automation from the effect's midi onUse macro (isDamaged pass):
 * a laughing creature that takes damage repeats the Wisdom save with advantage,
 * ending the spell on a success.
 *
 * @param {object} scope - Function macro scope from midi.
 * @param {Token} [scope.token] - Token midi resolved for the macro.
 * @param {Array} [scope.args] - Macro args; args[0].options.token is the damaged target.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function hideousLaughterDamaged({ token, args } = {}) {
	const target = args?.[0]?.options?.token ?? token;
	const actor = target?.actor;
	const effect = actor?.effects.find((e) => e.name === "Hideous Laughter" && !e.disabled);
	if (!effect) return;

	const item = effect.origin ? await fromUuid(effect.origin).catch(() => null) : null;
	const saveActivity = item?.system?.activities?.find((a) => a.type === "save");
	const dc = saveActivity?.save?.dc?.value ?? item?.actor?.system?.attributes?.spell?.dc ?? null;
	if (!dc) return;

	const rolls = await actor.rollSavingThrow(
		{ ability: "wis", target: dc, advantage: true },
		{ configure: false },
	);
	const roll = rolls?.[0];
	if (!roll || (roll.isSuccess ?? roll.total >= dc) !== true) return;

	await deleteEffects(actor, [effect]);
	await ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ actor }),
		content: t("elkan5e.spells.hideousLaughterShaken", { name: actor.name }),
	});
}

/**
 * Runs Gentle Current automation at midi-qol.RollComplete: frees each target from
 * the grappled and prone conditions and moves it up to 10 feet. Restrained targets
 * can't be moved.
 *
 * @param {*} workflow - midi-qol workflow.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function gentleCurrent(workflow) {
	if (!workflow.item?.system?.identifier?.startsWith("gentle-current")) return;
	for (const target of workflow.targets ?? []) {
		const actor = target.actor;
		if (!actor) continue;
		await removeStatuses(actor, ["grappled", "prone"]);
		if (actor.statuses?.has("restrained")) continue;
		await planTeleportForOwner(target.document, 10, "displace");
	}
}
