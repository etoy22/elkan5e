/* global CONFIG */
/**
 * Add additional movement types to the DND5E system.
 *
 * Currently registers crawl, long jump, and high jump movement options.
 *
 * @returns {void}
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
