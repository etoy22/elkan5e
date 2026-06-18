/**
 * Effects helper module for managing effect creation and management.
 * Effects are stored in the elkan5e-effects compendium and can be created with custom options.
 */

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

			// If not found by ID, try by name
			if (!doc) {
				const index = await compendium.getIndex();
				const foundEntry = index.find(
					(entry) => entry.name === effectId || entry._id === effectId,
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
	effectData = foundry.utils.mergeObject(effectData, customOptions, { insertKeys: true });

	return effectData;
}

/**
 * Create the Empty Body effect for monks.
 *
 * @param {Object} customOptions - Options to override the template
 * @returns {Promise<Object>} The effect data
 */
export async function createEmptyBodyEffect(customOptions = {}) {
	const defaultOptions = {
		name: game.i18n.localize("elkan5e.monk.emptyBody"),
		origin: "Item.xqRleciuHDZlYCl6",
	};
	return createEffect("empty-body", { ...defaultOptions, ...customOptions });
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
		duration: { value: 1, units: "hour" },
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
		duration: { value: 1, units: "hour" },
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
 * Create the Barbarian Defense effect.
 *
 * @param {Object} actor - The actor to apply the effect to
 * @param {Array} changes - The effect changes
 * @param {Object} customOptions - Additional options
 * @returns {Promise<Object>} The effect data
 */
export async function createBarbarianDefenseEffect(actor, changes = [], customOptions = {}) {
	const defaultOptions = {
		name: "Barbarian Defense Bonus",
		icon: "icons/commodities/biological/shell-tan.webp",
		origin: actor.uuid,
		disabled: false,
		changes,
	};
	return createEffect("barbarian-defense", { ...defaultOptions, ...customOptions });
}

/**
 * Create the Drained effect.
 *
 * @param {Object} actor - The actor to apply the effect to
 * @param {number} damage - The damage value
 * @param {string} name - The effect name
 * @param {string} img - The effect image
 * @param {string} uuid - The origin UUID
 * @returns {Promise<Object>} The effect data
 */
export async function createDrainedEffect(
	actor,
	damage,
	name = "Drained",
	img = "modules/elkan5e/icons/drained.svg",
	uuid = null,
) {
	const effectName = name;
	const effectImg = img;
	const effectOrigin = uuid || null;

	const existingEffect = actor.effects.find(
		(e) => e.name === effectName && e.img === effectImg && e.origin === effectOrigin,
	);

	const newValue = -Math.abs(damage); // Ensure negative number

	if (existingEffect) {
		const updatedChanges = existingEffect.changes.map((change) => {
			if (change.key === "system.attributes.hp.tempmax") {
				const oldVal = parseFloat(change.value) || 0;
				const combinedValue = oldVal + newValue;

				return {
					...change,
					value: combinedValue.toString(),
				};
			}
			return change;
		});

		await existingEffect.update({ changes: updatedChanges });
		return null; // Return null if we updated existing effect
	}

	const defaultOptions = {
		name: effectName,
		img: effectImg,
		origin: effectOrigin,
		changes: [
			{
				key: "system.attributes.hp.tempmax",
				mode: 2,
				value: newValue.toString(),
				priority: 20,
			},
		],
		disabled: false,
		statuses: ["drained"],
		flags: {
			dae: {
				enableCondition: "",
				disableCondition: "",
				disableIncapacitated: false,
				selfTarget: false,
				selfTargetAlways: false,
				dontApply: false,
				stackable: "multi",
				showIcon: false,
			},
		},
	};

	return createEffect("drained", defaultOptions);
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
export async function createMountedEffect(
	mountActor,
	riderActor,
	changes = [],
	flags = {},
	customOptions = {},
) {
	const defaultOptions = {
		name: game.i18n.localize("elkan5e.conditions.mounted") || "Mounted",
		icon: "icons/svg/horse.svg",
		origin: mountActor.uuid,
		flags,
		changes,
		disabled: false,
		statuses: ["mounted"],
	};
	return createEffect("mounted", { ...defaultOptions, ...customOptions });
}

export default {
	createEffect,
	createEmptyBodyEffect,
	createGoodberryDurationEffect,
	createDelayedSurgeEffect,
	createBarbarianDefenseEffect,
	createDrainedEffect,
	createClimberEffect,
	createGrappledEffect,
	createMountedEffect,
};
