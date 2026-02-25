import {
	elementalAttunement,
	healingOverflow,
	hijackShadow,
	infusedHealer,
	lifeDrainGraveguard,
	meldWithShadows,
	necromanticSurge,
	rage,
	secondWind,
	shadowRefuge,
	slicingBlow,
	soulConduit,
	spectralEmpowerment,
	wildBlood,
} from "../module/classes/index.mjs";
import * as Spells from "../module/spells/index.mjs";

export function registerMacros() {
	// Expose macros
	globalThis.elkan5e = {
		macros: {
			spells: Spells,
			features: {
				rage,
				soulConduit,
				necromanticSurge,
				shadowRefuge,

				infusedHealer,
				healingOverflow,
				wildBlood,
				secondWind,
				hijackShadow,
				meldWithShadows,
				slicingBlow,
				elementalAttunement,
			},
			monsterFeatures: {
				lifeDrainGraveguard,
				spectralEmpowerment,
			},
		},
	};
}
