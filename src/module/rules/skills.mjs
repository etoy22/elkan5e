/**
 * Applies skills rule behavior.
 *
 */
export function skills() {
	engineering();
	setupSkillReferences();
	registerSkillCriticalRule();
}

/**
 * Registers the critical skill check adjustment rule.
 * Natural 1 → −5 to the final total. Natural 20 → +5 to the final total.
 * Modifies the roll in-place before the chat message is created so the
 * adjustment shows in the formula and total on the original roll card.
 *
 */
export function registerSkillCriticalRule() {
	Hooks.on("dnd5e.rollSkillV2", (rolls, data) => {
		try {
			const roll = rolls?.[0];
			if (!roll) return;

			const d20 = roll.dice?.find(d => d.faces === 20);
			if (!d20) return;

			const natural = d20.results?.[0]?.result;
			if (!natural) return;
			if (!game.settings.get("elkan5e", "skillCriticalAdjustment")) return;

			let adjustment = 0;
			if (natural === 1) adjustment = -5;
			else if (natural === 20) adjustment = 5;
			if (adjustment === 0) return;

			const flavor = adjustment > 0 ? "Natural 20 Bonus" : "Natural 1 Penalty";
			const sign   = adjustment > 0 ? "+" : "-";

			// Append the adjustment as visible terms so it appears in the roll breakdown.
			const operator = new foundry.dice.terms.OperatorTerm({ operator: sign });
			const bonus = new foundry.dice.terms.NumericTerm({
				number: Math.abs(adjustment),
				options: { flavor },
			});
			operator._evaluated = true;
			bonus._evaluated = true;
			roll.terms.push(operator, bonus);

			// Update both the cached formula string and the cached total so the card
			// header and total both reflect the adjustment.
			roll._formula = `${roll._formula} ${sign} ${Math.abs(adjustment)}[${flavor}]`;
			roll._total   = (roll._total ?? roll.total) + adjustment;
		} catch (err) {
			console.error("Elkan 5e | Skill critical adjustment error:", err);
		}
	});
}

/**
 * Applies engineering rule behavior.
 *
 */
export function engineering() {
	CONFIG.DND5E.skills.eng = {
		label: "Engineering",
		ability: "int",
		fullKey: "engineering",
		reference:
			"Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.AT8kvdogoKRgWLO9",
	};
}

/**
 * Registers setup Skill References configuration.
 *
 */
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
