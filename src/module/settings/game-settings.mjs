import { UpdateBuildRunner, UpdateElkanRunner } from "./update-elkan-runner.mjs";
const MODULE_ID = "elkan5e";

/**
 * Waits until Foundry has fully marked the game as ready.
 *
 * @returns {Promise<void>} Promise resolution result.
 */
async function waitForGameReady() {
	if (game.ready) return;

	await new Promise((resolve) => {
		const checkReady = () => {
			if (game.ready) {
				resolve();
				return;
			}

			globalThis.setTimeout(checkReady, 0);
		};

		checkReady();
	});
}

/**
 * Handles register Game Settings for module settings.
 *
 * @returns {Promise<void>} Promise resolution result.
 */
export async function registerGameSettings() {
	// Convert Game settings

	// Hidden settings (stored state, not shown in the panel)
	game.settings.register(MODULE_ID, "dialogShown", {
		name: "elkan5e.dialog.name",
		hint: "elkan5e.dialog.hint",
		scope: "client",
		config: false,
		type: Boolean,
		default: false,
	});

	game.settings.register(MODULE_ID, "moduleVersion", {
		name: "elkan5e.moduleVersion.name",
		hint: "elkan5e.moduleVersion.hint",
		scope: "client",
		config: false,
		type: String,
		default: "",
	game.settings.register(MODULE_ID, "toolsMigration", {
		name: "Elkan 5e Tools Migration Flag",
		scope: "world",
		config: false,
		type: Boolean,
		default: false,
	});

	game.settings.register(MODULE_ID, "deathSaveClear", {
		name: "elkan5e.deathSaveClear.name",
		hint: "elkan5e.deathSaveClear.hint",
		scope: "world",
		config: true,
		type: String,
		default: "immediate",
		choices: {
			immediate: "elkan5e.deathSaveClear.choiceImmediate",
			shortRest: "elkan5e.deathSaveClear.choiceShortRest",
			longRest: "elkan5e.deathSaveClear.choiceLongRest",
		},
		restricted: true,
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
		default: false,
		type: Boolean,
		restricted: true,
	});

	game.settings.register(MODULE_ID, "skillCriticalAdjustment", {
		name: "elkan5e.skillCriticalAdjustment.name",
		hint: "elkan5e.skillCriticalAdjustment.hint",
		scope: "world",
		config: true,
		default: true,
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

	game.settings.register(MODULE_ID, "scrollRules", {
		name: "elkan5e.scrolls.name",
		hint: "elkan5e.scrolls.hint",
		scope: "world",
		config: true,
		requiresReload: true,
		default: true,
		type: Boolean,
		restricted: true,
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

	game.settings.registerMenu(MODULE_ID, "updateElkanMenu", {
		name: "elkan5e.updateElkan.name",
		label: "elkan5e.updateElkan.label", // Text on the button
		hint: "elkan5e.updateElkan.hint",
		icon: "fas fa-sync", // FontAwesome icon
		type: UpdateElkanRunner, // Class that runs your function
		restricted: true,
	});

	// Not restricted: players use this one to update their own characters.
	game.settings.registerMenu(MODULE_ID, "updateBuildMenu", {
		name: "elkan5e.updateElkan.build.name",
		label: "elkan5e.updateElkan.build.label",
		hint: "elkan5e.updateElkan.build.menuHint",
		icon: "fas fa-user-gear",
		type: UpdateBuildRunner,
		restricted: false,
	});

	Hooks.on("renderSettingsConfig", organizeSettingsTab);
}

/**
 * Handles migrate Game Settings for module settings.
 *
 * @returns {Promise<void>} Promise resolution result.
 */
export async function migrateGameSettings() {
	const worldSettings = game.settings.storage.get("world");
	const oldValue = worldSettings?._source?.find((s) => s.key === `${MODULE_ID}.tools`)?.value;

	if (
		game.user.isGM &&
		oldValue !== undefined &&
		(oldValue === "false" || oldValue === false || oldValue === "true" || oldValue === true) &&
		!game.settings.get(MODULE_ID, "toolsMigration")
	) {
		await waitForGameReady();
		console.log(`Elkan 5e | Migrating legacy boolean tools setting`);
		let convertedValue = 0;
		if (oldValue === "false" || oldValue === false) {
			convertedValue = 2;
		}
		console.log(
			`Elkan 5e | Migrating setting "tools" from boolean to number (${oldValue} -> ${convertedValue})`,
		);
		try {
			await game.settings.set(MODULE_ID, "tool", convertedValue);
			await game.settings.set(MODULE_ID, "toolsMigration", true);
		} catch (error) {
			console.error("Elkan 5e | Failed to migrate the legacy tools setting:", error);
		}
	}

	if (game.user.isGM && game.settings.get(MODULE_ID, "tool") === 1) {
		await waitForGameReady();
		console.log(`Elkan 5e | Migrating legacy tools to the Elkan 5e tools list`);
		try {
			await game.settings.set(MODULE_ID, "tool", 0);
		} catch (error) {
			console.error("Elkan 5e | Failed to migrate legacy numeric tool setting:", error);
		}
	}
}

/** Settings panel sections, in display order. The menu button goes last under "Maintenance". */
const SETTING_GROUPS = [
	[
		"gameplay",
		[
			"deathSaveClear",
			"conditionsSettings",
			"skillCriticalAdjustment",
			"draconic-toughness",
			"scrollRules",
		],
	],
	["content", ["languageSystem", "tool"]],
	["legacy", ["armor", "weapons"]],
];

/**
 * Adds section headings to the Elkan 5e settings tab and moves the update button to the end.
 *
 * @param {object} _app - Settings window.
 * @param {HTMLElement} html - Rendered window.
 */
export function organizeSettingsTab(_app, html) {
	const root = html instanceof HTMLElement ? html : html?.[0];
	const tab = root?.querySelector(`section[data-tab="${MODULE_ID}"]`);
	if (!tab || tab.querySelector(".elkan-settings-heading")) return;

	const heading = (key) => {
		const el = document.createElement("h3");
		el.className = "elkan-settings-heading";
		el.textContent = game.i18n.localize(`elkan5e.settingsGroups.${key}`);
		return el;
	};
	for (const [group, keys] of SETTING_GROUPS) {
		let first = true;
		for (const key of keys) {
			const row = tab.querySelector(`[name="${MODULE_ID}.${key}"]`)?.closest(".form-group");
			if (!row) continue;
			if (first) tab.append(heading(group));
			first = false;
			tab.append(row);
		}
	}
	const menuRows = [...tab.querySelectorAll(".form-group")].filter(
		(g) => !g.querySelector("[name]"),
	);
	if (menuRows.length) {
		tab.append(heading("maintenance"));
		for (const row of menuRows) tab.append(row);
	}
}

export const gameSettingRegister = registerGameSettings;
export const gameSettingsMigrate = migrateGameSettings;
