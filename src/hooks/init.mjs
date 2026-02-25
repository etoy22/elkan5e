import { initWarlockSpellSlot } from "../module/classes/warlock.mjs";
import { gameSettingRegister } from "../module/settings/gameSettingRegister.mjs";
import {
	armor,
	conditions,
	formating,
	language,
	refs,
	scroll,
	skills,
	tools,
	weapons,
} from "../module/rules/index.mjs";

export function registerInitHooks() {
	Hooks.once("init", async () => {
		try {
			console.log("Elkan 5e | Initializing Elkan 5e");
			await gameSettingRegister();
			initWarlockSpellSlot();

			// Initialize rule systems
			conditions();
			tools();
			weapons();
			armor();
			language();
			formating();
			scroll();
			skills();
			refs();
		} catch (error) {
			console.error("Elkan 5e  |  Initialization Error:", error);
		}
	});
}
