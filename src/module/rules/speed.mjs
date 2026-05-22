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
	console.log("Elkan 5e  |  movementTypes after assign:", JSON.stringify(CONFIG.DND5E.movementTypes));
}

/**
 * Wraps Actor#prepareDerivedData to auto-calculate jump and crawl speeds.
 *
 * Long Jump  = Strength score in feet (running start)
 * High Jump  = max(1, 3 + Strength modifier) in feet (running start)
 * Crawl      = floor(walk / 2) in feet
 *
 * Must be called during the "setup" hook so the Actor class exists.
 */
export function wrapJumpCalculation() {
	const ActorClass = CONFIG.Actor?.documentClass;
	if (!ActorClass?.prototype?.prepareDerivedData) {
		console.warn("Elkan 5e | Could not wrap prepareDerivedData for jump speeds.");
		return;
	}

	const _original = ActorClass.prototype.prepareDerivedData;

	console.log("Elkan 5e  |  wrapJumpCalculation: wrapping prepareDerivedData");

	ActorClass.prototype.prepareDerivedData = function (...args) {
		const result = _original.apply(this, args);

		if (this.type !== "character" && this.type !== "npc") return result;

		const str = this.system?.abilities?.str;
		const movement = this.system?.attributes?.movement;

		console.log(`Elkan 5e  |  prepareDerivedData for ${this.name} | type=${this.type} | str=${str?.value} | movement keys:`, movement ? Object.keys(movement) : "none");

		if (!str || !movement) return result;

		// Long Jump (running start): Strength score in feet
		if (!movement.longJump) movement.longJump = str.value ?? 0;

		// High Jump (running start): 3 + Strength modifier, minimum 1
		if (!movement.highJump) movement.highJump = Math.max(1, 3 + (str.mod ?? 0));

		// Crawl: half walk speed, rounded down
		if (!movement.crawl) movement.crawl = Math.floor((movement.walk ?? 0) / 2);

		// Jump spell: triple Long Jump and High Jump.
		if (this.flags?.elkan5e?.movement?.tripleJump) {
			movement.longJump *= 3;
			movement.highJump *= 3;
		}

		console.log(`Elkan 5e  |  After calc: longJump=${movement.longJump} highJump=${movement.highJump} crawl=${movement.crawl}`);

		return result;
	};
}
