/* global game, foundry */
import { deleteEffectRemoveEffect } from "../global.mjs";
const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Handle the "Meld with Shadows" effect for the given actor.
 *
 * This function checks if the actor has the "Meld with Shadows [Effect]" active.
 * If the actor also has any other effect that is not "Meld with Shadows [Attacks]",
 * the "Meld with Shadows [Effect]" will be deleted.
 *
 * @param {object} actor - The actor object to be processed.
 * @returns {Promise<void>} A promise that resolves when the effect has been processed.
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
 * Handle the "Hijack Shadow" effect for the given actor.
 *
 * This function checks if the actor has the "Hijack Shadow [Effect]" active.
 * If the actor also has any other effect that is not "Hijack Shadow [Attacks]",
 * the "Hijack Shadow [Effect]" will be deleted.
 *
 * @param {object} actor - The actor object to be processed.
 * @returns {Promise<void>} A promise that resolves when the effect has been processed.
 */
export async function rmvhijackShadow(actor) {
	await deleteEffectRemoveEffect(
		actor,
		"elkan5e.monk.hijackShadowEffect",
		"elkan5e.monk.hijackShadowAttacks",
		["elkan5e.monk.emptyBody"],
	);
}

export async function hijackShadow(workflow) {
	const actor = workflow.actor;
	emptyBody(actor);
}

export async function meldWithShadows(workflow) {
	const actor = workflow.actor;
	emptyBody(actor);
}

export async function emptyBody(actor) {
	if (!actor.isOwner) return;
	if (actor.items.find((i) => i.system.identifier === "empty-body")) {
		const emptyBody = {
			_id: "4dvYtqvbQGDsVi51",
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
			disabled: false,
			duration: { seconds: 600 },
			origin: "Item.xqRleciuHDZlYCl6",
			name: game.i18n.localize("elkan5e.monk.emptyBody"),
			statuses: ["invisible"],
			img: "icons/magic/perception/silhouette-stealth-shadow.webp",
			type: "base",
		};
		let confirm = await DialogV2.confirm({
			window: { title: game.i18n.localize("elkan5e.monk.emptyBodyTitle") },
			content: `<p>${game.i18n.localize("elkan5e.monk.emptyBodyContent")}</p>`,
			rejectClose: false,
			modal: true,
		});
		if (confirm) {
			await actor.createEmbeddedDocuments("ActiveEffect", [emptyBody]);
		}
	}
}

export async function elementalAttunement(args) {
	if (args[0] == "on") {
		const actor = await game.actors.get(args[1]);
		let element = args[2];
		console.log("Actor items", actor.items);
		if (actor.items.find((i) => i.name === "Monk")) {
			let level = actor.items.find((i) => i.name === "Monk").system.levels;
			const elements = {
				air: {
					effectsToRemove: ["Earth Attunement", "Fire Attunement", "Water Attunement"],
					itemsToAdd: ["RFs2JK8U1HWwRtRy"],
					spellsToAdd:
						level >= 14
							? [
									"MKvNn3Q5xPa0vEK2",
									"Q6y7fBSwRIUMChVh",
									"ZRsOGTOZI6aksC85",
									"efO0uhdOJ89v9RKL",
								]
							: level >= 6
								? ["MKvNn3Q5xPa0vEK2", "Q6y7fBSwRIUMChVh", "ZRsOGTOZI6aksC85"]
								: [],
				},
				earth: {
					effectsToRemove: ["Air Attunement", "Fire Attunement", "Water Attunement"],
					itemsToAdd: ["UE1CR9GhnUHA8W3v"],
					spellsToAdd:
						level >= 14
							? [
									"8iOXbBYr8peoRGtp",
									"QNa2AQVdnwGihVCe",
									"yJX39WZzkHIvxhVv",
									"i8ASCHhH1r6NHPPy",
								]
							: level >= 6
								? ["8iOXbBYr8peoRGtp", "QNa2AQVdnwGihVCe", "yJX39WZzkHIvxhVv"]
								: [],
				},
				fire: {
					effectsToRemove: ["Air Attunement", "Earth Attunement", "Water Attunement"],
					itemsToAdd: ["MRDsf3PEbZ89LXAP"],
					spellsToAdd:
						level >= 14
							? [
									"FQa89kp1ChIK9CZi",
									"5rlXmCb6DTBy3YHa",
									"wVs9K6vtsN4TFuXD",
									"4ySODrSdwd6MCKCH",
								]
							: level >= 6
								? ["FQa89kp1ChIK9CZi", "5rlXmCb6DTBy3YHa", "wVs9K6vtsN4TFuXD"]
								: [],
				},
				water: {
					effectsToRemove: ["Air Attunement", "Earth Attunement", "Fire Attunement"],
					itemsToAdd: ["78p6Y6A3i9DWvUj3"],
					spellsToAdd:
						level >= 14
							? [
									"kSTZBRIi9DuHuA4h",
									"eeaEt3KwnC1sWXUX",
									"tr8hhpZg8jrGA6rp",
									"SZ7WREA5tz4LLrOL",
								]
							: level >= 6
								? ["kSTZBRIi9DuHuA4h", "eeaEt3KwnC1sWXUX", "tr8hhpZg8jrGA6rp"]
								: [],
				},
			};

			const { effectsToRemove, itemsToAdd, spellsToAdd } = elements[element];

			for (const effectLabel of effectsToRemove) {
				const effect = actor.effects.find((i) => i.label === effectLabel);
				if (effect) {
					await effect.delete();
				}
			}

			for (const itemId of spellsToAdd) {
				let item = await game.packs.get("elkan5e.elkan5e-spells").getDocument(itemId);
				await actor.createEmbeddedDocuments("Item", [item.toObject()]);
			}

			for (const itemId of itemsToAdd) {
				let item = await game.packs
					.get("elkan5e.elkan5e-class-features")
					.getDocument(itemId);
				await actor.createEmbeddedDocuments("Item", [item.toObject()]);
			}
		}
	}

	if (args[0] == "off") {
		const actor = await game.actors.get(args[1]);
		let element = args[2];
		if (actor.items.find((i) => i.name === "Monk")) {
			const itemsToRemove = {
				air: [
					"Elemental Thrust (Air)",
					"Thunderwave (1 Ki)",
					"Thunderwave (2 Ki)",
					"Thunderwave (3 Ki)",
					"Fly (4 Ki)",
				],
				earth: [
					"Elemental Thrust (Earth)",
					"False Life (1 Ki)",
					"False Life (2 Ki)",
					"False Life (3 Ki)",
					"Rock Blast (4 Ki)",
				],
				fire: [
					"Elemental Thrust (Fire)",
					"Burning Hands (1 Ki)",
					"Burning Hands (2 Ki)",
					"Burning Hands (3 Ki)",
					"Fireball (4 Ki)",
				],
				water: [
					"Elemental Thrust (Water)",
					"Gentle Current (1 Ki)",
					"Gentle Current (2 Ki)",
					"Gentle Current (3 Ki)",
					"Sleet Storm (4 Ki)",
				],
			}[element];

			for (const itemName of itemsToRemove) {
				const item = actor.items.find((i) => i.name === itemName);
				if (item) {
					await item.delete();
				}
			}
		}
	}
}
