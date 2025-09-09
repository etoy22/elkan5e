export function skills() {
	engineering();
	setupSkillReferences();
}

export function engineering() {
	CONFIG.DND5E.skills.eng = {
		label: "Engineering",
		ability: "int",
		fullKey: "engineering",
		reference:
			"Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.AT8kvdogoKRgWLO9",
	};
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
