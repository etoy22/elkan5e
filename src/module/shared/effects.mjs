/**
 * Handle the removal of an effect and its associated item.
 *
 * @param {ActiveEffect} effect - The effect object to be processed.
 * @param {string} effectName - The localized name of the effect to check.
 * @param {string} itemName - The localized name of the item to find.
 * @param {string} descriptionPrefix - The prefix to remove from the item's description.
 * @param {string} endMessage - The message to display when the effect ends.
 * @returns {Promise<void>} A promise that resolves when the effect has been processed.
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
 * Handle the removal of an effect associated with an item.
 *
 * @param {Item} item - The item object to be processed.
 * @param {string} itemName - The localized name of the item to check.
 * @param {string} effectName - The localized name of the effect to find.
 * @returns {Promise<void>} A promise that resolves when the item has been processed.
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
 * Handle the removal of a specific effect if another effect is present.
 *
 * This function checks if the actor has the `effectToRemove` active.
 * If the actor also has any other effect that is not `effectToIgnore`,
 * the `effectToRemove` will be deleted. Additionally, if the actor has
 * any of the `additionalEffectsToRemove`, they will also be deleted.
 *
 * @param {Actor} actor - The actor object to be processed.
 * @param {string} effectToRemove - The localized name of the effect to remove.
 * @param {string} effectToIgnore - The localized name of the effect to ignore.
 * @param {string[]} additionalEffectsToRemove - An array of localized names of additional effects to remove.
 * @returns {Promise<void>} A promise that resolves when the effects have been processed.
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
 * Apply or update a drained effect on an actor, reducing temp HP maximum.
 *
 * @param {Actor} actor - The actor receiving the drained effect.
 * @param {number} damage - Amount of damage to convert into temp HP reduction.
 * @param {string} [name="Drained"] - Optional custom effect name.
 * @param {string} [img="modules/elkan5e/icons/drained.svg"] - Effect image path.
 * @param {string} [uuid] - Origin UUID for the effect.
 */
export async function drainedEffect(actor, damage, name, img, uuid) {
	const effectName = name || "Drained";
	const effectImg = img || "modules/elkan5e/icons/drained.svg";
	const effectOrigin = uuid || null;

	const existingEffect = actor.effects.find(
		(e) => e.name === effectName && e.img === effectImg && e.origin === effectOrigin,
	);

	const newValue = -Math.abs(damage); // Ensure negative number

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
					specialDuration: ["longRest"],
				},
			},
		};
		await actor.createEmbeddedDocuments("ActiveEffect", [drained]);
	}
}

/**
 * Loop every entry in workflow.damageList, skip non-damage or missing targets,
 * resolve each Token, and invoke your callback(token, damage, savedFlag).
 *
 * @param {object} workflow - Workflow containing damageList entries.
 * @param {(token: Token, damage: number, saved: boolean) => Promise<void>|void} callback - Function executed for each damaged target.
 */
export async function forEachDamagedTarget(workflow, callback) {
	for (const { targetUuid, tempDamage = 0, hpDamage = 0, saved = false } of workflow.damageList) {
		const dmg = tempDamage + hpDamage;
		if (dmg <= 0 || !targetUuid) continue;
		const parts = targetUuid.split(".");
		const token = canvas.tokens.get(parts.at(-1));
		if (!token) continue;
		// Guarantee we're awaiting a Promise
		await Promise.resolve(callback(token, dmg, saved));
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
 * Get a skill total or fallback modifier for a skill key.
 * @param {Actor} actor
 * @param {string} key
 * @returns {number}
 */
export const getSkillTotal = (actor, key) =>
	Number(actor?.system?.skills?.[key]?.total ?? actor?.system?.skills?.[key]?.mod ?? 0);

/**
 * Choose the defender's better skill between Athletics and Acrobatics.
 * @param {Actor} actor
 * @returns {"ath"|"acr"}
 */
export const chooseDefenderSkill = (actor) => {
	const ath = getSkillTotal(actor, "ath");
	const acr = getSkillTotal(actor, "acr");
	return acr > ath ? "acr" : "ath";
};

/**
 * Get size index for an actor, applying Powerful Build if present.
 * @param {Actor} actor
 * @returns {number}
 */
export const sizeIndex = (actor) => {
	const size = actor?.system?.traits?.size ?? "med";
	const idx = SIZE_ORDER.indexOf(size);
	const base = idx === -1 ? SIZE_ORDER.indexOf("med") : idx;
	const powerfulBuild = hasSpecialTrait(actor, "powerful build");
	const result = powerfulBuild ? Math.min(base + 1, SIZE_ORDER.length - 1) : base;
	console.log(
		`Elkan 5e | sizeIndex actor="${actor?.name ?? "Unknown"}" size="${size}" base=${base} powerfulBuild=${powerfulBuild} result=${result}`,
	);
	return result;
};

/**
 * Check whether an actor has a special trait by name.
 * Supports system traits, custom text, or module flags.
 * @param {Actor} actor
 * @param {string} trait
 * @returns {boolean}
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
 * Check whether an actor is currently blocked from being pushed.
 * Supports actor flags and ActiveEffect changes.
 * @param {Actor} actor
 * @returns {boolean}
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
 * Check whether an actor has resistance to push contests.
 * `flags.elkan5e.pushResist` grants advantage when resisting `push(...)`.
 * @param {Actor} actor
 * @returns {boolean}
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
