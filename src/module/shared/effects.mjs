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
 * Shared helper for for Each Damaged Target.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @param {*} callback - Callback.
 * @returns {Promise<void>} Promise resolution result.
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
 * Shared helper for has Special Trait.
 *
 * @param {*} actor - Actor document to process.
 * @param {*} trait - Trait.
 * @returns {unknown} Operation result.
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
 * @returns {unknown} Operation result.
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
 * @returns {unknown} Operation result.
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
