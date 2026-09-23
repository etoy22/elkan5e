/**
 * Applies armor rule behavior.
 *
 */
export function armor() {
	const armor = game.settings.get("elkan5e", "armor");
	const dragon = game.settings.get("elkan5e", "draconic-toughness");
	console.log("Elkan 5e  |  Initializing Armor");

	// Ensure CONFIG.DND5E.armorIds exists
	if (!CONFIG.DND5E.armorIds) CONFIG.DND5E.armorIds = {};
	// Ensure CONFIG.DND5E.shieldIds exists
	if (!CONFIG.DND5E.shieldIds) CONFIG.DND5E.shieldIds = {};
	// Ensure CONFIG.DND5E.armorClasses exists
	if (!CONFIG.DND5E.armorClasses) CONFIG.DND5E.armorClasses = {};
	// Ensure CONFIG.DND5E.armorClasses.draconic exists
	if (!CONFIG.DND5E.armorClasses.draconic) CONFIG.DND5E.armorClasses.draconic = {};

	if (!armor) {
		// Delete List
		["ringmail", "studded"].forEach((id) => delete CONFIG.DND5E.armorIds[id]);
		delete CONFIG.DND5E.shieldIds.shield;
	}

	// Add List
	Object.assign(CONFIG.DND5E.shieldIds, {
		large: "elkan5e.elkan5e-equipment.AENiTUeluTRiFzRz",
		small: "elkan5e.elkan5e-equipment.OE836KUoJiAsG0IA",
	});


	CONFIG.DND5E.armorClasses["elkanBarbariansDefenseArmored"] = {
		label: "Barbarian's Defense (Armored)",
		formula:
			"@attributes.ac.armor + max(@attributes.ac.clamped.dex, @attributes.ac.clamped.con)",
		armored: true,
	};

	if (dragon) {
		CONFIG.DND5E.armorClasses.draconic.formula = "13 + @abilities.cha.mod";
	}
}