import { deleteEffectRemoveEffect } from "../shared/helpers.mjs";
import { createEmptyBodyEffect } from "../shared/effect-factories.mjs";
const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Runs rmv Meld Shadow class feature automation.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function rmvMeldShadow(actor) {
	await deleteEffectRemoveEffect(
		actor,
		"elkan5e.monk.meldWithShadowsEffect",
		"elkan5e.monk.meldWithShadowsAttacks",
		["elkan5e.monk.emptyBody"],
	);
}

/**
 * Runs rmvhijack Shadow class feature automation.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function rmvhijackShadow(actor) {
	await deleteEffectRemoveEffect(
		actor,
		"elkan5e.monk.hijackShadowEffect",
		"elkan5e.monk.hijackShadowAttacks",
		["elkan5e.monk.emptyBody"],
	);
}

/**
 * Runs hijack Shadow class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function hijackShadow(workflow) {
	const actor = workflow.actor;
	emptyBody(actor);
}

/**
 * Runs meld With Shadows class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function meldWithShadows(workflow) {
	const actor = workflow.actor;
	emptyBody(actor);
}

/**
 * Runs empty Body class feature automation.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function emptyBody(actor) {
	if (!actor.isOwner) return;
	if (actor.items.find((i) => i.system.identifier === "empty-body")) {
		let confirm = await DialogV2.confirm({
			window: { title: game.i18n.localize("elkan5e.monk.emptyBodyTitle") },
			content: `<p>${game.i18n.localize("elkan5e.monk.emptyBodyContent")}</p>`,
			rejectClose: false,
			modal: true,
		});
		if (confirm) {
			const emptyBody = await createEmptyBodyEffect({
				changes: [
					{
						key: "system.traits.dr.value",
						mode: 0,
						value: "bludgeoning",
						priority: 20,
					},
					{
						key: "system.traits.dr.value",
						mode: 0,
						value: "piercing",
						priority: 20,
					},
					{
						key: "system.traits.dr.value",
						mode: 0,
						value: "slashing",
						priority: 20,
					},
					{
						key: "system.traits.dv.value",
						mode: 0,
						value: "radiant",
						priority: 20,
					},
				],
			});
			await actor.createEmbeddedDocuments("ActiveEffect", [emptyBody]);
		}
	}
}

/**
 * Runs elemental Attunement class feature automation.
 *
 * @param {*} args - Arguments passed by the caller.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function elementalAttunement(args) {
	const [action, actorId, element] = args;
	const actor = await game.actors.get(actorId);
	const monkItem = actor.items.find((i) => i.name === "Monk");

	if (!monkItem) return;

	const monkLevel = monkItem.system.levels;

	// Config for all attunements
	const attunementConfig = {
		air: {
			effectsToRemove: ["Earth Attunement", "Fire Attunement", "Water Attunement"],
			itemsToAdd: ["RFs2JK8U1HWwRtRy"],
			spellsToAdd:
				monkLevel >= 14
					? [
							"MKvNn3Q5xPa0vEK2",
							"Q6y7fBSwRIUMChVh",
							"ZRsOGTOZI6aksC85",
							"efO0uhdOJ89v9RKL",
						]
					: monkLevel >= 6
						? ["MKvNn3Q5xPa0vEK2", "Q6y7fBSwRIUMChVh", "ZRsOGTOZI6aksC85"]
						: [],
			itemsToRemoveOnDisable: [
				"Elemental Thrust (Air)",
				"Thunderwave (1 Ki)",
				"Thunderwave (2 Ki)",
				"Thunderwave (3 Ki)",
				"Fly (4 Ki)",
			],
		},
		earth: {
			effectsToRemove: ["Air Attunement", "Fire Attunement", "Water Attunement"],
			itemsToAdd: ["UE1CR9GhnUHA8W3v"],
			spellsToAdd:
				monkLevel >= 14
					? [
							"8iOXbBYr8peoRGtp",
							"QNa2AQVdnwGihVCe",
							"yJX39WZzkHIvxhVv",
							"i8ASCHhH1r6NHPPy",
						]
					: monkLevel >= 6
						? ["8iOXbBYr8peoRGtp", "QNa2AQVdnwGihVCe", "yJX39WZzkHIvxhVv"]
						: [],
			itemsToRemoveOnDisable: [
				"Elemental Thrust (Earth)",
				"False Life (1 Ki)",
				"False Life (2 Ki)",
				"False Life (3 Ki)",
				"Rock Blast (4 Ki)",
			],
		},
		fire: {
			effectsToRemove: ["Air Attunement", "Earth Attunement", "Water Attunement"],
			itemsToAdd: ["MRDsf3PEbZ89LXAP"],
			spellsToAdd:
				monkLevel >= 14
					? [
							"FQa89kp1ChIK9CZi",
							"5rlXmCb6DTBy3YHa",
							"wVs9K6vtsN4TFuXD",
							"4ySODrSdwd6MCKCH",
						]
					: monkLevel >= 6
						? ["FQa89kp1ChIK9CZi", "5rlXmCb6DTBy3YHa", "wVs9K6vtsN4TFuXD"]
						: [],
			itemsToRemoveOnDisable: [
				"Elemental Thrust (Fire)",
				"Burning Hands (1 Ki)",
				"Burning Hands (2 Ki)",
				"Burning Hands (3 Ki)",
				"Fireball (4 Ki)",
			],
		},
		water: {
			effectsToRemove: ["Air Attunement", "Earth Attunement", "Fire Attunement"],
			itemsToAdd: ["78p6Y6A3i9DWvUj3"],
			spellsToAdd:
				monkLevel >= 14
					? [
							"kSTZBRIi9DuHuA4h",
							"eeaEt3KwnC1sWXUX",
							"tr8hhpZg8jrGA6rp",
							"SZ7WREA5tz4LLrOL",
						]
					: monkLevel >= 6
						? ["kSTZBRIi9DuHuA4h", "eeaEt3KwnC1sWXUX", "tr8hhpZg8jrGA6rp"]
						: [],
			itemsToRemoveOnDisable: [
				"Elemental Thrust (Water)",
				"Gentle Current (1 Ki)",
				"Gentle Current (2 Ki)",
				"Gentle Current (3 Ki)",
				"Sleet Storm (4 Ki)",
			],
		},
	};

	if (action === "on") {
		const config = attunementConfig[element];

		// Remove all previous attunement effects and items
		for (const effectLabel of [
			"Air Attunement",
			"Earth Attunement",
			"Fire Attunement",
			"Water Attunement",
		]) {
			const effect = actor.effects.find((i) => i.label === effectLabel);
			if (effect) await effect.delete();
		}

		// Remove all previous attunement items from all elements
		for (const elem of Object.keys(attunementConfig)) {
			for (const itemName of attunementConfig[elem].itemsToRemoveOnDisable) {
				const item = actor.items.find((i) => i.name === itemName);
				if (item) await item.delete();
			}
		}

		// Add new spells
		for (const spellId of config.spellsToAdd) {
			const spell = await game.packs.get("elkan5e.elkan5e-spells").getDocument(spellId);
			await actor.createEmbeddedDocuments("Item", [spell.toObject()]);
		}

		// Add new feature
		for (const featureId of config.itemsToAdd) {
			const feature = await game.packs
				.get("elkan5e.elkan5e-class-features")
				.getDocument(featureId);
			await actor.createEmbeddedDocuments("Item", [feature.toObject()]);
		}
	} else if (action === "off") {
		const config = attunementConfig[element];

		// Remove attunement effects and items
		for (const effectLabel of config.effectsToRemove) {
			const effect = actor.effects.find((i) => i.label === effectLabel);
			if (effect) await effect.delete();
		}

		for (const itemName of config.itemsToRemoveOnDisable) {
			const item = actor.items.find((i) => i.name === itemName);
			if (item) await item.delete();
		}
	}
}
