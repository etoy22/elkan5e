export function initWarlockSpellSlot() {
	CONFIG.DND5E.spellcasting.elkanWarlock = {
		label: "Spellcasting (Elkan Warlock)",
		type: "multi",
		cantrips: true,
		prepares: true,
		img: "systems/dnd5e/icons/spell-tiers/{id}.webp",

		order: 20,
		progression: {
			elkan: { label: "Elkan Warlock", divisor: 1, roundUp: true },
		},
		table: {
			0: { 0: 2 },
			1: { 0: 2 },
			2: { 0: 2, 1: 1 },
			3: { 0: 2, 1: 2 },
			4: { 0: 2, 1: 2, 2: 1 },
			5: { 0: 2, 1: 2, 2: 2 },
			6: { 0: 2, 1: 2, 2: 2, 3: 1 },
			7: { 0: 2, 1: 2, 2: 2, 3: 1 },
			8: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1 },
			9: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1 },
			10: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 },
			11: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 },
			12: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1 },
			13: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1 },
			14: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1 },
			15: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1 },
			16: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
			17: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
			18: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1 },
			19: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1 },
		},
		key: "spell",
	};
	// Optionally add recovery behavior
	CONFIG.DND5E.restTypes.long.recoverSpellSlotTypes.add("elkanWarlock");
}
