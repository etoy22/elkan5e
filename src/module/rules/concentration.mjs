/**
 * Registers a prepareDerivedData wrapper that reads
 * `flags.elkan5e.concentration.bonuses.save` from an actor and injects the
 * appropriate bonus into `system.attributes.concentration.bonuses.save`
 * before dnd5e finalises the concentration roll.
 *
 * Other active effects (spells, features, etc.) only need to set the flag:
 *
 *   0  →  no bonus
 *   1  →  proficiency bonus added to concentration saves
 *   2  →  double proficiency (expertise) added to concentration saves
 *
 * No second change is required — the module handles the translation
 * entirely in the background.
 */
export function registerConcentrationProficiency() {
	Hooks.once("setup", () => {
		const ActorClass = CONFIG.Actor?.documentClass;
		if (!ActorClass?.prototype?.prepareDerivedData) {
			console.warn(
				"Elkan 5e | Could not wrap prepareDerivedData for concentration proficiency.",
			);
			return;
		}

		const original = ActorClass.prototype.prepareDerivedData;

		ActorClass.prototype.prepareDerivedData = function (...args) {
			// Read the flag set by active effects (applyActiveEffects has already run).
			const level = Number(this.flags?.elkan5e?.concentration?.bonuses?.save ?? 0);

			if (level > 0) {
				const bonuses = this.system?.attributes?.concentration?.bonuses;
				if (bonuses !== undefined) {
					const prof = this.system?.attributes?.prof ?? 0;
					const bonus = level * prof;
					const existing = bonuses.save;

					if (typeof existing === "number") {
						bonuses.save = existing + bonus;
					} else if (typeof existing === "string" && existing.trim()) {
						bonuses.save = `${existing} + ${bonus}`;
					} else {
						bonuses.save = bonus;
					}
				}
			}

			return original.apply(this, args);
		};
	});
}
