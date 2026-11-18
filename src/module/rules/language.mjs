/**
 * Applies language rule behavior.
 *
 */
export function language() {
	if (!game.settings.get("elkan5e", "languageSystem")) return;

	console.log("Elkan 5e  |  Initializing Languages");

	const LANGUAGES_TO_DELETE = ["giant", "gnomish", "orc", "druidic", "cant", "draconic"];

	if (!CONFIG.DND5E?.languages?.standard?.children) {
		console.warn("Elkan 5e | CONFIG.DND5E.languages not properly initialized");
		return;
	}

	// Deleting Languages
	LANGUAGES_TO_DELETE.forEach(
		(language) => delete CONFIG.DND5E.languages.standard.children[language],
	);
	delete CONFIG.DND5E.languages.cant;
	delete CONFIG.DND5E.languages.druidic;
	delete CONFIG.DND5E.languages.exotic;

	// Adding Languages
	CONFIG.DND5E.languages.standard.children.under = "Undercommon";

	CONFIG.DND5E.languages.rare = {
		label: "Rare Languages",
		selectable: false,
		children: {
			draconic: "Draconic",
			giant: "Giant",
			gnomish: "Gnomish",
			orc: "Orc",
			cant: "Thieves' Cant",
		},
	};

	CONFIG.DND5E.languages.magic = {
		label: "Magical Languages",
		selectable: false,
		children: {
			abyssal: "Abyssal",
			celestial: "Celestial",
			deep: "Deep Speech",
			druidic: "Druidic",
			infernal: "Infernal",
			primordial: {
				label: "Primordial",
				children: {
					aquan: "Aquan",
					auran: "Auran",
					ignan: "Ignan",
					terran: "Terran",
				},
			},
			sylvan: "Sylvan",
		},
	};

	CONFIG.DND5E.languages.other = {
		label: "Other Languages",
		selectable: false,
		children: {
			aarakocra: "Aarakocra",
			gith: "Gith",
			gnoll: "Gnoll",
		},
	};
}
