/**
 * Modify hit die rolls for characters with Undead Nature.
 *
 * Subtracts the Constitution modifier from the first hit die roll when the
 * actor has the Undead Nature feature but not the Gentle Repose effect.
 *
 * @param {object} config - The hit die roll configuration.
 * @param {Actor} config.subject - The actor rolling the hit die.
 * @returns {Promise<void>} Resolves once the configuration is updated.
 */
export async function undeadNature(config) {
	const actor = config.subject;
	const HAS_UNDEAD_NATURE = actor.items.find((feature) => feature.name === "Undead Nature");
	const HAS_GENTLE_REPOSE = actor.effects.find((effect) => effect.name === "Gentle Repose");
	// Subtract Constitution modifier from hit die roll for undead characters without Gentle Repose
	if (HAS_UNDEAD_NATURE && !HAS_GENTLE_REPOSE) {
		config.rolls[0].parts[0] += "-@abilities.con.mod";
	}
}
