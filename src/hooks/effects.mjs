import { delayedDuration } from "../module/classes/index.mjs";
import * as Spells from "../module/spells/index.mjs";

export function registerEffectHooks() {
	// Active effect deletion hooks
	Hooks.on("deleteActiveEffect", async (effect) => {
		try {
			await delayedDuration(effect);
		} catch (error) {
			console.error("Elkan 5e | Error in deleteActiveEffect hook:", error);
		}

		try {
			await Promise.resolve(Spells.goodberryDeleteActive(effect));
		} catch (error) {
			console.error("Elkan 5e | Error cleaning goodberry effect:", error);
		}

		try {
			await Promise.resolve(Spells.returnToNormalSize(effect));
		} catch (error) {
			console.error("Elkan 5e | Error restoring token size:", error);
		}
	});
}
