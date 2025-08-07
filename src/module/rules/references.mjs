/* global CONFIG */
// Centralized DND5E reference assignments for Elkan 5e
export function setupCombatReferences() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.";
	const COMBAT_REFS = [
		{ key: "attack", id: "IauYsEM9MxyZCIdc" },
		{ key: "opportunityattacks", id: "5zEWVU1yw2Sv3hSI" },
		{ key: "dodge", id: "2Fxm6ATuDUyDIrt7" },
		{ key: "dash", id: "6UWCRY83phLnc7cF" },
		{ key: "disengage", id: "bYoY0gZQArDraXRs" },
		{ key: "help", id: "ZdoIWQgcoqcHlZSf" },
		{ key: "hide", id: "57VIppmrOewNVKF5" },
		{ key: "influence", id: "tQyGfgGBXBSz2UBe" },
		{ key: "ready", id: "Uo0qriXzk4YInJrl" },
		{ key: "search", id: "bRo3ci56JJiuxYk8" },
		{ key: "study", id: "LAZotCjxu5Y9BIkK" },
		{ key: "surprise", id: "QOZeW0m8RCdVg6UE" },
		{ key: "unarmedstrike", id: "pRDNsHpNLLk1Qq58" },
		{ key: "twoweaponfighting", id: "XLZbNEhoayCw5bk8" },
	];
	if (!CONFIG.DND5E.rules) CONFIG.DND5E.rules = {};
	COMBAT_REFS.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.rules[key] = { reference: base + id };
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign combat reference for key '${key}':`, e);
		}
	});
}

export function setupDamageReferences() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.";
	const DAMAGE_TYPES = [
		{ key: "acid", id: "VKYjrEO909FEbScG" },
		{ key: "bludgeoning", id: "DLkhjyAJK6R1lPrA" },
		{ key: "cold", id: "qnctn4Gcve0px0wU" },
		{ key: "lightning", id: "inNJv5hIxFOb0atF" },
		{ key: "fire", id: "8ZmYsUdejP3wal1K" },
		{ key: "force", id: "hnbcchv13gA0ev8j" },
		{ key: "necrotic", id: "3WAI4TbrSC8FS637" },
		{ key: "piercing", id: "cEnkMbQascSe6lKU" },
		{ key: "poison", id: "Mh0WKYgypPl7hKSo" },
		{ key: "psychic", id: "DiUkrQVun34pAK4Z" },
		{ key: "radiant", id: "1iv5sIBnKoFJrhMH" },
		{ key: "slashing", id: "yxrHRnhVdSzKtzyZ" },
		{ key: "thunder", id: "kPmCUWoSWv3lEW3t" },
	];
	if (!CONFIG.DND5E.damageTypes) CONFIG.DND5E.damageTypes = {};
	DAMAGE_TYPES.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.damageTypes[key].reference = base + id;
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign damage reference for key '${key}':`, e);
		}
	});
}

export function setupSpellcastingReferences() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.";
	const SPELL_REFS = [
		{ key: "spellslots", id: "RAatADW6Izlm9yu6" },
		{ key: "spelllevel", id: "RAatADW6Izlm9yu6" },
		{ key: "cantrips", id: "UnQ8KUMYK3a6BWwu" },
		{ key: "upcasting", id: "wvECxDLurbCDec4h" },
		{ key: "castingatahigherlevel", id: "wvECxDLurbCDec4h" },
		{ key: "multiplespellsinaturn", id: "Rxjj26a4VyVnZYk9" },
		{ key: "duplicatemagicaleffects", id: "uWa3L8lGJKgICYHt" },
		{ key: "lineofsight", id: "5V7gVZ9fe5AWawwb" },
		{ key: "coverandwalls", id: "2QBRvP0XH1PBboSs" },
		{ key: "castinginarmor", id: "kwjLwbgZuqdcj17X" },
		{ key: "castingtime", id: "1H5OBLq2k7EmNowe" },
		{ key: "spelltargets", id: "HHfnotH75EXQ9zsP" },
		{ key: "spellrange", id: "rM1U1uAq2GD0ls8a" },
		{ key: "verbal", id: "wvyS2GRHioSYrMW0" },
		{ key: "spellduration", id: "KywepPZfytUpWKql" },
		{ key: "illusoryimages", id: "GtUH7c2Spk6XpU3B" },
		{ key: "knownspells", id: "qUZNQFDTomNDA9bv" },
		{ key: "preparedspells", id: "tvQAz6EC8cGVKRYi" },
		{ key: "abilityspells", id: "arD4KLvgCPbi1Pl7" },
		{ key: "focusspells", id: "R25K8TvAPK3c4ywr" },
		{ key: "spellscroll", id: "R25K8TvAPK3c4ywr" },
		{ key: "cursed", id: "Vpwu9GQC6HVNZFze" },
	];
	if (!CONFIG.DND5E.rules) CONFIG.DND5E.rules = {};
	SPELL_REFS.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.rules[key] = { reference: base + id };
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign spellcasting reference for key '${key}':`, e);
		}
	});
	const ITEM_PROPERTIES = [
		{ key: "material", id: "gdVkgCiREuukVhLb" },
		{ key: "ritual", id: "CMI1OFzBkvjEmlj7" },
		{ key: "vocal", id: "wvyS2GRHioSYrMW0" },
		{ key: "somatic", id: "ooFAPmKTS7Cd6YXp" },
	];
	if (!CONFIG.DND5E.itemProperties) CONFIG.DND5E.itemProperties = {};
	ITEM_PROPERTIES.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.itemProperties[key].reference = base + id;
		} catch (e) {
			console.warn(
				`Elkan 5e | Failed to assign spellcasting item property for key '${key}':`,
				e,
			);
		}
	});
	try {
		CONFIG.DND5E.itemProperties.concentration.reference =
			"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv";
	} catch (e) {
		console.warn("Elkan 5e | Failed to assign concentration reference:", e);
	}
}

export function setupCreatureTypeReferences() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.ZJX2hgglCq6NyNSD.JournalEntryPage.";
	const CREATURE_REFS = [
		{ key: "aberration", id: "s654bq7hgEOCdSal" },
		{ key: "beast", id: "u3JShAq2ZxnVV2yV" },
		{ key: "celestial", id: "ZZwFqDb6FC9Z3XkD" },
		{ key: "construct", id: "rcp9DD1ydtLTIRhn" },
		{ key: "dragon", id: "pIZXeLpJ5fCozA1H" },
		{ key: "elemental", id: "QYh9NqKgmt6Hhj8c" },
		{ key: "fey", id: "XfgpzHZJ84H0sYVh" },
		{ key: "fiend", id: "EBIlihpWmZWGkC45" },
		{ key: "giant", id: "OGbTyzGQUuttmGfS" },
		{ key: "humanoid", id: "rdY46Jtmqi2OMGwJ" },
		{ key: "monstrosity", id: "eKwEjCvWliZqkyOL" },
		{ key: "ooze", id: "joRNgGxKjOYH3gMu" },
		{ key: "plant", id: "UYIBDnkcxC2BjHgm" },
		{ key: "undead", id: "R1lM7n8ZgXzgc1K3" },
	];
	if (!CONFIG.DND5E.creatureTypes) CONFIG.DND5E.creatureTypes = {};
	CREATURE_REFS.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.creatureTypes[key].reference = base + id;
		} catch (e) {
			console.warn(
				`Elkan 5e | Failed to assign creature type reference for key '${key}':`,
				e,
			);
		}
	});
}

export function setupSkillReferences() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.";
	const SKILLS = [
		{ key: "acr", id: "nJvKshCeUsYho87K" },
		{ key: "ani", id: "JR9h0nL97GegQ9Vz" },
		{ key: "arc", id: "Cc49eyAgMrF1GIjH" },
		{ key: "ath", id: "1lTpjCIaINKzvmKI" },
		{ key: "dec", id: "UDcxonEumLH5vEQu" },
		{ key: "his", id: "o9V0Z91HWH84JHda" },
		{ key: "ins", id: "HAKuuUMWW3pRCMoL" },
		{ key: "inv", id: "1VOLgBW7kkGwaPbH" },
		{ key: "itm", id: "3WqeQryCXL1gtaEo" },
		{ key: "med", id: "bEEOxmai3Q08nTfT" },
		{ key: "nat", id: "0v0AbmZaL3N0zeO2" },
		{ key: "per", id: "X3dKHNVduLjYxR1x" },
		{ key: "prc", id: "pIFI2y2qLS9ovm0C" },
		{ key: "prf", id: "9bVttJ5qNpwiOpzL" },
		{ key: "rel", id: "KGv0Bkb9thO9K4xJ" },
		{ key: "slt", id: "ynZa3sl1E681sRlP" },
		{ key: "ste", id: "LnS51AK4Yi0P53QT" },
		{ key: "sur", id: "6KIdxNMhOuvZUMxc" },
	];
	const PROF = [
		{ key: "proficiency", id: "FSOQGFobVnECHPSC" },
		{ key: "expertise", id: "BXLGKD3SIZiYuaHt" },
		{ key: "dabbler", id: "HCfJwhuVwWCLPEBC" },
	];
	if (!CONFIG.DND5E.skills) CONFIG.DND5E.skills = {};
	if (!CONFIG.DND5E.enrichmentLookup) CONFIG.DND5E.enrichmentLookup = {};
	if (!CONFIG.DND5E.enrichmentLookup.skills) CONFIG.DND5E.enrichmentLookup.skills = {};
	SKILLS.forEach(({ key, id }) => {
		try {
			const reference = base + id;
			if (!CONFIG.DND5E.skills[key]) CONFIG.DND5E.skills[key] = {};
			CONFIG.DND5E.skills[key].reference = reference;
			if (!CONFIG.DND5E.enrichmentLookup.skills[key])
				CONFIG.DND5E.enrichmentLookup.skills[key] = {};
			CONFIG.DND5E.enrichmentLookup.skills[key].reference = reference;
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign skill reference for key '${key}':`, e);
		}
	});
	if (!CONFIG.DND5E.rules) CONFIG.DND5E.rules = {};
	PROF.forEach(({ key, id }) => {
		try {
			const reference = base + id;
			CONFIG.DND5E.rules[key] = { reference };
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign proficiency reference for key '${key}':`, e);
		}
	});
}
