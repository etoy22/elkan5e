// Vision-based automation: attacking an unseen target imposes disadvantage,
// and standing somewhere with no usable vision (e.g. inside magical darkness
// no darkvision can penetrate) auto-applies the Blinded condition.

const BLINDED_BY_DARKNESS_FLAG = "blindedByDarkness";

/**
 * Tests whether a token can see its own space, considering only that
 * token's own vision source (isolated from every other token's vision).
 * Magical darkness (e.g. the Darkness spell's light region) suppresses
 * basic sight and darkvision within it, so a token standing inside one
 * with no other applicable sense will fail this test.
 *
 * @param {Token} token - Canvas token to test.
 * @returns {boolean} Whether the token can see its own space.
 */
export function tokenCanSeeOwnSpace(token) {
	const vision = token?.vision;
	const visionSources = canvas.effects?.visionSources;
	if (!vision || !visionSources) return true;

	const backup = new Map(visionSources);
	try {
		visionSources.clear();
		visionSources.set(token.sourceId, vision);
		return canvas.effects.visibility.testVisibility(token.center, {
			tolerance: 0,
			object: token,
		});
	} finally {
		visionSources.clear();
		for (const [key, value] of backup) visionSources.set(key, value);
	}
}

/**
 * Syncs the Blinded condition on a token to whether it can currently see
 * its own space, only ever adding/removing the condition that this
 * automation itself applied (a manually-applied Blinded stays untouched).
 *
 * @param {Token} token - Canvas token to sync.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function syncBlindedByDarkness(token) {
	if (!game.user?.isGM) return;
	const actor = token?.actor;
	if (!actor || !token.document?.sight?.enabled) return;

	const rulesEnabled = game.settings.get("elkan5e", "darknessVisionRules");
	const blindedAlready = actor.statuses?.has("blinded");
	const appliedByUs = Boolean(actor.getFlag("elkan5e", BLINDED_BY_DARKNESS_FLAG));
	const blindNow = rulesEnabled && !tokenCanSeeOwnSpace(token);

	if (blindNow && !blindedAlready) {
		await actor.toggleStatusEffect("blinded", { active: true });
		await actor.setFlag("elkan5e", BLINDED_BY_DARKNESS_FLAG, true);
	} else if (!blindNow && blindedAlready && appliedByUs) {
		await actor.toggleStatusEffect("blinded", { active: false });
		await actor.unsetFlag("elkan5e", BLINDED_BY_DARKNESS_FLAG);
	}
}

let syncQueued = false;

/**
 * Queues a blinded-by-darkness sync for every token on the canvas, coalescing
 * bursts of vision recalculation (movement, lighting changes) into one pass.
 *
 */
export function queueBlindedByDarknessSync() {
	if (!game.user?.isGM || syncQueued) return;
	syncQueued = true;
	window.requestAnimationFrame(() => {
		syncQueued = false;
		for (const token of canvas?.tokens?.placeables ?? []) {
			syncBlindedByDarkness(token).catch((error) =>
				console.error("Elkan 5e | Failed to sync blinded-by-darkness", error),
			);
		}
	});
}

/**
 * Runs on midi-qol.preAttackRoll: forces disadvantage on the attack whenever
 * the attacker cannot see the target (per midi-qol's vision-based canSee,
 * which accounts for darkvision, magical darkness, and walls).
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function darknessAttackDisadvantage(workflow) {
	try {
		if (!game.settings.get("elkan5e", "darknessVisionRules")) return;

		const canSee = globalThis.MidiQOL?.canSee;
		if (typeof canSee !== "function") return;

		const attackerToken = workflow?.token;
		if (!attackerToken) return;

		for (const targetEntry of workflow.targets ?? []) {
			const targetToken = targetEntry?.document?.object ?? targetEntry?.object ?? targetEntry;
			if (!targetToken) continue;
			if (canSee(attackerToken, targetToken)) continue;

			workflow.disadvantage = true;
			workflow.attackAdvAttribution?.add?.("Elkan 5e: target obscured by darkness");
		}
	} catch (error) {
		console.error("Elkan 5e | Error in darknessAttackDisadvantage:", error);
	}
}
