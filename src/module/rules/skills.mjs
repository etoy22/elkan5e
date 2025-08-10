/* global CONFIG */
/**
 * Adds Elkan 5e skill references to Foundry's DND5E config.
 */
export function skills() {
	if (!CONFIG.DND5E?.skills) return;
	// Map of skill keys to JournalEntryPage IDs in the compendium
	const SKILL_REFS = {
		acr: "Qw1Qw1Qw1Qw1Qw1Q", // Acrobatics
		ani: "Ww2Ww2Ww2Ww2Ww2W", // Animal Handling
		arc: "Ee3Ee3Ee3Ee3Ee3E", // Arcana
		ath: "Rr4Rr4Rr4Rr4Rr4R", // Athletics
		dec: "Tt5Tt5Tt5Tt5Tt5T", // Deception
		his: "Yy6Yy6Yy6Yy6Yy6Y", // History
		ins: "Uu7Uu7Uu7Uu7Uu7U", // Insight
		itm: "Ii8Ii8Ii8Ii8Ii8I", // Intimidation
		inv: "Oo9Oo9Oo9Oo9Oo9O", // Investigation
		med: "Pp0Pp0Pp0Pp0Pp0P", // Medicine
		nat: "Aa1Aa1Aa1Aa1Aa1A", // Nature
		prc: "Ss2Ss2Ss2Ss2Ss2S", // Perception
		prf: "Dd3Dd3Dd3Dd3Dd3D", // Performance
		per: "Ff4Ff4Ff4Ff4Ff4F", // Persuasion
		rel: "Gg5Gg5Gg5Gg5Gg5G", // Religion
		slt: "Hh6Hh6Hh6Hh6Hh6H", // Sleight of Hand
		ste: "Jj7Jj7Jj7Jj7Jj7J", // Stealth
		sur: "Kk8Kk8Kk8Kk8Kk8K", // Survival
	};
	function getSkillJournalRef(id) {
		return `Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.${id}`;
	}
	for (const [key, id] of Object.entries(SKILL_REFS)) {
		if (CONFIG.DND5E.skills[key]) {
			CONFIG.DND5E.skills[key].reference = getSkillJournalRef(id);
		}
	}
}
