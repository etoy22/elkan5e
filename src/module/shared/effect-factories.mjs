/**
 * Effects helper module for managing effect creation and management.
 * Effects are stored in the elkan5e-effects compendium and can be created with custom options.
 */

import { CONDITION_EFFECT_ID } from "../rules/condition/data.mjs";

const CHANGE_TYPES = ["custom", "multiply", "add", "downgrade", "upgrade", "override"];

/**
 * Converts pre-v14 effect options (top-level `changes` with numeric `mode`, `icon`, `label`) to the
 * current fields, so they replace the template's values instead of being dropped.
 *
 * @param {Object} options - Effect options.
 * @returns {Object} Options using `system.changes`, `img`, and `name`.
 */
function normalizeEffectOptions(options) {
	const { changes, icon, label, ...rest } = options;
	if (icon && !rest.img) rest.img = icon;
	if (label && !rest.name) rest.name = label;
	if (changes) {
		rest.system = {
			...(rest.system ?? {}),
			changes: changes.map(({ mode, ...change }) => ({
				...change,
				type: change.type ?? CHANGE_TYPES[mode] ?? "add",
			})),
		};
	}
	return rest;
}

/**
 * Create an active effect from the elkan5e-effects compendium and merge with custom options.
 *
 * @param {string} effectId - The ID or identifier of the effect template in the compendium
 * @param {Object} customOptions - Options to merge/override the template
 * @returns {Promise<Object>} The effect data ready to be created
 */
export async function createEffect(effectId, customOptions = {}) {
	// Get the base template from the test.json
	let effectData = {
		name: "Base Effect",
		type: "base",
		img: "systems/dnd5e/icons/svg/documents/active-effect.svg",
		system: {
			changes: [],
			identifier: "base-effect",
		},
		disabled: false,
		duration: { value: null, units: "seconds", expiry: null, expired: false },
		description: "",
		origin: null,
		tint: "#ffffff",
		transfer: false,
		statuses: [],
		showIcon: 1,
		folder: null,
		flags: {
			dae: {
				enableCondition: "",
				disableCondition: "",
				expiryMode: "default",
				macroRepeat: "none",
				disableIncapacitated: false,
				specialDuration: [],
			},
		},
	};

	// Try to load the effect from the compendium
	try {
		const compendium = game.packs.get("elkan5e.elkan5e-effects");
		if (compendium) {
			// Get document by ID or identifier
			let doc = await compendium.getDocument(effectId).catch(() => null);

			// Condition ids (e.g. "incapacitated") resolve to the generated condition effects
			doc ??= await compendium.getDocument(CONDITION_EFFECT_ID(effectId)).catch(() => null);

			// If not found by ID, try by identifier or name
			if (!doc) {
				const index = await compendium.getIndex({ fields: ["system.identifier"] });
				const foundEntry = index.find(
					(entry) =>
						entry.system?.identifier === effectId ||
						entry.name === effectId ||
						entry._id === effectId,
				);
				if (foundEntry) {
					doc = await compendium.getDocument(foundEntry._id);
				}
			}

			if (doc) {
				effectData = doc.toObject();
			}
		}
	} catch (error) {
		console.warn(`Could not load effect ${effectId} from compendium:`, error);
	}

	// Remove the _key and _id from the object so a new one is generated
	delete effectData._key;
	delete effectData._id;

	// Merge custom options
	effectData = foundry.utils.mergeObject(effectData, normalizeEffectOptions(customOptions), {
		insertKeys: true,
	});

	return effectData;
}

/**
 * Create the Goodberry Duration effect.
 *
 * @param {Object} item - The spell item
 * @param {number} level - The spell level
 * @param {string} linkedItemUuid - The UUID of the linked goodberry item
 * @param {Object} customOptions - Additional options
 * @returns {Promise<Object>} The effect data
 */
export async function createGoodberryDurationEffect(
	item,
	level,
	linkedItemUuid,
	customOptions = {},
) {
	const defaultOptions = {
		name: `${item.name} Duration (Level ${level})`,
		label: `${item.name} Duration (Level ${level})`,
		icon: item.img,
		origin: item.uuid,
		duration: { value: 1, units: "hours" },
		changes: [],
		flags: {
			elkan5e: { goodberryItemId: linkedItemUuid },
		},
	};
	return createEffect("goodberry-duration", { ...defaultOptions, ...customOptions });
}

/**
 * Create the Delayed Surge effect.
 *
 * @param {Object} customOptions - Options to override
 * @returns {Promise<Object>} The effect data
 */
export async function createDelayedSurgeEffect(customOptions = {}) {
	const defaultOptions = {
		duration: { value: 1, units: "hours" },
		flags: {
			dae: {
				selfTarget: true,
				stackable: "multi",
			},
		},
	};
	return createEffect("delayed-surge", { ...defaultOptions, ...customOptions });
}

/**
 * Create the Climber Effect for grappling.
 *
 * @param {Object} targetActor - The target actor
 * @param {Object} grappler - The grappling actor
 * @param {Object} customOptions - Additional options
 * @returns {Promise<Object>} The effect data
 */
export async function createClimberEffect(targetActor, grappler, customOptions = {}) {
	const defaultOptions = {
		name: game.i18n.localize("elkan5e.grapple.climberEffect") || "Climber Effect",
		icon: "icons/svg/hazards/net-snare.svg",
		origin: targetActor.uuid,
	};
	return createEffect("climber-effect", { ...defaultOptions, ...customOptions });
}

/**
 * Create the Grappled effect.
 *
 * @param {Object} grappler - The grappling actor
 * @param {Object} targetActor - The target actor
 * @param {Array} changes - The effect changes
 * @param {Object} flags - Custom flags
 * @param {Object} customOptions - Additional options
 * @returns {Promise<Object>} The effect data
 */
export async function createGrappledEffect(
	grappler,
	targetActor,
	changes = [],
	flags = {},
	customOptions = {},
) {
	const defaultOptions = {
		name: game.i18n.localize("elkan5e.conditions.grappled") || "Grappled",
		icon: "icons/svg/hazards/net-snare.svg",
		origin: grappler.uuid,
		flags,
		changes,
		disabled: false,
		statuses: ["grappled"],
	};
	return createEffect("grappled", { ...defaultOptions, ...customOptions });
}

/**
 * Create the Mounted effect applied to a rider.
 *
 * @param {Object} mountActor  - The mount (the creature being ridden)
 * @param {Object} riderActor  - The rider
 * @param {Array}  changes     - The effect changes (e.g. zero movement)
 * @param {Object} flags       - Custom flags (must include elkan5e.ride.mountUuid)
 * @param {Object} customOptions - Additional options
 * @returns {Promise<Object>} The effect data
 */

export default {
	createEffect,
	createGoodberryDurationEffect,
	createDelayedSurgeEffect,
	createClimberEffect,
	createGrappledEffect,
};
