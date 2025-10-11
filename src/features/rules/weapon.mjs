/**
 * All the changes of Elkan 5e in Foundry.
 */
export function weapons() {
	console.log("Elkan 5e  |  Initializing Weapons");
	// Weapon Properties
	const NEW_PROPERTIES = {
		coldIron: { label: "Cold Iron", isPhysical: true },
		conc: { label: "Concussive" },
		mou: { label: "Mounted" },
		unw: { label: "Unwieldy" },
	};
	try {
		Object.assign(CONFIG.DND5E.itemProperties, NEW_PROPERTIES);
		Object.keys(NEW_PROPERTIES).forEach((prop) => {
			try {
				CONFIG.DND5E.validProperties.weapon.add(prop);
			} catch (e) {
				console.warn(`Elkan 5e | Failed to add weapon property '${prop}':`, e);
			}
		});
		CONFIG.DND5E.validProperties.weapon.delete("spc");
	} catch (e) {
		console.warn("Elkan 5e | Failed to assign new weapon properties:", e);
	}

	// Weapon IDs
	const WEAPON_IDS = [
		{ key: "battleaxe", id: "gpZnusEdpaxAPesT" },
		{ key: "blowgun", id: "1eqSvbUzm4rVN0BW" },
		{ key: "club", id: "Xq5GOTmI51WGTB2i" },
		{ key: "dagger", id: "Y6IT6GdS7C81Yz02" },
		{ key: "dart", id: "NwVBTiWfOh1XmGIm" },
		{ key: "glaive", id: "uZiGab66lUoqZyOI" },
		{ key: "greataxe", id: "YVEcMNtAEQnGLv0S" },
		{ key: "greatclub", id: "yWjRA9RARTDSbAfU" },
		{ key: "greatsword", id: "vYEfz3IGHqR9krzS" },
		{ key: "halberd", id: "Qbm3eVE1Xg8Aq30C" },
		{ key: "handaxe", id: "rIzJTl2bsFVDNji3" },
		{ key: "handcrossbow", id: "95GGJe2TrPOBeRIU" },
		{ key: "heavycrossbow", id: "pW1brh2c1mr4LyCq" },
		{ key: "javelin", id: "pM8eu7VlKCHmEi3N" },
		{ key: "lance", id: "JKkdR63XyhzzgbsV" },
		{ key: "lightcrossbow", id: "wPcrbw6GTNb9ZYvp" },
		{ key: "lighthammer", id: "qqsRY0HoGdEJ6dZr" },
		{ key: "longbow", id: "u9OIgbETWimkeEx5" },
		{ key: "longsword", id: "ZOyejSDAVAH74Z4u" },
		{ key: "mace", id: "ntmAbPMerRRj93Jy" },
		{ key: "maul", id: "l8KBIR8hyBXP34g3" },
		{ key: "morningstar", id: "YeHixhF01JFTKaNf" },
		{ key: "pike", id: "AkHpqbiDKMPArfyR" },
		{ key: "quarterstaff", id: "qpOD3sz47K9lnNgt" },
		{ key: "rapier", id: "poEXwYP4n9HdRzwm" },
		{ key: "scimitar", id: "NLDdf7iJt09G64Dg" },
		{ key: "shortbow", id: "uHNpC0W5EdHCOnP6" },
		{ key: "shortsword", id: "0hIX4VFLMTXWVYoW" },
		{ key: "sickle", id: "STRitF2wexdf7eGM" },
		{ key: "sling", id: "Ev7JyidZMB8BA9Cn" },
		{ key: "spear", id: "l6tAULuFVbSNewP4" },
		{ key: "unarmed", id: "pRDNsHpNLLk1Qq58" },
		{ key: "warhammer", id: "3geQ0izotY1xNo8c" },
		{ key: "whip", id: "GdgYGzD0cqVlYguz" },
		{ key: "pistol", id: "O7abmlrF4raTjnkr" },
		{ key: "musket", id: "IUIwCZtPbwMwB0b1" },
	];
	WEAPON_IDS.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.weaponIds[key] = `Compendium.elkan5e.elkan5e-equipment.Item.${id}`;
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign weapon ID for '${key}':`, e);
		}
	});
	try {
		const WEAPONS = game.settings.get("elkan5e", "weapons");
		if (!WEAPONS) {
			["flail", "net", "trident", "warpick"].forEach((weapon) => {
				try {
					delete CONFIG.DND5E.weaponIds[weapon];
				} catch (e) {
					console.warn(`Elkan 5e | Failed to delete weapon ID for '${weapon}':`, e);
				}
			});
		}
	} catch (e) {
		console.warn("Elkan 5e | Failed to update weapon IDs based on settings:", e);
	}

	// Weapon Rules
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.";
	const WEAPON_REFS = [
		{ key: "adamantine", id: "cUHKJTc6BHyI1gfR" },
		{ key: "ammunition", id: "5RUwcK38cpr1fZLe" },
		{ key: "coldiron", id: "ciqBm30ddE1BsPOg" },
		{ key: "concussive", id: "1hVvE10PnHaKQGik" },
		{ key: "finesse", id: "QIw9oL7nHuy6A5e3" },
		{ key: "heavy", id: "K644Km2l7enin6ou" },
		{ key: "lightweapon", id: "AHUBfDV0TrMzcTUa" },
		{ key: "loading", id: "VENz7U1ksd5WtYbK" },
		{ key: "magicweapon", id: "ZqkxXr9joWmx5dEx" },
		{ key: "mounted", id: "NF2lMEQyT4y6dxd0" },
		{ key: "reach", id: "1xgI5cPXMX8TwBt5" },
		{ key: "thrown", id: "cJzshBhfAwz9VYv0" },
		{ key: "handed", id: "R5B5WfIsoxR4E1OZ" },
		{ key: "silver", id: "3ZyL5VG1OqvBjajQ" },
		{ key: "unwieldy", id: "sokjqCLGL8GY3O67" },
		{ key: "versatile", id: "zrkm2gvW9a0IXpvW" },
	];
	if (!CONFIG.DND5E.rules) CONFIG.DND5E.rules = {};
	WEAPON_REFS.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.rules[key] = { reference: base + id };
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign weapon rule reference for key '${key}':`, e);
		}
	});
}
