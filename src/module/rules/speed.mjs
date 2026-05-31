/**
 * Registers custom movement types with the dnd5e system.
 * Must be called during the "init" hook so the types are in place
 * before actor data models are built.
 */
export function speed() {
	console.log("Elkan 5e  |  Initializing Speed");

	// Values are i18n keys, matching the pattern dnd5e uses for its built-in types.
	// The labels are defined in lang/en.json under elkan5e.Movement.
	const MOVEMENT_TYPES = {
		crawl: "elkan5e.Movement.Crawl",
		longJump: "elkan5e.Movement.LongJump",
		highJump: "elkan5e.Movement.HighJump",
	};

	Object.assign(CONFIG.DND5E.movementTypes, MOVEMENT_TYPES);
	console.log(
		"Elkan 5e  |  movementTypes after assign:",
		JSON.stringify(CONFIG.DND5E.movementTypes),
	);
}

