/* global game */
import { UpdateElkanRunner } from "./UpdateElkanRunner.mjs";
export async function gameSettingRegister() {
	game.settings.register("elkan5e", "dialogShown", {
		name: "elkan5e.dialog.name",
		hint: "elkan5e.dialog.hint",
		scope: "client",
		config: false,
		type: Boolean,
		default: false,
	});

	game.settings.register("elkan5e", "conditions", {
		name: "elkan5e.conditions.name",
		hint: "elkan5e.conditions.hint",
		scope: "world",
		config: true,
		type: String,
		requiresReload: true,
		default: "a",
		choices: {
			a: "elkan5e.conditions.choiceA",
			b: "elkan5e.conditions.choiceB",
			c: "elkan5e.conditions.choiceC",
			d: "elkan5e.conditions.choiceD",
		},
		restricted: true,
	});

	game.settings.register("elkan5e", "tools", {
		name: "elkan5e.tools.name",
		hint: "elkan5e.tools.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: false,
		type: Boolean,
		restricted: true,
	});

	game.settings.register("elkan5e", "armor", {
		name: "elkan5e.armor.name",
		hint: "elkan5e.armor.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: false,
		type: Boolean,
		restricted: true,
	});

	game.settings.register("elkan5e", "v13Show", {
		scope: "world",
		requiresReload: false,
		default: true,
		type: Boolean,
		restricted: true,
	});

	game.settings.register("elkan5e", "weapons", {
		name: "elkan5e.weapons.name",
		hint: "elkan5e.weapons.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: false,
		type: Boolean,
		restricted: true,
	});

	game.settings.register("elkan5e", "draconic-toughness", {
		name: "elkan5e.draconic-toughness.name",
		hint: "elkan5e.draconic-toughness.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: true,
		type: Boolean,
		restricted: true,
	});

	game.settings.register("elkan5e", "moduleVersion", {
		name: "elkan5e.moduleVersion.name",
		hint: "elkan5e.moduleVersion.hint",
		scope: "client",
		config: false,
		type: String,
		default: "1.13.0",
	});

	game.settings.register("elkan5e", "languageSystem", {
		name: "elkan5e.languageSystem.name",
		hint: "elkan5e.languageSystem.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: true,
		type: Boolean,
		restricted: true,
	});

	game.settings.registerMenu("elkan5e", "updateElkanMenu", {
		name: "elkan5e.updateElkan.name",
		label: "elkan5e.updateElkan.label", 
		hint: "elkan5e.updateElkan.hint",
		icon: "fas fa-sync", 
		type: UpdateElkanRunner, 
		restricted: true,
	});
}
