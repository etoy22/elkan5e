/**
 * Applies get Tool Type rule behavior.
 *
 * @param {*} key - Key.
 * @param {*} toolSetting - Tool Setting.
 * @returns {unknown} Operation result.
 */
function getToolType(key, toolSetting) {
	switch (toolSetting) {
		case 2:
			return SRD_TOOL_TYPES[key] ?? "";
		case 1:
			return LEGACY_TOOL_TYPES[key] ?? "";
		case 0:
			return ELKAN_TOOL_TYPES[key] ?? "";
		default:
			return "";
	}
}

/**
 * Applies tools rule behavior.
 *
 * @returns {void} Operation result.
 */
export function tools() {
	const TOOL_SETTING = game.settings.get("elkan5e", "tool");

	console.log("Elkan 5e  |  Initializing Tools");

	// ------------------------------
	// REGISTER TOOLS AND UPDATE TYPE VALUES
	// ------------------------------
	for (const [key, value] of Object.entries(TOOLS)) {
		CONFIG.DND5E.tools[key] = value;
	}

	// ------------------------------
	// APPLY CONFIG CHANGES BY SETTING
	// ------------------------------
	if (TOOL_SETTING === 0) {
		// Elkan Tools
		CONFIG.DND5E.toolTypes.craft = "Crafting Tools";
		CONFIG.DND5E.toolProficiencies.craft = "Crafting Tools";
		delete CONFIG.DND5E.toolTypes.game;
		delete CONFIG.DND5E.toolProficiencies.game;
		for (const tool of TOOLS_TO_REMOVE) delete CONFIG.DND5E.tools[tool];
	}

	if (TOOL_SETTING === 1) {
		// Legacy Tools
		CONFIG.DND5E.toolTypes.craft = "Crafting Tools";
		CONFIG.DND5E.toolTypes.explore = "Exploration Tools";
		CONFIG.DND5E.toolProficiencies.craft = "Crafting Tools";
		CONFIG.DND5E.toolProficiencies.explore = "Exploration Tools";
		delete CONFIG.DND5E.toolTypes.game;
		delete CONFIG.DND5E.toolProficiencies.game;
		for (const tool of TOOLS_TO_REMOVE_LEGACY) delete CONFIG.DND5E.tools[tool];
	}

	if (TOOL_SETTING === 2) {
		// SRD Tools
		for (const tool of TOOLS_TO_REMOVE_SRD) delete CONFIG.DND5E.tools[tool];
	}
}

/**
 * Updates update Tool Types state.
 *
 * @returns {Promise<void>} Promise resolution result.
 */
export async function updateToolTypes() {
	const TOOL_SETTING = game.settings.get("elkan5e", "tool");

	console.log("Elkan 5e | Starting updateToolTypes()");

	let updatedCount = 0;
	let missingCount = 0;

	if (!TOOLS || Object.keys(TOOLS).length === 0) {
		console.warn("Elkan 5e | TOOLS object is empty or undefined!");
		return;
	}

	for (const [key, value] of Object.entries(TOOLS)) {
		const uuid = value.id;

		if (!uuid) {
			console.warn(`Elkan 5e | No UUID defined for ${key}`);
			missingCount += 1;
			continue;
		}

		let item;
		try {
			item = await fromUuid(uuid);
		} catch (err) {
			console.error(`Elkan 5e | romUuid() threw an error for ${key}`, err);
			continue;
		}

		if (!item) {
			console.warn(`Elkan 5e | Could not find item for ${key} (${uuid})`);
			missingCount += 1;
			continue;
		}

		const desiredType = getToolType(key, TOOL_SETTING);
		const currentType = foundry.utils.getProperty(item, "system.type.value") ?? "";

		if (!desiredType) {
			console.warn(`Elkan 5e | ⚠ getToolType() returned empty for ${key}. Check mapping.`);
		}

		if (currentType !== desiredType) {
			try {
				await item.update({ "system.type.value": desiredType });
				updatedCount += 1;
			} catch (err) {
				console.error(`Elkan 5e | Failed to update ${item.name}`, err);
			}
		}
	}

	console.log(
		`Elkan 5e | Tool type sync complete. Updated ${updatedCount}, missing ${missingCount}.`,
	);
}
