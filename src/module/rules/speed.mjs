/**
 * Applies speed rule behavior.
 *
 * @returns {void} Operation result.
 */
export function speed() {
	console.log("Elkan 5e  |  Initializing Speed");

	const MOVEMENT_TYPES = {
		crawl: "Crawl",
		longJump: "Long Jump",
		highJump: "High Jump",
	};

	Object.assign(CONFIG.DND5E.movementTypes, MOVEMENT_TYPES);
}
