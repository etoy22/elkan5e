/**
 * Localize or format an i18n key. Pass `data` to use format(), otherwise localize().
 *
 * @param {string} key - i18n key.
 * @param {object} [data] - Optional format() substitution data.
 * @returns {string}
 */
export const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));

/**
 * Measure distance between two points using the v13+ measurePath API,
 * falling back to the legacy measureDistance method on older grids.
 * Returns Number.POSITIVE_INFINITY when no grid measurement is available.
 *
 * @param {{x:number,y:number}|Token} from
 * @param {{x:number,y:number}|Token} to
 * @returns {number}
 */
export const measureRangeDistance = (from, to) => {
	if (!canvas?.grid) return Number.POSITIVE_INFINITY;
	const origin = from?.center ?? from;
	const destination = to?.center ?? to;
	if (typeof canvas.grid.measurePath === "function") {
		try {
			const path = canvas.grid.measurePath([origin, destination], {});
			if (Number.isFinite(path?.distance)) return path.distance;
		} catch (error) {
			void error;
		}
	}
	if (typeof canvas.grid.measureDistance === "function") {
		return canvas.grid.measureDistance(origin, destination);
	}
	return Number.POSITIVE_INFINITY;
};

/**
 * Shared helper for deleted Effect Removes Item.
 *
 * @param {*} effect - Active effect being handled.
 * @param {*} effectName - Effect Name.
 * @param {*} itemName - Item Name.
 * @param {*} descriptionPrefix - Description Prefix.
 * @param {*} endMessage - End Message.
 * @returns {Promise<void>} Promise resolution result.
 */

export async function deletedEffectRemovesItem(
	effect,
	effectName,
	itemName,
	descriptionPrefix,
	endMessage,
) {
	if (effect.name === game.i18n.localize(effectName)) {
		const actor = effect.parent;
		const item = actor.items.find((item) => item.name === game.i18n.localize(itemName));
		if (item) {
			const itemDescription = item.system.description.value
				.replace(game.i18n.localize(descriptionPrefix), "")
				.trim();
			const chatMessageData = {
				user: game.user.id,
				speaker: ChatMessage.getSpeaker({ actor: actor }),
				content: `<p>${itemDescription}</p><p>${game.i18n.localize(endMessage)}</p>`,
			};
			ChatMessage.create(chatMessageData);
			await item.delete();
		}
	}
}

/**
 * Shared helper for deleted Item Removes Effect.
 *
 * @param {*} item - Item document to process.
 * @param {*} itemName - Item Name.
 * @param {*} effectName - Effect Name.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function deletedItemRemovesEffect(item, itemName, effectName) {
	if (item.name === game.i18n.localize(itemName)) {
		const actor = item.parent;
		const effect = actor.effects.find((e) => e.name === game.i18n.localize(effectName));
		if (effect) {
			await effect.delete();
		}
	}
}

/**
 * Shared helper for delete Effect Remove Effect.
 *
 * @param {*} actor - Actor document to process.
 * @param {*} effectToRemove - Effect To Remove.
 * @param {*} effectToIgnore - Effect To Ignore.
 * @param {*} additionalEffectsToRemove - Additional Effects To Remove.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function deleteEffectRemoveEffect(
	actor,
	effectToRemove,
	effectToIgnore,
	additionalEffectsToRemove,
) {
	const effectToRemoveLocalized = game.i18n.localize(effectToRemove);
	const effectToIgnoreLocalized = game.i18n.localize(effectToIgnore);
	const additionalEffectsToRemoveLocalized = additionalEffectsToRemove.map((effect) =>
		game.i18n.localize(effect),
	);

	// Find the effect to remove
	const effect = actor.effects.find((i) => i.name === effectToRemoveLocalized);
	if (effect && actor.effects.find((i) => i.name !== effectToIgnoreLocalized)) {
		// Delete the effect to remove
		await effect.delete();

		// Find and delete any additional effects to remove
		const additionalEffects = actor.effects.filter((i) =>
			additionalEffectsToRemoveLocalized.includes(i.name),
		);
		for (const additionalEffect of additionalEffects) {
			await additionalEffect.delete();
		}
	}
}

/**
 * Shared helper for drained Effect.
 *
 * @param {*} actor - Actor document to process.
 * @param {*} damage - Damage.
 * @param {*} name - Name value used by the operation.
 * @param {*} img - Img.
 * @param {*} uuid - Identifier value.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function drainedEffect(actor, damage, name, img, uuid, missing = false) {
	const effectName = name || "Drained";
	const effectImg = img || "modules/elkan5e/icons/drained.svg";
	const effectOrigin = uuid || null;

	const existingEffect = actor.effects.find(
		(e) => e.name === effectName && e.img === effectImg && e.origin === effectOrigin,
	);

	let newValue = -Math.abs(damage); // Ensure negative number
	if (missing) {
		const difference = actor.system.attributes.hp.max - actor.system.attributes.hp.value;
		if (difference <= 0) return;
		newValue = -Math.min(difference, Math.abs(damage));
	}

	if (existingEffect) {
		const updatedChanges = existingEffect.changes.map((change) => {
			if (change.key === "system.attributes.hp.tempmax") {
				// Parse the old value (as string), add newValue
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
	} else {
		const drained = {
			_id: foundry.utils.randomID(),
			changes: [
				{
					key: "system.attributes.hp.tempmax",
					mode: 2,
					value: newValue.toString(),
					priority: 20,
				},
			],
			disabled: false,
			origin: effectOrigin,
			name: effectName,
			img: effectImg,
			type: "base",
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
					durationExpression: "",
					macroRepeat: "none",
				},
			},
		};
		await actor.createEmbeddedDocuments("ActiveEffect", [drained]);
	}
}

/**
 * Shared helper for for Each Damaged Target.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @param {*} callback - Callback.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function forEachDamagedTarget(workflow, callback) {
	for (const dmgEntry of workflow.damageList ?? []) {
		const { targetUuid, tempDamage = 0, hpDamage = 0 } = dmgEntry;
		const dmg = tempDamage + hpDamage;
		if (dmg <= 0 || !targetUuid) continue;
		const targetDoc = await fromUuid(targetUuid).catch(() => null);
		const token =
			targetDoc?.object ??
			(targetDoc?.id ? canvas.tokens.get(targetDoc.id) : null) ??
			canvas.tokens.get(targetUuid.split(".").at(-1));
		if (!token) continue;
		// Guarantee we're awaiting a Promise
		await Promise.resolve(callback(token, dmg, dmgEntry));
	}
}

export const SIZE_ORDER = ["tiny", "sm", "med", "lg", "huge", "grg"];
const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const hasCaseInsensitiveFlag = (obj, key) => {
	if (!obj || !key) return false;
	const target = String(key).toLowerCase();
	return Object.keys(obj).some((k) => k.toLowerCase() === target && Boolean(obj[k]));
};

const valueIsTruthy = (value) => {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	const normalized = String(value ?? "")
		.trim()
		.toLowerCase();
	return TRUE_VALUES.has(normalized);
};

/**
 * Shared helper for has Special Trait.
 *
 * @param {*} actor - Actor document to process.
 * @param {*} trait - Trait to check for.
 * @returns {boolean} Status of whether the actor has the trait.
 */
export function hasSpecialTrait(actor, trait) {
	const key = String(trait ?? "")
		.trim()
		.toLowerCase();
	if (!key || !actor) return false;

	const traits = actor.system?.traits ?? {};
	const special = traits.special ?? traits.specialTraits ?? null;
	const values = Array.isArray(special?.value)
		? special.value
		: Array.isArray(special)
			? special
			: [];
	const valueMatch = values.some((v) => String(v).toLowerCase() === key);

	const custom = `${special?.custom ?? ""} ${traits?.custom ?? ""}`.toLowerCase();
	const customMatch = custom.includes(key);

	const flags = actor.flags?.elkan5e ?? {};
	const elkanTraitFlag = Boolean(flags?.traits?.[key]);
	const elkanDirectFlag = Boolean(flags?.[key]);
	const elkanCaseInsensitive = hasCaseInsensitiveFlag(flags, key);

	const dnd5eFlags = actor.flags?.dnd5e ?? {};
	const dndDirectFlag = Boolean(dnd5eFlags?.[key]);
	const dndCaseInsensitive = hasCaseInsensitiveFlag(dnd5eFlags, key);

	const matched =
		valueMatch ||
		customMatch ||
		elkanTraitFlag ||
		elkanDirectFlag ||
		elkanCaseInsensitive ||
		dndDirectFlag ||
		dndCaseInsensitive;

	if (key === "powerful build") {
		console.log(
			`Elkan 5e | hasSpecialTrait("${key}") actor="${actor?.name ?? "Unknown"}" matched=${matched}`,
			{
				valueMatch,
				customMatch,
				elkanTraitFlag,
				elkanDirectFlag,
				elkanCaseInsensitive,
				dndDirectFlag,
				dndCaseInsensitive,
				specialValues: values,
				specialCustom: special?.custom ?? "",
				traitsCustom: traits?.custom ?? "",
				dnd5eFlagKeys: Object.keys(dnd5eFlags ?? {}),
			},
		);
	}

	return matched;
}

/**
 * Shared helper for is Push Blocked.
 *
 * @param {*} actor - Actor document to process.
 * @returns Status of whether the actor is push blocked.
 */
export function isPushBlocked(actor) {
	if (!actor) return false;
	const unpushableName = game.i18n.localize("elkan5e.traits.unpushable.name").toLowerCase();
	const traitMatch = hasSpecialTrait(actor, "unpushable");
	if (traitMatch) return true;

	const namedEffect = actor.effects.some((effect) => {
		const name = String(effect?.name ?? "")
			.trim()
			.toLowerCase();
		return name === unpushableName;
	});
	if (namedEffect) return true;

	const blockedByEffect = actor.effects.some((effect) =>
		(effect?.changes ?? []).some((change) => {
			const key = String(change?.key ?? "").toLowerCase();
			if (!key) return false;
			const pushBlockKey = key === "flags.dnd5e.unpushable";
			return pushBlockKey && valueIsTruthy(change?.value);
		}),
	);

	return blockedByEffect;
}

/**
 * Shared helper for has Push Resist.
 *
 * @param {*} actor - Actor document to process.
 * @returns Status of whether the actor has push resist.
 */
export function hasPushResist(actor) {
	if (!actor) return false;

	const actorFlag = actor.flags?.elkan5e?.pushResist ?? actor.flags?.elkan5e?.pushresist;
	if (valueIsTruthy(actorFlag)) return true;

	return actor.effects.some((effect) =>
		(effect?.changes ?? []).some((change) => {
			const key = String(change?.key ?? "").toLowerCase();
			return key === "flags.elkan5e.pushresist" && valueIsTruthy(change?.value);
		}),
	);
}

export function difficultTerrainEffect() {}

function randomString(length = 16) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/**
 * AmbientLight properties that live at the top level of the document.
 * None of these are part of the midi-qol `regionLight` RegionBehavior
 * schema, so midi-qol never touches them once the light is created.
 */
const LIGHT_TOP_LEVEL_EXTRA_KEYS = ["sort", "walls", "elevation", "rotation", "vision"];

/**
 * AmbientLight properties that live under `config` (LightData). midi-qol's
 * `MidiRegionLightBehaviorType._onUpdate` rebuilds `config` from scratch
 * (dim/bright/color/alpha/luminosity/animation only) every time the
 * behavior's `system` data changes, which would silently wipe any of these
 * out — so they must be re-applied after every create/update, not just once.
 */
const LIGHT_CONFIG_EXTRA_KEYS = ["negative", "priority", "angle", "darkness"];

/**
 * Pushes AmbientLight-only properties that the midi-qol `regionLight`
 * RegionBehavior schema can't express (sort, negative/darkness-source,
 * priority, emission angle, darkness activation range, walls, elevation,
 * rotation, vision) onto the light document that behavior created.
 *
 * Only keys present on `extras` are considered, so a caller can update a
 * subset without disturbing the rest. The merged result is stored on the
 * behavior as a flag so it can be re-applied whenever midi-qol rebuilds the
 * light's `config` in response to a later `system` update on the behavior
 * (see {@link applyLightRegion}, and the `createRegionBehavior` /
 * `updateRegionBehavior` hooks in elkan5e.mjs).
 *
 * @param {string|object} behaviorRef - RegionBehavior document or its UUID.
 * @param {object} [extras] - Subset of the extra keys above to apply/store.
 * @returns {Promise<boolean>} Whether the light was found and processed.
 */
export async function syncRegionLightExtras(behaviorRef, extras = {}) {
	if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return false;

	const behaviorDoc =
		typeof behaviorRef === "string"
			? await fromUuid(behaviorRef).catch(() => null)
			: behaviorRef;
	if (!behaviorDoc || behaviorDoc.type !== "midi-qol.regionLight") return false;

	const storedExtras = behaviorDoc.getFlag("elkan5e", "lightExtras") ?? {};
	const resolvedExtras = { ...storedExtras, ...extras };
	if (!Object.keys(resolvedExtras).length) return false;

	const lightDocId = behaviorDoc.system?.lightDocId;
	if (!lightDocId) return false;

	const scene = behaviorDoc.parent?.parent ?? canvas.scene;
	const lightDoc = scene?.lights?.get(lightDocId);
	if (!lightDoc) return false;

	const update = { _id: lightDocId };
	for (const key of LIGHT_TOP_LEVEL_EXTRA_KEYS) {
		if (!(key in resolvedExtras)) continue;
		if (foundry.utils.objectsEqual(lightDoc[key], resolvedExtras[key])) continue;
		update[key] = resolvedExtras[key];
	}

	const configUpdate = {};
	for (const key of LIGHT_CONFIG_EXTRA_KEYS) {
		if (!(key in resolvedExtras)) continue;
		if (foundry.utils.objectsEqual(lightDoc.config?.[key], resolvedExtras[key])) continue;
		configUpdate[key] = resolvedExtras[key];
	}
	if (Object.keys(configUpdate).length) update.config = configUpdate;

	if (Object.keys(update).length > 1) {
		await scene.updateEmbeddedDocuments("AmbientLight", [update]);
	}

	if (!foundry.utils.objectsEqual(storedExtras, resolvedExtras)) {
		await behaviorDoc.setFlag("elkan5e", "lightExtras", resolvedExtras);
	}
	return true;
}

export async function deleteRegionLights(regionRef) {
	if (!game.user?.isGM) return;

	const regionDoc =
		typeof regionRef === "string" ? await fromUuid(regionRef).catch(() => null) : regionRef;
	if (!regionDoc) return;

	const lightIds = regionDoc.behaviors
		.filter((behavior) => behavior.type === "midi-qol.regionLight")
		.map((behavior) => behavior.system.lightDocId)
		.filter((lightId) => !!lightId);
	if (!lightIds.length) return;

	const scene = regionDoc.parent ?? canvas.scene;
	const existingLightIds = lightIds.filter((lightId) => scene?.lights?.has(lightId));
	if (!existingLightIds.length) return;

	await scene.deleteEmbeddedDocuments("AmbientLight", existingLightIds);
}

export function registerDaeSpecials(_actorType, specials) {
	const BooleanField = foundry.data.fields.BooleanField;
	const NumberField = foundry.data.fields.NumberField;
	specials["flags.elkan5e.pushResist"] = [
		new BooleanField({
			label: game.i18n.localize("elkan5e.push.effects.pushResist"),
			hint: game.i18n.localize("elkan5e.push.effects.pushResistDescription"),
		}),
		CONST.ACTIVE_EFFECT_MODES.CUSTOM,
	];
	specials["flags.elkan5e.undeadFortitude"] = [
		new BooleanField({
			label: "Undead Fortitude",
			hint: "When enabled, this creature rolls a Constitution saving throw (DC 5 + damage taken) when reduced to 0 HP, dropping to 1 HP on a success.",
		}),
		CONST.ACTIVE_EFFECT_MODES.CUSTOM,
	];
	specials["flags.elkan5e.undeadFortitudeDCModifier"] = [
		new NumberField({
			label: "Undead Fortitude DC Modifier",
			hint: "Added to the Undead Fortitude save DC. Use a negative number to lower the DC.",
			integer: true,
			initial: 0,
		}),
		CONST.ACTIVE_EFFECT_MODES.ADD,
	];
}

export async function handleUpdateMeasuredTemplate(template) {
	const lights = canvas.lighting.placeables.filter(
		(light) => light.document.getFlag("elkan5e", "linkedTemplate") === template.id,
	);
	if (!lights.length) return;
	for (const light of lights) {
		await light.document.update({ x: template.x, y: template.y });
	}
}

export async function handleDeleteMeasuredTemplate(template) {
	const lights = canvas.lighting.placeables.filter(
		(light) => light.document.getFlag("elkan5e", "linkedTemplate") === template.id,
	);
	if (!lights.length) return;
	const ids = lights.map((light) => light.id);
	await canvas.scene.deleteEmbeddedDocuments("AmbientLight", ids);
}

let elkan5eSocket = null;

/**
 * Registers the socketlib socket used to relay GM-only scene mutations
 * (e.g. RegionBehavior creation) from players who lack Scene ownership.
 *
 */
export function registerElkan5eSocket() {
	if (!globalThis.socketlib) {
		console.warn("Elkan 5e | socketlib not found; light spells will require GM ownership.");
		return;
	}
	elkan5eSocket = socketlib.registerModule("elkan5e");
	if (!elkan5eSocket) {
		console.warn(
			"Elkan 5e | socketlib failed to register module socket; light spells will require GM ownership.",
		);
		return;
	}
	elkan5eSocket.register("createLightRegion", applyLightRegion);
}

/**
 * Creates or updates a `midi-qol.regionLight` behavior on the given region.
 * Players don't have owner permission on Scene-embedded documents
 * (Region/RegionBehavior/AmbientLight) by default, so this must run on the
 * GM's client. Callers should use {@link createLightRegion} instead, which
 * relays to the GM via socketlib when the current user isn't one.
 *
 * @param {string} regionUuid - UUID of the Region document.
 * @param {object} config - Light configuration (dim, bright, alpha, etc.).
 * @param {string} name - Behavior name.
 * @returns {Promise<unknown>} The created/updated RegionBehavior document.
 */
async function applyLightRegion(regionUuid, config, name = "Midi Region Light") {
	const regionDoc = await fromUuid(regionUuid).catch(() => null);
	if (!regionDoc) {
		ui.notifications.warn("No region found to attach a light behavior.");
		return null;
	}

	const existingBehavior = regionDoc.behaviors.find(
		(behavior) =>
			behavior.type === "midi-qol.regionLight" &&
			(behavior.getFlag("elkan5e", "createLightRegion") || behavior.name === name),
	);
	const behaviorId = existingBehavior?.id ?? randomString();

	const newExtras = {};
	for (const key of [...LIGHT_TOP_LEVEL_EXTRA_KEYS, ...LIGHT_CONFIG_EXTRA_KEYS]) {
		if (config[key] !== undefined) newExtras[key] = config[key];
	}
	const storedExtras = existingBehavior?.getFlag("elkan5e", "lightExtras") ?? {};
	const extras = { ...storedExtras, ...newExtras };

	// Only dim/bright/color/alpha/luminosity/animation* are part of midi-qol's
	// regionLight behavior schema; everything else the caller wants on the
	// resulting light (sort, negative, priority, angle, darkness range, walls,
	// elevation, rotation, vision) must be stashed as a flag here and pushed
	// onto the AmbientLight by syncRegionLightExtras below — midi-qol silently
	// drops unknown system fields, and the light itself often doesn't exist
	// yet at this point (it's only created once the GM's canvas actually
	// views the region), so the flag is what lets the createRegionBehavior /
	// updateRegionBehavior hooks in elkan5e.mjs re-apply it once it does.
	const behaviorData = {
		_id: behaviorId,
		name,
		type: "midi-qol.regionLight",
		flags: {
			elkan5e: {
				createLightRegion: true,
				lightExtras: extras,
			},
		},
		system: {
			dim: config.dim ?? 20,
			bright: config.bright ?? 10,
			color: config.color ?? null,
			alpha: config.alpha ?? 0.5,
			luminosity: config.luminosity ?? 0.5,
			animationType: config.animation?.type ?? config.animationType ?? null,
			animationSpeed: config.animation?.speed ?? config.animationSpeed ?? 5,
			animationIntensity: config.animation?.intensity ?? config.animationIntensity ?? 5,
		},
	};

	const behaviorDoc = existingBehavior
		? (await regionDoc.updateEmbeddedDocuments("RegionBehavior", [behaviorData]))[0]
		: (await regionDoc.createEmbeddedDocuments("RegionBehavior", [behaviorData]))[0];

	if (Object.keys(extras).length) {
		await syncRegionLightExtras(behaviorDoc, extras);
	}
	return behaviorDoc;
}

/**
 * Creates or updates a light-emitting RegionBehavior on a Region, e.g. for
 * the Light and Daylight spells. Non-GM callers (most players) don't have
 * owner permission on Scene-embedded documents, so this relays the mutation
 * to the active GM's client via socketlib instead of running it locally.
 *
 * @param {string|object} regionRef - Region document or its UUID.
 * @param {object} config - Light configuration (dim, bright, alpha, etc.).
 * @param {string} [name] - Behavior name.
 * @returns {Promise<unknown>} The created/updated RegionBehavior document.
 */
export async function createLightRegion(regionRef, config, name = "Midi Region Light") {
	const regionUuid = typeof regionRef === "string" ? regionRef : regionRef?.uuid;
	if (!regionUuid) {
		ui.notifications.warn("No region found to attach a light behavior.");
		return null;
	}

	if (game.user?.isGM) {
		return applyLightRegion(regionUuid, config, name);
	}

	if (!elkan5eSocket) {
		ui.notifications.warn(
			"Elkan 5e | A GM must be online to apply this light effect (socketlib unavailable).",
		);
		return null;
	}

	return elkan5eSocket.executeAsGM("createLightRegion", regionUuid, config, name);
}
