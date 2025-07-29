/**
 * Handle the removal of an effect and its associated item.
 *
 * @param {object} effect - The effect object to be processed.
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
	endMessage
) {
	if (effect.name === game.i18n.localize(effectName)) {
		const actor = effect.parent;
		const item = actor.items.find(
			(item) => item.name === game.i18n.localize(itemName)
		);
		if (item) {
			const itemDescription = item.system.description.value
				.replace(game.i18n.localize(descriptionPrefix), "")
				.trim();
			const chatMessageData = {
				user: game.user.id,
				speaker: ChatMessage.getSpeaker({ actor: actor }),
				content: `<p>${itemDescription}</p><p>${game.i18n.localize(
					endMessage
				)}</p>`,
			};
			ChatMessage.create(chatMessageData);
			await item.delete();
		}
	}
}

/**
 * Handle the removal of an effect associated with an item.
 *
 * @param {object} item - The item object to be processed.
 * @param {string} itemName - The localized name of the item to check.
 * @param {string} effectName - The localized name of the effect to find.
 * @returns {Promise<void>} A promise that resolves when the item has been processed.
 */
export async function deletedItemRemovesEffect(item, itemName, effectName) {
	if (item.name === game.i18n.localize(itemName)) {
		const actor = item.parent;
		const effect = actor.effects.find(
			(e) => e.name === game.i18n.localize(effectName)
		);
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
 * @param {object} actor - The actor object to be processed.
 * @param {string} effectToRemove - The localized name of the effect to remove.
 * @param {string} effectToIgnore - The localized name of the effect to ignore.
 * @param {string[]} additionalEffectsToRemove - An array of localized names of additional effects to remove.
 * @returns {Promise<void>} A promise that resolves when the effects have been processed.
 */
export async function deleteEffectRemoveEffect(
	actor,
	effectToRemove,
	effectToIgnore,
	additionalEffectsToRemove
) {
	const effectToRemoveLocalized = game.i18n.localize(effectToRemove);
	const effectToIgnoreLocalized = game.i18n.localize(effectToIgnore);
	const additionalEffectsToRemoveLocalized = additionalEffectsToRemove.map(
		(effect) => game.i18n.localize(effect)
	);

	// Find the effect to remove
	const effect = actor.effects.find((i) => i.name === effectToRemoveLocalized);
	if (effect && actor.effects.find((i) => i.name !== effectToIgnoreLocalized)) {
		// Delete the effect to remove
		await effect.delete();

		// Find and delete any additional effects to remove
		const additionalEffects = actor.effects.filter((i) =>
			additionalEffectsToRemoveLocalized.includes(i.name)
		);
		for (const additionalEffect of additionalEffects) {
			await additionalEffect.delete();
		}
	}
}

export async function drainedEffect(actor, damage, name, img, uuid) {
	const effectName = name || "Drained";
	const effectImg = img || "modules/elkan5e/icons/drained.svg";
	const effectOrigin = uuid || null;

	const existingEffect = actor.effects.find(e =>
		e.name === effectName &&
		e.img === effectImg &&
		e.origin === effectOrigin
	);

	const newValue = -Math.abs(damage); // Ensure negative number

	if (existingEffect) {
		const updatedChanges = existingEffect.changes.map(change => {
			if (change.key === "system.attributes.hp.tempmax") {
				// Parse the old value (as string), add newValue
				const oldVal = parseFloat(change.value) || 0;
				const combinedValue = oldVal + newValue;

				return {
					...change,
					value: combinedValue.toString()
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
