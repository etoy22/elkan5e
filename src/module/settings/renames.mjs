/**
 * Elkan 5e content that was renamed or replaced, so an old item on an actor can be matched to
 * its current version. Keys are the OLD identifier, values the NEW one. Each entry comes from
 * the changelog, apart from the four marked below that were confirmed by the maintainer.
 *
 * Left out on purpose: Stalwart Constitution/Strength -> Stalwart. Stalwart is now one feat taken
 * once per saving throw, and the old names are the only record of which save was chosen.
 */
export const RENAMED_IDENTIFIERS = {
	// "Monks now get the standard Unarmed Strike instead of a separate Unarmed Strike (Monk) weapon."
	"unarmed-strike-monk": "unarmed-strike",
	// "Ambidextrous Might renamed to Ambidexterity"
	"ambidextrous-might": "ambidexterity",
	// "Renamed Dueling to Single Weapon Fighting"
	"fighting-style-dueling": "fighting-style-single-weapon-fighting",
	"improved-fighting-style-dueling": "improved-single-weapon-fighting",
	// "Speak with Plants renamed to Speak with Nature ... Replaces Commune with Nature"
	"speak-with-plants": "speak-with-nature",
	"commune-with-nature": "speak-with-nature",
	// Specialist features, matched by identical descriptions (no changelog entry):
	"necromancy-specialization": "necromancy-specialist",
	"illusion-specialization": "illusion-specialist",
	"evocation-savant": "evocation-specialist",
	"divine-strike": "divine-strikes",
	// Subclass renames ("Deceiver (renamed from Trickery Domain)" and the lines around it):
	"trickery-domain": "deceiver",
	"life-domain": "lifebinder",
	"death-domain": "reaper",
	"open-hand": "windwalker",
	"fey-patron": "dreamweaver",
	"college-of-noise": "cacophony",
	"noise": "cacophony",
	"oath-of-devotion": "paragon",
	// "Ensnaring Strike renamed to Ensnaring Vine"
	"ensnaring-strike": "ensnaring-vine",
};

/**
 * Elkan features that no longer exist as items because dnd5e now provides them itself (the
 * standard actions). An actor's copy is removed by the features update when nothing in the
 * compendiums replaces it.
 */
export const RETIRED_IDENTIFIERS = new Set(["dodge", "help"]);
