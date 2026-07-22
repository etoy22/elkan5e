/**
 * Adds a "Use on Short Rest" section to the Short Rest dialog listing every
 * activity on the actor whose activation type is "shortRest" (dnd5e's
 * built-in category for features usable during a short rest), letting the
 * player opt in to using them as part of the rest.
 */

const FLAG_NAME = "shortRestActivations";

/* -------------------------------------------- */

/**
 * Collects activities on the actor usable during a short rest.
 * @param {Actor5e} actor
 * @returns {{activity: Activity, item: Item5e, hasUses: boolean, uses: {value: number, max: number}|null}[]}
 */
function getShortRestActivities(actor) {
	const results = [];
	for (const item of actor.items) {
		for (const activity of item.system?.activities ?? []) {
			if (
				activity.activation?.type?.toLowerCase() === "shortrest" &&
				activity.canUse &&
				activity.target?.affects?.type === "self"
			) {
				const uses = getActivityUses(activity);
				results.push({ activity, item, hasUses: uses ? uses.value > 0 : true, uses });
			}
		}
	}
	return results;
}

/* -------------------------------------------- */

/**
 * Determines the limited-use pool spent by an activity, checking either its
 * own uses or, if it consumes the parent item's uses, the item's pool.
 * @param {Activity} activity
 * @returns {{value: number, max: number}|null} Null if the activity isn't limited-use.
 */
function getActivityUses(activity) {
	if (activity.uses?.max) return { value: activity.uses.value, max: activity.uses.max };

	// Some activities also grant uses to other items (e.g. Rumination feeding
	// Rage); only a target with an empty/self "target" spends the item's own charge.
	const consumesOwnItemUses = activity.consumption?.targets?.some(
		(target) => target.type === "itemUses" && !target.target,
	);
	if (consumesOwnItemUses && activity.item.system.uses?.max) {
		return { value: activity.item.system.uses.value, max: activity.item.system.uses.max };
	}

	return null;
}

/* -------------------------------------------- */

/**
 * Hook callback for "renderShortRestDialog". Injects a checkbox per
 * short-rest-usable activity so the player can choose to trigger it as
 * part of the rest.
 *
 * @param {Application} app
 * @param {HTMLElement|jQuery} html
 */
export function onRenderShortRestDialog(app, html) {
	try {
		const actor = app.actor;
		if (!actor) return;

		const activities = getShortRestActivities(actor);
		if (!activities.length) return;

		const root = html instanceof HTMLElement ? html : html[0];
		if (!root) return;

		const form = root.querySelector("form") ?? root;
		if (form.querySelector("[data-elkan5e-short-rest-activations]")) return;

		const fieldset = document.createElement("fieldset");
		fieldset.dataset.elkan5eShortRestActivations = "true";

		const legend = document.createElement("legend");
		legend.textContent = "Use on Short Rest";
		fieldset.appendChild(legend);

		for (const { activity, item, hasUses, uses } of activities) {
			const formGroup = document.createElement("div");
			formGroup.className = "form-group";

			const label = document.createElement("label");
			label.textContent = item.name;
			formGroup.appendChild(label);

			const formFields = document.createElement("div");
			formFields.className = "form-fields";
			const input = document.createElement("input");
			input.type = "checkbox";
			input.name = `flags.elkan5e.${FLAG_NAME}.${activity.id}`;
			input.disabled = !hasUses;
			formFields.appendChild(input);
			formGroup.appendChild(formFields);

			if (uses) {
				const hint = document.createElement("p");
				hint.className = "hint";
				hint.textContent = hasUses ? `${uses.value} available.` : "Unavailable.";
				formGroup.appendChild(hint);
			}

			fieldset.appendChild(formGroup);
		}

		const footer = form.querySelector(".form-footer, button[type='submit']");
		if (footer) {
			form.insertBefore(fieldset, footer.closest(".form-footer") ?? footer);
		} else {
			form.appendChild(fieldset);
		}
	} catch (error) {
		console.error("Elkan 5e | Error adding short rest activation checkboxes:", error);
	}
}

/* -------------------------------------------- */

/**
 * Called from dnd5e.restCompleted. Triggers any short-rest activities the
 * player checked in the Short Rest dialog.
 *
 * @param {Actor5e} actor
 * @param {object} _result
 * @param {object} config - RestConfiguration, carries the dialog's form data.
 */
export async function onShortRestCompleted(actor, _result, config) {
	const selections = config?.flags?.elkan5e?.[FLAG_NAME];
	if (!selections) return;

	const activities = getShortRestActivities(actor);
	for (const { activity, hasUses } of activities) {
		if (!selections[activity.id] || !hasUses) continue;

		try {
			// Skip the usage configuration dialog so uses/consumption are spent immediately.
			await activity.use({}, { configure: false });
		} catch (error) {
			console.error(`Elkan 5e | Error using short rest activity ${activity.name}:`, error);
		}
	}
}
