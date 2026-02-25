import { archDruid, wildSurge } from "../module/classes/index.mjs";
import { undeadNature } from "../module/feats/index.mjs";

export function registerSystemHooks() {
	// Hit die customization
	Hooks.on("dnd5e.preRollHitDieV2", (config) => {
		try {
			undeadNature(config);
		} catch (error) {
			console.error("Elkan 5e | Error in preRollHitDieV2 hook:", error);
		}
	});

	// Post-use activity (Sorcerer wild surge)
	Hooks.on("dnd5e.postUseActivity", (activity, usageConfig) => {
		try {
			wildSurge(activity, usageConfig);
		} catch (error) {
			console.error("Elkan 5e | Error in postUseActivity hook:", error);
		}
	});

	// Initiative pre-roll (Druid archdruid)
	Hooks.on("dnd5e.preRollInitiative", (actor) => {
		try {
			archDruid(actor);
		} catch (error) {
			console.error("Elkan 5e | Error in preRollInitiative hook:", error);
		}
	});
}
