/**
 * Registers custom movement types with the dnd5e system.
 * Must be called during the "init" hook so the types are in place
 * before actor data models are built.
 */
export function speed() {
	// Values are i18n keys, matching the pattern dnd5e uses for its built-in types.
	// The labels are defined in lang/en.json under elkan5e.movement.
	const MOVEMENT_TYPES = {
		crawl: { label: "elkan5e.movement.crawl" },
	};
	Object.assign(CONFIG.DND5E.movementTypes, MOVEMENT_TYPES);
}
