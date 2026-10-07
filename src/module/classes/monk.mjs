import { isInBrightLight } from "../rules/condition/vision.mjs";
import { deleteEffectRemoveEffect, deleteEffects, t } from "../shared/helpers.mjs";

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
 * Clears shadow/hijack effects from the actor whose turn just ended.
 *
 * @param {*} combat - Current combat document.
 * @param {*} prior - Prior turn data.
 */
export function onCombatTurnChange(combat, prior) {
	if (!game.users.activeGM?.isSelf) return;
	const priorCombatantId = prior?.combatantId;
	if (!priorCombatantId) return;
	const lastActor = combat?.combatants?.get(priorCombatantId)?.actor;
	if (!lastActor) return;
	rmvMeldShadow(lastActor);
	rmvhijackShadow(lastActor);
}

/**
 * Ends Meld with Shadows on every token in the scene that is standing in bright light.
 *
 * @returns {Promise<void>}
 */
async function endMeldWithShadowsInBrightLight() {
	const effectName = t("elkan5e.monk.meldWithShadowsEffect");
	const endNames = new Set([
		effectName,
		t("elkan5e.monk.meldWithShadowsAttacks"),
		t("elkan5e.monk.emptyBody"),
	]);
	for (const token of canvas?.tokens?.placeables ?? []) {
		const actor = token.actor;
		if (!actor?.effects.some((e) => e.name === effectName)) continue;
		if (!isInBrightLight(token.document)) continue;
		await deleteEffects(
			actor,
			actor.effects.filter((e) => endNames.has(e.name)),
		);
		ui.notifications.info(t("elkan5e.monk.meldWithShadowsBrightLight", { name: actor.name }));
	}
}

const debouncedMeldCheck = foundry.utils.debounce(() => {
	endMeldWithShadowsInBrightLight().catch((error) =>
		console.error("Elkan 5e | Error ending Meld with Shadows in bright light:", error),
	);
}, 250);

/**
 * Runs Meld with Shadows class feature automation: the ability ends if the monk enters bright
 * light. Checked whenever the scene's lighting refreshes (on the active GM), and whenever the
 * current user moves a token or applies the effect, so it still runs when no GM is viewing the scene.
 *
 * @param {object} [options]
 * @param {string} [options.userId] - User who made the triggering change, if any.
 * @param {ActiveEffect} [options.effect] - Effect that was just created, if any.
 */
export function meldWithShadowsBrightLight({ userId, effect } = {}) {
	if (effect && effect.name !== t("elkan5e.monk.meldWithShadowsEffect")) return;
	if (userId ? userId !== game.user.id : !game.users.activeGM?.isSelf) return;
	debouncedMeldCheck();
}

const STILLNESS_STATUSES = ["charmed", "confused", "frightened", "goaded"];

/**
 * Effects on an actor that Stillness of Mind can end.
 *
 * @param {Actor} actor - Monk using the feature.
 * @returns {ActiveEffect[]}
 */
const stillnessEffects = (actor) =>
	actor.effects.filter((e) => e.active && STILLNESS_STATUSES.some((id) => e.statuses?.has(id)));

/**
 * Runs Stillness of Mind class feature automation: ends one charmed, confused, frightened or
 * goaded effect on the monk, asking which one when there's more than one.
 *
 * @param {object} activity - Activity that was used.
 * @returns {Promise<void>}
 */
export async function stillnessOfMind(activity) {
	if (activity?.item?.system?.identifier !== "stillness-of-mind") return;
	const actor = activity.actor;
	if (!actor?.isOwner) return;

	const effects = stillnessEffects(actor);
	if (!effects.length) {
		ui.notifications.info(t("elkan5e.monk.stillnessOfMindNothing", { name: actor.name }));
		return;
	}

	let effect = effects[0];
	if (effects.length > 1) {
		const chosen = await DialogV2.wait({
			window: { title: activity.item.name },
			content: `<p>${t("elkan5e.monk.stillnessOfMindChoose")}</p>`,
			buttons: effects.map((e, i) => ({ label: e.name, action: e.id, default: i === 0 })),
			rejectClose: false,
		});
		effect = effects.find((e) => e.id === chosen);
		if (!effect) return;
	}

	await deleteEffects(actor, [effect]);
	ui.notifications.info(
		t("elkan5e.monk.stillnessOfMindEnded", { name: actor.name, effect: effect.name }),
	);
}

/**
 * At the start of a monk's turn, offers to use Stillness of Mind if they're charmed, confused,
 * frightened or goaded. Prompts the actor's active player, or the active GM if none.
 *
 * @param {Combat} combat - Current combat document.
 * @returns {Promise<void>}
 */
export async function stillnessOfMindTurnStart(combat) {
	const actor = combat?.combatant?.actor;
	if (!actor) return;
	const responsible =
		game.users.find((u) => u.active && !u.isGM && actor.testUserPermission(u, "OWNER")) ??
		game.users.activeGM;
	if (!responsible?.isSelf) return;

	const item = actor.items.find((i) => i.system?.identifier === "stillness-of-mind");
	const activity = item?.system.activities.contents[0];
	const effects = stillnessEffects(actor);
	if (!activity || !effects.length) return;

	const confirmed = await DialogV2.confirm({
		window: { title: item.name },
		content: `<p>${t("elkan5e.monk.stillnessOfMindPrompt", {
			name: actor.name,
			effects: effects.map((e) => e.name).join(", "),
		})}</p>`,
		rejectClose: false,
		modal: true,
	});
	if (confirmed) await activity.use();
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

	const config = attunementConfig[element];
	if (!config) return;

	if (action === "on") {
		// Remove the other three attunement effects (leaves the one just applied intact)
		for (const effectLabel of config.effectsToRemove) {
			const effect = actor.effects.find((i) => i.name === effectLabel);
			if (effect) await effect.delete();
		}

		// Remove attunement items from every element, in case the actor was previously attuned
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
		// Remove attunement effects and items
		for (const effectLabel of config.effectsToRemove) {
			const effect = actor.effects.find((i) => i.name === effectLabel);
			if (effect) await effect.delete();
		}

		for (const itemName of config.itemsToRemoveOnDisable) {
			const item = actor.items.find((i) => i.name === itemName);
			if (item) await item.delete();
		}
	}
}
