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

	// Remove the effect only once its marker effect is gone (e.g. expired after an attack)
	const effect = actor.effects.find((i) => i.name === effectToRemoveLocalized);
	if (effect && !actor.effects.some((i) => i.name === effectToIgnoreLocalized)) {
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
 * Drains an actor: lowers its maximum hit points until it finishes a long rest, using dnd5e's
 * temporary max HP (which a long rest resets). Current hit points drop to fit the new maximum.
 *
 * @param {Actor} actor - Actor being drained.
 * @param {number} damage - Hit points drained.
 * @param {string} [_name] - Unused; kept so existing callers don't change.
 * @param {string} [_img] - Unused; kept so existing callers don't change.
 * @param {string} [_uuid] - Unused; kept so existing callers don't change.
 * @param {boolean} [missing=false] - Only drain up to the hit points the actor is missing.
 * @returns {Promise<void>}
 */
export async function drainedEffect(actor, damage, _name, _img, _uuid, missing = false) {
	const hp = actor?.system?.attributes?.hp;
	if (!hp) return;
	let amount = Math.abs(Number(damage) || 0);
	// Missing HP is measured from the effective maximum, so an already-drained actor isn't overcounted.
	const currentMax = hp.effectiveMax ?? hp.max + (hp.tempmax ?? 0);
	if (missing) amount = Math.min(amount, Math.max(0, currentMax - hp.value));
	if (!amount) return;
	const tempmax = (actor._source.system.attributes.hp.tempmax ?? 0) - amount;
	const effectiveMax = Math.max(0, hp.max + tempmax);
	await updateActorAsGM(actor, {
		"system.attributes.hp.tempmax": tempmax,
		"system.attributes.hp.value": Math.min(hp.value, effectiveMax),
	});
}

/**
 * Ends drain on an actor by restoring the maximum hit points it lost.
 *
 * @param {Actor} actor - Actor to restore.
 * @returns {Promise<boolean>} Whether any maximum hit points were restored.
 */
export async function restoreDrainedMaxHP(actor) {
	const tempmax = actor?._source?.system?.attributes?.hp?.tempmax ?? 0;
	if (tempmax >= 0) return false;
	await updateActorAsGM(actor, { "system.attributes.hp.tempmax": 0 });
	return true;
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
 * Whether an actor is incorporeal (has Incorporeal Movement or an incorporeal trait).
 *
 * @param {Actor5e} actor - Actor to check.
 * @returns {boolean} True if incorporeal.
 */
export const isIncorporeal = (actor) =>
	Boolean(
		actor?.items?.some(
			(i) =>
				i.system?.identifier === "incorporeal-movement" ||
				/incorporeal/i.test(i.name ?? ""),
		) || hasSpecialTrait(actor, "incorporeal"),
	);

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
	// midi-qol's regionLight behavior usually deletes its own light when the region goes away.
	// Wait for that, then only delete lights that are still there, so the same light isn't
	// deleted twice ("AmbientLight ... does not exist!").
	await new Promise((resolve) => setTimeout(resolve, 250));
	const existingLightIds = lightIds.filter((lightId) => scene?.lights?.has(lightId));
	if (!existingLightIds.length) return;

	try {
		await scene.deleteEmbeddedDocuments("AmbientLight", existingLightIds);
	} catch (error) {
		if (!String(error?.message ?? error).includes("does not exist")) throw error;
	}
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
	specials["flags.elkan5e.marksman"] = [
		new BooleanField({
			label: game.i18n.localize("elkan5e.feats.marksman"),
			hint: game.i18n.localize("elkan5e.feats.marksmanHint"),
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
	// Another cleanup (e.g. a region's light behavior) may already be deleting these lights, so
	// re-check they still exist and ignore "does not exist" races.
	const ids = lights.map((light) => light.id).filter((id) => canvas.scene.lights.has(id));
	if (!ids.length) return;
	try {
		await canvas.scene.deleteEmbeddedDocuments("AmbientLight", ids);
	} catch (error) {
		if (!String(error?.message ?? error).includes("does not exist")) throw error;
	}
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
	elkan5eSocket.register("deleteEffects", applyDeleteEffects);
	elkan5eSocket.register("updateActor", applyActorUpdate);
	elkan5eSocket.register("planTeleport", applyPlanTeleport);
	elkan5eSocket.register("offerItemUse", applyOfferItemUse);
	elkan5eSocket.register("applyDamage", applyActorDamage);
	elkan5eSocket.register("createEffects", applyCreateEffects);
	elkan5eSocket.register("rollSkill", applyRollSkill);
	elkan5eSocket.register("addRegionBehavior", applyRegionBehavior);
}

/**
 * The active non-GM owner of an actor, or the active GM when no owning player is online.
 *
 * @param {Actor} actor - Actor to find an owner for.
 * @returns {User|undefined}
 */
const activeOwner = (actor) =>
	game.users.find((u) => u.active && !u.isGM && actor.testUserPermission(u, "OWNER")) ??
	game.users.activeGM;

/**
 * Asks the current user whether to use an item, and spends a use of it (and the actor's reaction,
 * when asked and in combat) if they agree.
 *
 * @param {string} itemUuid - UUID of the item being offered.
 * @param {string} content - Prompt text.
 * @param {boolean} reaction - Whether using the item spends the actor's reaction.
 * @returns {Promise<boolean>} Whether the item was used.
 */
async function applyOfferItemUse(itemUuid, content, reaction) {
	const item = await fromUuid(itemUuid).catch(() => null);
	if (!(item?.system.uses?.value > 0)) return false;
	const confirmed = await foundry.applications.api.DialogV2.confirm({
		window: { title: item.name },
		content: `<p>${content}</p>`,
		rejectClose: false,
		modal: true,
	});
	if (!confirmed) return false;
	await item.update({ "system.uses.spent": item.system.uses.spent + 1 });
	if (reaction && game.combat) await globalThis.MidiQOL?.setReactionUsed?.(item.actor);
	return true;
}

/**
 * Offers an item to its actor's active owning player (or the GM), relaying the prompt to their
 * client when it isn't this one.
 *
 * @param {Item} item - Item being offered.
 * @param {string} content - Prompt text.
 * @param {object} [options]
 * @param {boolean} [options.reaction] - Whether using the item spends the actor's reaction.
 * @returns {Promise<boolean>} Whether the item was used.
 */
export async function offerItemUse(item, content, { reaction = false } = {}) {
	const actor = item?.actor;
	if (!actor) return false;
	const user = activeOwner(actor);
	if (!user) return false;
	if (user.isSelf) return applyOfferItemUse(item.uuid, content, reaction);
	if (!elkan5eSocket) return false;
	return elkan5eSocket.executeAsUser("offerItemUse", user.id, item.uuid, content, reaction);
}

/**
 * Lets the current user place a token anywhere within range as a blink (teleport) move.
 *
 * @param {string} tokenUuid - UUID of the token to move.
 * @param {number} maxDistance - Maximum distance in scene units.
 * @param {string} [action] - Movement action to plan with.
 * @returns {Promise<void>}
 */
async function applyPlanTeleport(tokenUuid, maxDistance, action = "blink") {
	const tokenDoc = await fromUuid(tokenUuid).catch(() => null);
	const token = tokenDoc?.object;
	if (!token?.planMovement) return;
	const plan = await token.planMovement({
		allowedActions: [action],
		direct: true,
		maxDistance,
		preventDrop: true,
	});
	if (plan) await tokenDoc.startMovement(plan.id);
}

/**
 * Asks the token's active owning player (or the GM) to place the token within range.
 *
 * @param {TokenDocument} tokenDoc - Token to move.
 * @param {number} maxDistance - Maximum distance in scene units.
 * @param {string} [action] - Movement action: "blink" teleports, "displace" is a forced move.
 * @returns {Promise<void>}
 */
export function planTeleportForOwner(tokenDoc, maxDistance, action = "blink") {
	const actor = tokenDoc?.actor;
	if (!actor) return null;
	const user = activeOwner(actor);
	if (!user || user.isSelf || !elkan5eSocket) {
		return applyPlanTeleport(tokenDoc.uuid, maxDistance, action);
	}
	return elkan5eSocket.executeAsUser("planTeleport", user.id, tokenDoc.uuid, maxDistance, action);
}

/**
 * Deletes effects from an actor, skipping any that no longer exist.
 *
 * @param {string} actorUuid - UUID of the actor.
 * @param {string[]} effectIds - Ids of the effects to delete.
 * @returns {Promise<void>}
 */
async function applyDeleteEffects(actorUuid, effectIds) {
	const actor = await relayedActor(this?.socketdata, actorUuid);
	if (!actor || !Array.isArray(effectIds)) return;
	const ids = effectIds.filter((id) => actor.effects.has(id));
	if (ids.length) await actor.deleteEmbeddedDocuments("ActiveEffect", ids);
}

// Actor fields, and update options, a player may change through the GM relay on an actor they
// don't own. Anything else sent over the socket is refused.
const RELAYED_ACTOR_FIELDS = new Set([
	"system.attributes.hp.value",
	"system.attributes.hp.temp",
	"system.attributes.hp.tempmax",
	"system.attributes.exhaustion",
]);
const RELAYED_UPDATE_OPTIONS = new Set(["elkan5eSpiritLink"]);

/**
 * Resolves the actor a GM-side handler acts on. Requests relayed over the socket must come from
 * an active user and name an Actor; any other document type is refused.
 *
 * @param {object|undefined} socketdata - socketlib caller data; undefined when run locally.
 * @param {string} actorUuid - UUID of the actor.
 * @returns {Promise<Actor|null>}
 */
async function relayedActor(socketdata, actorUuid) {
	if (socketdata && !game.users.get(socketdata.userId)?.active) {
		console.warn("Elkan 5e | Refused a relayed request from an unknown user.");
		return null;
	}
	const doc = typeof actorUuid === "string" ? await fromUuid(actorUuid).catch(() => null) : null;
	if (doc?.documentName === "Actor") return doc;
	if (socketdata)
		console.warn(`Elkan 5e | Refused a relayed request for non-actor ${actorUuid}.`);
	return null;
}

/**
 * Applies an update to an actor. Relayed updates may only change RELAYED_ACTOR_FIELDS.
 *
 * @param {string} actorUuid - UUID of the actor.
 * @param {object} data - Update data.
 * @returns {Promise<void>}
 */
async function applyActorUpdate(actorUuid, data, options = {}) {
	const socketdata = this?.socketdata;
	const actor = await relayedActor(socketdata, actorUuid);
	if (!actor) return;
	if (socketdata) {
		const keys = Object.keys(foundry.utils.flattenObject(data ?? {}));
		const optionKeys = Object.keys(options ?? {});
		const refused = [
			...keys.filter((k) => !RELAYED_ACTOR_FIELDS.has(k)),
			...optionKeys.filter((k) => !RELAYED_UPDATE_OPTIONS.has(k)),
		];
		if (!keys.length || refused.length) {
			console.warn(`Elkan 5e | Refused a relayed update to ${actor.name}:`, refused);
			return;
		}
	}
	await actor.update(data, options);
}

/**
 * Runs a GM-only mutation locally when the current user owns the actor, otherwise relays it to the GM.
 *
 * @param {string} handler - Registered socket handler name.
 * @param {Function} local - Local implementation.
 * @param {Actor} actor - Actor being mutated.
 * @param {...*} args - Extra handler arguments.
 * @returns {Promise<*>} Handler result.
 */
function runForActor(handler, local, actor, ...args) {
	if (actor.isOwner) return local(actor.uuid, ...args);
	if (!elkan5eSocket) {
		ui.notifications.warn(
			`Elkan 5e | You don't own ${actor.name}, and socketlib isn't available to ask the GM.`,
		);
		return null;
	}
	return elkan5eSocket.executeAsGM(handler, actor.uuid, ...args);
}

/**
 * Deletes effects from an actor, relaying to the GM if the user doesn't own it.
 *
 * @param {Actor} actor - Actor to clear.
 * @param {ActiveEffect[]} effects - Effects on that actor to delete.
 * @returns {Promise<void>}
 */
export function deleteEffects(actor, effects) {
	return runForActor(
		"deleteEffects",
		applyDeleteEffects,
		actor,
		effects.map((e) => e.id),
	);
}

/**
 * The effects giving an actor one of the given conditions. A condition switched on by another
 * effect's macro.StatusEffect is returned as that effect, so ending it doesn't leave the source
 * behind.
 *
 * @param {Actor} actor - Actor to search.
 * @param {string[]} statusIds - Status ids to look for.
 * @returns {ActiveEffect[]}
 */
export function conditionSources(actor, statusIds) {
	const effects = new Set();
	for (const e of actor?.effects ?? []) {
		if (e.disabled || !statusIds.some((id) => e.statuses?.has(id))) continue;
		const dependentOn = e.getFlag("dnd5e", "dependentOn");
		const source = dependentOn ? fromUuidSync(dependentOn, { strict: false }) : null;
		effects.add(source?.parent === actor ? source : e);
	}
	return [...effects];
}

/**
 * Removes every effect carrying one of the given conditions from an actor, relaying to the GM
 * if the user doesn't own it.
 *
 * @param {Actor} actor - Actor to clear.
 * @param {string[]} statusIds - Status ids to remove.
 * @returns {Promise<string[]>} Names of the removed effects.
 */
export async function removeStatuses(actor, statusIds) {
	const effects = conditionSources(actor, statusIds);
	if (effects.length) await deleteEffects(actor, effects);
	const removed = effects.map((e) => e.name);
	if (
		statusIds.includes("drained") &&
		(await restoreDrainedMaxHP(actor)) &&
		!removed.includes("Drained")
	) {
		removed.push("Drained");
	}
	return removed;
}

/**
 * Updates an actor, relaying to the GM if the user doesn't own it.
 *
 * @param {Actor} actor - Actor to update.
 * @param {object} data - Update data.
 * @param {object} [options] - Update options passed to the update.
 * @returns {Promise<void>}
 */
export function updateActorAsGM(actor, data, options = {}) {
	return runForActor("updateActor", applyActorUpdate, actor, data, options);
}

/**
 * Applies damage or healing to an actor.
 *
 * @param {string} actorUuid - UUID of the actor.
 * @param {object[]} damages - dnd5e damage descriptions ({ value, type }).
 * @returns {Promise<void>}
 */
async function applyActorDamage(actorUuid, damages) {
	const actor = await relayedActor(this?.socketdata, actorUuid);
	if (!actor || !Array.isArray(damages)) return;
	await actor.applyDamage(damages);
}

/**
 * Applies damage or healing to an actor, relaying to the GM if the user doesn't own it.
 *
 * @param {Actor} actor - Actor to damage or heal.
 * @param {object[]} damages - dnd5e damage descriptions ({ value, type }).
 * @returns {Promise<void>}
 */
export function applyDamageAsGM(actor, damages) {
	return runForActor("applyDamage", applyActorDamage, actor, damages);
}

/**
 * Creates effects on an actor.
 *
 * @param {string} actorUuid - UUID of the actor.
 * @param {object[]} effects - ActiveEffect create data.
 * @returns {Promise<void>}
 */
async function applyCreateEffects(actorUuid, effects) {
	const actor = await relayedActor(this?.socketdata, actorUuid);
	if (!actor || !Array.isArray(effects)) return;
	await actor.createEmbeddedDocuments("ActiveEffect", effects);
}

/**
 * Creates effects on an actor, relaying to the GM if the user doesn't own it.
 *
 * @param {Actor} actor - Actor to receive the effects.
 * @param {object[]} effects - ActiveEffect create data.
 * @returns {Promise<void>}
 */
export function createEffectsAsGM(actor, effects) {
	return runForActor("createEffects", applyCreateEffects, actor, effects);
}

/**
 * Rolls a skill check for an actor without a configuration dialog.
 *
 * @param {string} actorUuid - UUID of the actor.
 * @param {string} skill - Skill id.
 * @param {boolean} advantage - Whether the check has advantage.
 * @param {string} [flavor] - Chat flavor text.
 * @returns {Promise<number|null>} The roll total.
 */
async function applyRollSkill(actorUuid, skill, advantage, flavor) {
	const actor = await fromUuid(actorUuid).catch(() => null);
	const rolls = await actor?.rollSkill(
		{ skill, advantage },
		{ configure: false },
		flavor ? { data: { flavor } } : {},
	);
	return rolls?.[0]?.total ?? null;
}

/**
 * Has an actor's active owning player (or the GM) roll one of its skill checks.
 *
 * @param {Actor} actor - Actor rolling.
 * @param {string} skill - Skill id.
 * @param {object} [options]
 * @param {boolean} [options.advantage] - Whether the check has advantage.
 * @param {string} [options.flavor] - Chat flavor text.
 * @returns {Promise<number|null>} The roll total.
 */
export function rollSkillForOwner(actor, skill, { advantage = false, flavor } = {}) {
	const user = activeOwner(actor);
	if (!user || user.isSelf || !elkan5eSocket) {
		return applyRollSkill(actor.uuid, skill, advantage, flavor);
	}
	return elkan5eSocket.executeAsUser("rollSkill", user.id, actor.uuid, skill, advantage, flavor);
}

const combatTurnKey = () => `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;

/**
 * Checks whether a once-per-turn feature was already used this turn. Always false outside combat.
 *
 * @param {Actor} actor - Actor using the feature.
 * @param {string} flag - Flag key that stores the last turn it was used.
 * @returns {boolean}
 */
export const usedThisTurn = (actor, flag) =>
	Boolean(game.combat) && actor.getFlag("elkan5e", flag) === combatTurnKey();

/**
 * Records that a once-per-turn feature was used this turn. Does nothing outside combat.
 *
 * @param {Actor} actor - Actor using the feature.
 * @param {string} flag - Flag key that stores the last turn it was used.
 * @returns {Promise<void>}
 */
export async function markUsedThisTurn(actor, flag) {
	if (game.combat) await actor.setFlag("elkan5e", flag, combatTurnKey());
}

/**
 * Gets the token actors the current user is targeting.
 *
 * @returns {Actor[]} Targeted actors.
 */
export const targetedActors = () =>
	Array.from(game.user?.targets ?? [])
		.map((token) => token.actor)
		.filter(Boolean);

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

// Region behaviors a player may ask the GM to add, by key. The relay only takes the key, never
// behavior data, so it can't be used to add arbitrary scripts.
const RELAYED_REGION_BEHAVIORS = {
	spikeGrowth: {
		name: "Spike Growth — Movement Damage",
		type: "executeScript",
		system: {
			events: ["tokenMoveWithin"],
			source: "await elkan5e.macros.spells.spikeGrowthMove(event, region);",
		},
	},
};

/**
 * Adds one of RELAYED_REGION_BEHAVIORS to a region, unless it already has it.
 *
 * @param {string} regionUuid - UUID of the region.
 * @param {string} key - Key in RELAYED_REGION_BEHAVIORS.
 * @returns {Promise<void>}
 */
async function applyRegionBehavior(regionUuid, key) {
	const data = Object.hasOwn(RELAYED_REGION_BEHAVIORS, key)
		? RELAYED_REGION_BEHAVIORS[key]
		: null;
	const region =
		typeof regionUuid === "string" ? await fromUuid(regionUuid).catch(() => null) : null;
	if (!data || region?.documentName !== "Region") return;
	if (region.behaviors.some((b) => b.name === data.name)) return;
	await region.createEmbeddedDocuments("RegionBehavior", [foundry.utils.deepClone(data)]);
}

/**
 * Adds one of RELAYED_REGION_BEHAVIORS to a region, relaying to the GM when the user can't
 * change the scene.
 *
 * @param {RegionDocument|string} regionRef - Region or its UUID.
 * @param {string} key - Key in RELAYED_REGION_BEHAVIORS.
 * @returns {Promise<void>}
 */
export async function addRegionBehaviorAsGM(regionRef, key) {
	const regionUuid = typeof regionRef === "string" ? regionRef : regionRef?.uuid;
	if (!regionUuid) return;
	if (game.user?.isGM) return applyRegionBehavior(regionUuid, key);
	if (!elkan5eSocket) {
		ui.notifications.warn(
			"Elkan 5e | A GM must be online to apply this region effect (socketlib unavailable).",
		);
		return;
	}
	return elkan5eSocket.executeAsGM("addRegionBehavior", regionUuid, key);
}

/**
 * Returns a copy of a set of tokens without the given tokens, matched by document uuid.
 *
 * @param {Iterable<Token>} tokens - Tokens to filter.
 * @param {Token[]} remove - Tokens to leave out.
 * @returns {Set<Token>}
 */
export function withoutTokens(tokens, remove) {
	const uuids = new Set(remove.map((t) => t?.document?.uuid ?? t?.uuid));
	return new Set([...(tokens ?? [])].filter((t) => !uuids.has(t?.document?.uuid ?? t?.uuid)));
}

/**
 * Removes creatures from a midi-qol workflow so they don't roll saves or take its damage or
 * effects. Midi-QOL rebuilds its target sets from stored uuids (and can re-read the user's
 * targets) later in the workflow, so the tokens are also untargeted and remembered on the
 * workflow; {@link enforceExcludedTargets} removes them again before saves.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @param {Token[]} tokens - Tokens to exclude.
 * @returns {void}
 */
export function excludeTargets(workflow, tokens) {
	if (!workflow || !tokens?.length) return;
	workflow.elkan5eExcludedTargets = [...(workflow.elkan5eExcludedTargets ?? []), ...tokens];
	for (const token of tokens) {
		const placeable = token?.object ?? token;
		if (placeable?.isTargeted) placeable.setTarget(false, { releaseOthers: false });
	}
	enforceExcludedTargets(workflow);
}

/**
 * Re-applies {@link excludeTargets} to a workflow's target sets.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {void}
 */
export function enforceExcludedTargets(workflow) {
	const excluded = workflow?.elkan5eExcludedTargets;
	if (!excluded?.length) return;
	for (const key of ["targets", "hitTargets", "hitTargetsEC", "failedSaves"]) {
		if (workflow[key]) workflow[key] = withoutTokens(workflow[key], excluded);
	}
}
