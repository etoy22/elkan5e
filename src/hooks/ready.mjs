import { conditionsReady, updateToolTypes } from "../module/rules/index.mjs";
import { gameSettingsMigrate } from "../module/settings/gameSettingRegister.mjs";
import { startDialog } from "../module/settings/dialog.mjs";

export function registerReadyHooks() {
	Hooks.once("ready", () => {
		try {
			gameSettingsMigrate();
			conditionsReady();
			updateToolTypes();
			startDialog();
		} catch (error) {
			console.error("Elkan 5e | Ready Hook Error:", error);
		}
	});
}
