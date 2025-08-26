/* global CONFIG, Hooks */
export function initWarlockSpellSlot() {
	CONFIG.DND5E.spellcasting.elkanWarlock = {
		label: "Spellcasting",
		type: "multi",
		cantrips: true,
		prepares: true,
		img: "systems/dnd5e/icons/spell-tiers/{id}.webp",

		order: 20,
		progression: {
			elkan: { label: "Elkan Warlock", divisor: 1, roundUp: true }
		},
		table: {
			0: { 0: 2 },                                      // char lvl 1 → index 0
			1: { 0: 2 },                                      // char lvl 2 → index 1
			2: { 0: 2, 1: 1 },                                // char lvl 3 → index 2
			3: { 0: 2, 1: 2 },                                // char lvl 4 → index 3
			4: { 0: 2, 1: 2, 2: 1 },                          // char lvl 5 → index 4
			5: { 0: 2, 1: 2, 2: 2 },                          // char lvl 6 → index 5
			6: { 0: 2, 1: 2, 2: 2, 3: 1 },                    // char lvl 7 → index 6
			7: { 0: 2, 1: 2, 2: 2, 3: 1 },                    // char lvl 8 → index 7
			8: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1 },              // char lvl 9 → index 8
			9: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1 },              // char lvl 10 → index 9
			10: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 },        // char lvl 11 → index 10
			11: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 },        // char lvl 12 → index 11
			12: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1 },  // char lvl 13 → index 12
			13: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1 },  // char lvl 14 → index 13
			14: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1 }, // char lvl 15 → index 14
			15: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1 }, // char lvl 16 → index 15
			16: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 }, // char lvl 17 → index 16
			17: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 }, // char lvl 18 → index 17
			18: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1 }, // char lvl 19 → index 18
			19: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1 }  // char lvl 20 → index 19
		},
		key: "spell"
	};
	// Optionally add recovery behavior
	CONFIG.DND5E.restTypes.long.recoverSpellSlotTypes.add("elkanWarlock");

}

