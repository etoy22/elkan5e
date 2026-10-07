// Vision-based automation: attacking an unseen target imposes disadvantage.

/**
 * Runs on midi-qol.preAttackRollConfig (after midi-qol's own advantage/disadvantage
 * recompute, so this isn't reset): forces disadvantage on the attack whenever
 * the attacker cannot see the target (per midi-qol's vision-based canSee,
 * which accounts for darkvision, magical darkness, and walls).
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function darknessAttackDisadvantage(workflow) {
	try {
		const canSee = globalThis.MidiQOL?.canSee;
		if (typeof canSee !== "function") return;

		const attackerToken = workflow?.token;
		if (!attackerToken) return;

		for (const targetEntry of workflow.targets ?? []) {
			const targetToken = targetEntry?.document?.object ?? targetEntry?.object ?? targetEntry;
			if (!targetToken) continue;
			if (canSee(attackerToken, targetToken)) continue;

			workflow.attackRollModifierTracker?.disadvantage?.add("Unseen Target");
		}
	} catch (error) {
		console.error("Elkan 5e | Error in darknessAttackDisadvantage:", error);
	}
}

// Vision source priority granted by flags.elkan5e.seeThroughDarkness. Core only blinds a vision
// source (and only clips its line of sight) with darkness sources of equal or higher priority, so
// this sees through spell darkness (priority = spell level - 1) within the token's sight range.
const SEE_THROUGH_DARKNESS_PRIORITY = 10;
const SEE_THROUGH_DARKNESS_KEY = "flags.elkan5e.seeThroughDarkness";

/**
 * Lets tokens whose actor has flags.elkan5e.seeThroughDarkness (e.g. Eyes of Shade) see through
 * magical darkness. Runs on init.
 */
export function registerSeeThroughDarkness() {
	try {
		const wrapper = function (wrapped, ...args) {
			const data = wrapped(...args);
			if (this.actor?.getFlag("elkan5e", "seeThroughDarkness")) {
				data.priority = Math.max(data.priority ?? 0, SEE_THROUGH_DARKNESS_PRIORITY);
			}
			return data;
		};
		if (game.modules.get("lib-wrapper")?.active && globalThis.libWrapper) {
			globalThis.libWrapper.register(
				"elkan5e",
				"CONFIG.Token.objectClass.prototype._getVisionSourceData",
				wrapper,
				"WRAPPER",
			);
		} else {
			const Token = CONFIG.Token.objectClass;
			const getVisionSourceData = Token.prototype._getVisionSourceData;
			Token.prototype._getVisionSourceData = function (...args) {
				return wrapper.call(this, getVisionSourceData.bind(this), ...args);
			};
		}
	} catch (error) {
		console.warn("Elkan 5e | Failed to register see through darkness vision:", error);
	}
}

/**
 * Re-initializes token vision when an effect granting or removing see through darkness changes.
 *
 * @param {ActiveEffect} effect - Effect that was created, updated or deleted.
 */
export function refreshSeeThroughDarkness(effect) {
	if (!canvas?.ready) return;
	const changes = effect?.system?.changes ?? effect?.changes ?? [];
	if (!changes.some((c) => c.key === SEE_THROUGH_DARKNESS_KEY)) return;
	canvas.perception.update({ initializeVision: true });
}

/**
 * Checks whether a token is standing in bright light: inside the bright radius of a light source,
 * or under bright global illumination, and not inside a darkness source.
 *
 * @param {TokenDocument} tokenDoc - Token to test.
 * @returns {boolean}
 */
export function isInBrightLight(tokenDoc) {
	if (!canvas?.ready || tokenDoc?.parent !== canvas.scene) return false;
	const point = tokenDoc.getVisionOrigin();
	const effects = canvas.effects;
	if (effects.testInsideDarkness(point)) return false;

	const GlobalLightSource = foundry.canvas.sources.GlobalLightSource;
	for (const source of effects.lightSources) {
		if (!source.active || !(source.data.bright > 0)) continue;
		if (source instanceof GlobalLightSource) {
			const { min, max } = source.data.darkness;
			const level = effects.getDarknessLevel(point);
			if (level >= min && level <= max) return true;
			continue;
		}
		const distance = Math.hypot(point.x - source.x, point.y - source.y);
		if (distance <= source.data.bright && source.testPoint(point)) return true;
	}
	return false;
}
