const DialogV2 = foundry.applications.api.DialogV2;
import { createDelayedSurgeEffect } from "../shared/effect-factories.mjs";
import {
	drawWildSurge,
	resolveWildSurge,
	surgeResultText,
	SURGE_SOURCE,
	WILD_SURGE_MAX_TABLE_LEVEL,
} from "../shared/wild-surge.mjs";
import { excludeTargets, markUsedThisTurn, t, usedThisTurn } from "../shared/helpers.mjs";

/**
 * Runs wild Surge class feature automation.
 *
 * @param {*} activity - Activity.
 * @param {*} usageConfig - Usage configuration passed by the activity workflow.
 * @returns {Promise<void|false>} False if a redraw failed; the original surge is still applied.
 */
export async function wildSurge(activity, usageConfig) {
	const actor = activity?.actor;
	const item = activity?.item;
	if (!actor || !item) return;
	if (item.flags?.["midi-qol"]?.syntheticItem || activity.isOverTimeFlag) return;

	let rawSlot = usageConfig?.spell?.slot;
	let level = null;

	if (typeof rawSlot === "number") {
		level = rawSlot;
	} else if (typeof rawSlot === "string") {
		const match = rawSlot.match(/\d+/);
		if (match) {
			level = parseInt(match[0], 10);
		}
	}

	// Fallback if needed
	if (level == null) {
		level = activity.item?.system?.level ?? 0;
	}

	const isScroll = item.type === "consumable" && item.system?.type?.value === "scroll";
	const isLeveledSpellCast =
		item.type === "spell" &&
		level > 0 &&
		(activity.name === "Ritual" || Boolean(activity.consumption?.spellSlot));

	if (!isLeveledSpellCast && !isScroll) return;

	const WILD_SURGE_THRESHOLD = 5;

	const wild = actor.items.find((i) => i.system.identifier === "random-wild-surge");
	const volen = actor.effects.find((i) => i.name === "Voluntary Surge");
	const blowout = actor.effects.find((i) => i.name === "Magical Blowout");
	let rollAbove = false;

	if (wild) {
		try {
			const roll = await new Roll("1d6").evaluate();
			await roll.toMessage({
				flavor: game.i18n.localize("elkan5e.wildMage.randomWildSurge"),
				speaker: ChatMessage.getSpeaker({ actor: actor }),
			});
			if (roll.total >= WILD_SURGE_THRESHOLD) rollAbove = true;
		} catch (error) {
			console.error("Error rolling wild surge: ", error);
			return;
		}
	}

	if (!rollAbove && !volen && !blowout) return;

	const count = [rollAbove, volen, blowout].filter(Boolean).length;
	const tableLevel = Math.min(level - 1 + count, WILD_SURGE_MAX_TABLE_LEVEL);
	let drawn = await drawWildSurge(tableLevel);
	if (!drawn) return;

	let avert = actor.items.find((i) => i.system.identifier === "avert-disaster");
	let delay = actor.items.find((i) => i.system.identifier === "delayed-surge");
	const hasUses = (feature) => feature && feature.system.uses.spent < feature.system.uses.max;

	// Avert Disaster rerolls once; Delayed Surge stores the result for later. Anything else
	// (accepting, or closing the dialog) applies the result now.
	let canAvert = true;
	let redrawFailed = false;
	while (true) {
		const offerAvert = canAvert && hasUses(avert);
		const offerDelay = hasUses(delay);
		if (!offerAvert && !offerDelay) break;

		const choice = await promptSurgeAbilities(
			offerAvert ? avert : null,
			offerDelay ? delay : null,
		);
		avert = actor.items.find((i) => i.system.identifier === "avert-disaster");
		delay = actor.items.find((i) => i.system.identifier === "delayed-surge");
		if (choice === "avert" && offerAvert && hasUses(avert)) {
			const redrawn = await drawWildSurge(tableLevel, drawn.budget);
			if (!redrawn) {
				redrawFailed = true;
				break;
			}
			// A draw also yields control: check again immediately before spending.
			avert = actor.items.find((i) => i.system.identifier === "avert-disaster");
			if (!hasUses(avert)) break;
			await avert.update({ "system.uses.spent": avert.system.uses.spent + 1 });
			drawn = redrawn;
			canAvert = false;
			continue;
		}
		if (choice === "delay" && offerDelay && hasUses(delay)) {
			if (await delaySurge(actor, delay, drawn.result)) return;
		}
		break;
	}

	await resolveWildSurge(actor, drawn.result, {
		source: SURGE_SOURCE.sorcerer,
		budget: drawn.budget,
		slot: typeof rawSlot === "string" ? rawSlot : null,
	});
	if (redrawFailed) return false;
}

/**
 * Asks whether to use Avert Disaster or Delayed Surge on a drawn surge result.
 *
 * @param {Item|null} avert - Avert Disaster feature, if it can be used.
 * @param {Item|null} delay - Delayed Surge feature, if it can be used.
 * @returns {Promise<string|null>} "avert", "delay", "accept", or null if the dialog was closed.
 */
async function promptSurgeAbilities(avert, delay) {
	const remaining = (feature) => feature.system.uses.max - feature.system.uses.spent;
	const buttons = [];
	if (avert) {
		buttons.push({
			action: "avert",
			label: game.i18n.localize("elkan5e.wildMage.avertDisaster"),
		});
	}
	if (delay) {
		buttons.push({
			action: "delay",
			label: game.i18n.localize("elkan5e.wildMage.delayedSurge"),
		});
	}
	buttons.push({
		action: "accept",
		label: game.i18n.localize("elkan5e.wildMage.acceptSurge"),
		default: true,
	});

	return DialogV2.wait({
		window: { title: game.i18n.localize("elkan5e.wildMage.wildSurgeAbilities") },
		modal: true,
		rejectClose: false,
		content: `
			<h2>${game.i18n.localize("elkan5e.wildMage.alterWildSurge")}</h2>
			<p>${game.i18n.localize("elkan5e.wildMage.abilityUsage")}</p>
			${
				avert
					? `<p>${game.i18n.format("elkan5e.wildMage.avertDisasterUses", {
							remaining: remaining(avert),
						})}</p>`
					: ""
			}
			${
				delay
					? `<p>${game.i18n.format("elkan5e.wildMage.delayedSurgeUses", {
							remaining: remaining(delay),
						})}</p>`
					: ""
			}
		`,
		buttons,
	});
}

/**
 * Delayed Surge: spends a use and stores the surge result in a Delayed Wild Surge item. Using
 * that item later applies the result (see {@link delayedSurgeUse}).
 *
 * @param {Actor} actor - Sorcerer who surged.
 * @param {Item} delay - Delayed Surge feature.
 * @param {TableResult} result - Surge result to store.
 * @returns {Promise<boolean>} Whether the surge was stored successfully.
 */
async function delaySurge(actor, delay, result) {
	await delay.update({ "system.uses.spent": delay.system.uses.spent + 1 });
	const pairId = foundry.utils.randomID();
	const rollResult = surgeResultText(result);
	const delayedSurge = {
		name: game.i18n.localize("elkan5e.wildMage.delayedWildSurge"),
		type: "consumable",
		img: "icons/magic/defensive/barrier-shield-dome-deflect-blue.webp",
		system: {
			activities: {
				"4x72PccdTFiNUQqd": {
					type: "utility",
					_id: "4x72PccdTFiNUQqd",
					sort: 0,
					activation: {
						type: "reaction",
						value: null,
						override: false,
						condition: "",
					},
					consumption: {
						scaling: {
							allowed: false,
						},
						spellSlot: true,
						targets: [
							{
								type: "itemUses",
								value: "1",
								scaling: {},
							},
						],
					},
					description: {
						chatFlavor: "",
					},
					duration: {
						units: "inst",
						concentration: false,
						override: false,
					},
					effects: [],
					range: {
						override: false,
						units: "self",
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
							type: "",
						},
						override: false,
						prompt: true,
					},
					uses: {
						spent: 0,
						recovery: [],
						max: "",
					},
					roll: {
						prompt: false,
						visible: false,
						formula: "",
						name: "",
					},
					useConditionText: "",
					effectConditionText: "",
					macroData: {
						name: "",
						command: "",
					},
					ignoreTraits: {
						idi: false,
						idr: false,
						idv: false,
						ida: false,
					},
					midiProperties: {
						ignoreTraits: [],
						triggeredActivityId: "none",
						triggeredActivityConditionText: "",
						triggeredActivityTargets: "targets",
						triggeredActivityRollAs: "self",
						forceDialog: false,
						confirmTargets: "default",
						autoTargetType: "any",
						autoTargetAction: "default",
						automationOnly: false,
						otherActivityCompatible: true,
						identifier: "",
					},
					name: "",
				},
			},
			uses: {
				spent: 0,
				max: 1,
				autoDestroy: true,
			},
			description: {
				value: game.i18n.format("elkan5e.wildMage.delayedWildSurgeDescription", {
					result: rollResult,
				}),
			},
			identifier: "delayed-wild-surge",
			source: {
				source: "Elkan5e",
			},
			properties: ["mgc"],
		},
		flags: { elkan5e: { wildSurgeResult: result.uuid, delayedSurgePair: pairId } },
	};

	let storedItem;
	try {
		const delayedSurgeEffect = await createDelayedSurgeEffect({
			name: game.i18n.localize("elkan5e.wildMage.delayedWildSurgeDuration"),
			transfer: false,
			img: "icons/magic/defensive/barrier-shield-dome-deflect-blue.webp",
			origin: actor.uuid,
		});
		foundry.utils.setProperty(delayedSurgeEffect, "flags.elkan5e.delayedSurgePair", pairId);
		[storedItem] = await actor.createEmbeddedDocuments("Item", [delayedSurge]);
		if (!storedItem) throw new Error("Delayed Wild Surge item was not created");
		const effects = await actor.createEmbeddedDocuments("ActiveEffect", [delayedSurgeEffect]);
		if (!effects?.length) throw new Error("Delayed Wild Surge effect was not created");
		return true;
	} catch (error) {
		console.error("Elkan 5e | Error storing Delayed Wild Surge:", error);
		await delay.update({ "system.uses.spent": Math.max(0, delay.system.uses.spent - 1) });
		if (storedItem) await storedItem.delete();
		return false;
	}
}

/**
 * Applies a stored surge result when its Delayed Wild Surge item is used.
 *
 * @param {*} activity - Activity that was used.
 * @returns {Promise<void>}
 */
export async function delayedSurgeUse(activity) {
	const item = activity?.item;
	const actor = activity?.actor;
	if (!actor || item?.system?.identifier !== "delayed-wild-surge") return;
	const resultUuid = item.flags?.elkan5e?.wildSurgeResult;
	if (!resultUuid) return;
	await resolveWildSurge(actor, resultUuid, { source: SURGE_SOURCE.sorcerer });
}

/**
 * Runs delayed Duration class feature automation.
 *
 * @param {*} effect - Active effect being handled.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function delayedDuration(effect) {
	const pairId = effect.flags?.elkan5e?.delayedSurgePair;
	if (!pairId) return;
	const item = effect.parent?.items?.find(
		(entry) => entry.flags?.elkan5e?.delayedSurgePair === pairId,
	);
	if (item) await item.delete();
}

/**
 * Runs delayed Item class feature automation.
 *
 * @param {*} item - Item document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function delayedItem(item) {
	const pairId = item.flags?.elkan5e?.delayedSurgePair;
	if (!pairId) return;
	const effect = item.parent?.effects?.find(
		(entry) => entry.flags?.elkan5e?.delayedSurgePair === pairId,
	);
	if (effect) await effect.delete();
}

/**
 * Runs Careful Spell class feature automation: while armed, lets the
 * sorcerer choose up to their Charisma modifier of targets on a
 * save-forcing spell to automatically succeed (taking no damage at all,
 * even from spells that deal half on a success). The Careful Spell effect
 * expires once used.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function carefulSpell(workflow) {
	try {
		const actor = workflow.actor;
		if (!actor) return;

		const carefulEffect = actor.effects.find(
			(ef) => ef.name === "Careful Spell" && !ef.disabled,
		);
		if (!carefulEffect) return;

		if (workflow.activity?.type !== "save") return;

		const targets = [...(workflow.targets ?? [])];
		if (!targets.length) return;

		const chaMod = actor.system?.abilities?.cha?.mod ?? 0;
		const maxProtect = Math.max(1, chaMod);

		const chosen = [];
		for (const targetToken of targets) {
			if (chosen.length >= maxProtect) break;
			const targetActor = targetToken?.actor;
			const confirmed = await DialogV2.confirm({
				window: { title: "Careful Spell" },
				content: `<p>Protect <strong>${targetActor?.name ?? targetToken?.name}</strong> from this spell? (${chosen.length}/${maxProtect} used)</p>`,
				rejectClose: false,
				modal: true,
			});
			if (confirmed) chosen.push(targetToken);
		}

		if (!chosen.length) return;

		excludeTargets(workflow, chosen);

		ui.notifications.info(
			`Careful Spell: ${chosen.map((t) => t.actor?.name ?? t.name).join(", ")} automatically succeed their save.`,
		);

		await carefulEffect.delete();
	} catch (err) {
		console.error("Careful Spell |", err);
	}
}

// Damage types Elemental Infusion can't change.
const INFUSION_EXCLUDED = new Set(["necrotic", "poison", "psychic"]);
// Midi-QOL's untyped damage, used for plain rolls such as Blink's d20.
const UNTYPED = new Set(["midi-none", "none"]);

/**
 * Runs Elemental Infusion class feature automation (midi-qol preDamageRoll). When the sorcerer
 * rolls damage for a spell that doesn't deal necrotic, poison, or psychic damage, asks whether to
 * infuse it. If they pick one of their savant's damage types, uses Elemental Infusion (spending the
 * sorcery point) and changes the spell's damage to that type for this roll.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @param {object} activity - Activity about to roll damage.
 * @param {object} _config - Damage roll configuration (unused).
 * @param {object} dialog - Damage roll dialog configuration.
 * @returns {Promise<void>}
 */
export async function elementalInfusion(workflow, activity, _config, dialog) {
	const actor = workflow?.actor;
	const parts = activity?.damage?.parts;
	if (workflow?.item?.type !== "spell" || !actor?.isOwner || !parts?.length) return;
	const infusion = actor.items.find((i) => i.flags?.elkan5e?.infusionTypes);
	const infuse = infusion?.system.activities.contents[0];
	if (!infuse) return;

	// Ask once per casting; later damage rolls in the same workflow reuse the answer.
	if (workflow.elkan5eInfusionType === undefined) {
		workflow.elkan5eInfusionType = null;
		const types = parts.flatMap((p) => [...p.types]);
		// Only real damage: skip healing and untyped rolls such as Blink's d20.
		const isDamage = (type) => type in CONFIG.DND5E.damageTypes && !UNTYPED.has(type);
		if (!types.length || !types.every(isDamage)) return;
		if (types.some((type) => INFUSION_EXCLUDED.has(type))) return;

		const choices = infusion.flags.elkan5e.infusionTypes;
		const choice = await DialogV2.wait({
			window: { title: infusion.name },
			content: `<p>${t("elkan5e.sorcerer.infusionContent", { spell: workflow.item.name })}</p>`,
			buttons: [
				...choices.map((type) => ({
					action: type,
					label: CONFIG.DND5E.damageTypes[type]?.label ?? type,
				})),
				{ action: "none", label: t("elkan5e.sorcerer.infusionDecline"), default: true },
			],
			rejectClose: false,
		});
		if (!choices.includes(choice)) return;
		if (!(await infuse.use({}, { configure: false }))) return;
		workflow.elkan5eInfusionType = choice;
	}

	const type = workflow.elkan5eInfusionType;
	if (!type) return;
	const original = parts.map((p) => p.types);
	for (const part of parts) part.types = new Set([type]);
	// The activity is the item's own prepared data, so put its types back once this roll is made.
	Hooks.once("dnd5e.rollDamageV2", () => parts.forEach((p, i) => (p.types = original[i])));
	if (dialog) dialog.configure = false;
}

/**
 * Shows the savant's once-per-turn spell riders (Volatile Current, Fault Line, Wreathing Flames,
 * Relentless Tides) after a spell deals one of their damage types, saying whether each can still
 * be used this turn. Features opt in with flags.elkan5e.spellDamageTrigger.
 *
 * @param {object} workflow - MIDI-QOL workflow at RollComplete.
 */
export function savantSpellReminder(workflow) {
	const actor = workflow?.actor;
	if (workflow?.item?.type !== "spell" || !actor?.isOwner) return;
	const dealtDamage = (workflow.damageList ?? []).some(
		(entry) => (entry.hpDamage ?? 0) + (entry.tempDamage ?? 0) > 0,
	);
	if (!dealtDamage) return;

	const types = new Set((workflow.damageRolls ?? []).map((roll) => roll.options?.type));
	for (const feature of actor.items) {
		const triggers = feature.flags?.elkan5e?.spellDamageTrigger;
		if (!triggers?.some((type) => types.has(type))) continue;
		const used = usedThisTurn(actor, `savant.${feature.system.identifier}`);
		const data = { name: actor.name, feature: feature.name };
		if (used) ui.notifications.warn(t("elkan5e.sorcerer.savantUsed", data));
		else ui.notifications.info(t("elkan5e.sorcerer.savantReady", data));
	}
}

/**
 * Records that a savant spell rider was used this turn, for {@link savantSpellReminder}.
 *
 * @param {object} activity - Activity that was used.
 * @returns {Promise<void>}
 */
export async function markSavantFeatureUsed(activity) {
	const feature = activity?.item;
	if (!feature?.flags?.elkan5e?.spellDamageTrigger || !activity.actor) return;
	await markUsedThisTurn(activity.actor, `savant.${feature.system.identifier}`);
}
