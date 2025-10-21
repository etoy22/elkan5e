import { UpdateElkanRunner } from "./UpdateElkanRunner.mjs";
const MODULE_ID = "elkan5e";
export async function gameSettingRegister() {
	// Convert Game settings

	//Set game settings
	game.settings.register(MODULE_ID, "poll", {
		name: "elkan5e.dialog.name",
		hint: "elkan5e.dialog.hint",
		scope: "client",
		config: false,
		type: Boolean,
		default: false,
	});

	game.settings.register(MODULE_ID, "dialogShown", {
		name: "elkan5e.dialog.name",
		hint: "elkan5e.dialog.hint",
		scope: "client",
		config: false,
		type: Boolean,
		default: false,
	});

	game.settings.register(MODULE_ID, "conditionsSettings", {
		name: "elkan5e.conditionsSettings.name",
		hint: "elkan5e.conditionsSettings.hint",
		scope: "world",
		config: true,
		type: String,
		requiresReload: true,
		default: "a",
		choices: {
			a: "elkan5e.conditionsSettings.choiceA",
			b: "elkan5e.conditionsSettings.choiceB",
			c: "elkan5e.conditionsSettings.choiceC",
			d: "elkan5e.conditionsSettings.choiceD",
		},
		restricted: true,
	});

	game.settings.register(MODULE_ID, "toolsMigration", {
		name: "Elkan 5e Tools Migration Flag",
		scope: "world",
		config: false,
		type: Boolean,
		default: false,
	});

	game.settings.register(MODULE_ID, "tool", {
		name: "elkan5e.tools.name",
		hint: "elkan5e.tools.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: 0,
		type: Number,
		choices: {
			0: "elkan5e.tools.choiceA",
			1: "elkan5e.tools.choiceB",
			2: "elkan5e.tools.choiceC",
		},
		restricted: true,
	});

	game.settings.register(MODULE_ID, "armor", {
		name: "elkan5e.armor.name",
		hint: "elkan5e.armor.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: false,
		type: Boolean,
		restricted: true,
	});

	game.settings.register(MODULE_ID, "v13Show", {
		scope: "world",
		requiresReload: true,
		default: true,
		type: Boolean,
		restricted: true,
	});

	game.settings.register(MODULE_ID, "weapons", {
		name: "elkan5e.weapons.name",
		hint: "elkan5e.weapons.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: false,
		type: Boolean,
		restricted: true,
	});

	game.settings.register(MODULE_ID, "draconic-toughness", {
		name: "elkan5e.draconic-toughness.name",
		hint: "elkan5e.draconic-toughness.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: true,
		type: Boolean,
		restricted: true,
	});

	game.settings.register(MODULE_ID, "moduleVersion", {
		name: "elkan5e.moduleVersion.name",
		hint: "elkan5e.moduleVersion.hint",
		scope: "client",
		config: false,
		type: String,
		default: "1.13.0",
	});

	game.settings.register(MODULE_ID, "languageSystem", {
		name: "elkan5e.languageSystem.name",
		hint: "elkan5e.languageSystem.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: true,
		type: Boolean,
		restricted: true,
	});

	game.settings.registerMenu(MODULE_ID, "updateElkanMenu", {
		name: "elkan5e.updateElkan.name",
		label: "elkan5e.updateElkan.label", // Text on the button
		hint: "elkan5e.updateElkan.hint",
		icon: "fas fa-sync", // FontAwesome icon
		type: UpdateElkanRunner, // Class that runs your function
		restricted: true,
	});
}


export async function gameSettingsMigrate() {
	const oldValue = game.settings.storage.get("world")._source.find(s => s.key === `${MODULE_ID}.tools`).value;
	
	if ((oldValue === "false" || oldValue === false || oldValue === "true" || oldValue === true) && !game.settings.get(MODULE_ID, "toolsMigration")) {
		console.log(`Elkan 5e | Migrating setting \"tools\" from to new settings`);
		let convertedValue = 0;
		if (oldValue === "false" || oldValue === false) {
			convertedValue = 2
		}
		else if (oldValue === "true" || oldValue === true) {
			convertedValue = 1
		}
		console.log(`Elkan 5e | Migrating setting "tools" from boolean to number (${oldValue} -> ${convertedValue})`);
		await game.settings.set(MODULE_ID, "tool", convertedValue);
		await game.settings.set(MODULE_ID, "toolsMigration", true);
	}

}