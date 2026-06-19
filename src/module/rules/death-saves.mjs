/**
 * Tracks the rest type currently being applied so preUpdateActor can
 * decide whether to allow death save clearing during a rest update.
 * Set by onPreRestCompleted and cleared by onRestCompleted.
 * @type {"short"|"long"|null}
 */
let currentRestType = null;

/* -------------------------------------------- */

/**
 * Called from dnd5e.preRestCompleted.
 * Records whether a short or long rest is about to be applied so the
 * preUpdateActor guard can make the right choice.
 *
 * @param {Actor5e} _actor
 * @param {object} result - dnd5e rest result; result.longRest distinguishes type.
 */
export function onPreRestCompleted(_actor, result) {
	currentRestType = result?.longRest ? "long" : "short";
}

/* -------------------------------------------- */

/**
 * Called from dnd5e.restCompleted.
 *
 * @param {Actor5e} actor
 * @param {object} _result
 * @returns {Promise<void>}
 */
export async function onRestCompleted(actor, _result) {
	const wasShortRest = currentRestType === "short";
	const wasLongRest = currentRestType === "long";
	currentRestType = null;

	const setting = game.settings.get("elkan5e", "deathSaveClear");
	if (setting === "immediate") return;

	const death = actor.system?.attributes?.death;
	const hasSaves = (death?.success ?? 0) > 0 || (death?.failure ?? 0) > 0;
	if (!hasSaves) return;

	const shouldClear =
		(setting === "shortRest" && (wasShortRest || wasLongRest)) ||
		(setting === "longRest" && wasLongRest);

	if (!shouldClear) return;

	// The elkan5eDeathSaveClear flag tells onPreUpdateActorDeathSaves to
	// let this specific update through without re-blocking it.
	await actor.update(
		{ "system.attributes.death.success": 0, "system.attributes.death.failure": 0 },
		{ isRest: true, elkan5eDeathSaveClear: true },
	);
}

/* -------------------------------------------- */

/**
 * Called from preUpdateActor.
* @param {Actor5e} actor
 * @param {object} changes - Mutable update data passed to actor.update().
 * @param {object} options - Update options from actor.update().
 */
export function onPreUpdateActorDeathSaves(actor, changes, options) {
	const setting = game.settings.get("elkan5e", "deathSaveClear");
	if (setting === "immediate") return;

	// Our own manual rest-triggered clear — always allow.
	if (options?.elkan5eDeathSaveClear) return;

	// Handle rest updates separately from normal healing.
	if (options?.isRest) {
		if (setting === "shortRest") return; // Both short and long rests may clear.
		if (setting === "longRest") {
			if (currentRestType === "long") return; // Long rest is allowed.
			// Short rest with longRest setting — strip any death save clearing.
			_stripDeathSaveFields(changes);
		}
		return;
	}

	// Normal (non-rest) update: only act when HP is going from ≤ 0 to positive,
	// which is the same condition dnd5e's preUpdateHP uses to inject the clear.
	const currentHp = actor.system?.attributes?.hp?.value ?? 0;
	const newHp = foundry.utils.getProperty(changes, "system.attributes.hp.value");
	if (currentHp > 0 || newHp === undefined || newHp <= 0) return;

	_stripDeathSaveFields(changes);
	console.log(`Elkan 5e | Death saves preserved on HP recovery (setting: ${setting})`);
}

/* -------------------------------------------- */

/**
 * Removes death save fields from a changes object, handling both nested
 * object form and flat dot-notation key form.
 *
 * @param {object} changes
 */
function _stripDeathSaveFields(changes) {
	if (changes?.system?.attributes?.death !== undefined) {
		delete changes.system.attributes.death;
	}
	if ("system.attributes.death.success" in changes) {
		delete changes["system.attributes.death.success"];
	}
	if ("system.attributes.death.failure" in changes) {
		delete changes["system.attributes.death.failure"];
	}
}
