import { registerPatreonModuleCTA } from "./ui/patreon.mjs";

import { gameSettingRegister } from "./settings/gameSettingRegister.mjs";
import { startDialog } from "./settings/dialog.mjs";

import { macros as barbarianMacros, rage, wildBlood } from "./features/classes/barbarian.mjs";
import { macros as clericMacros, healingOverflow, infusedHealer } from "./features/classes/cleric.mjs";
import { archDruid } from "./features/classes/druid.mjs";
import { macros as fighterMacros, secondWind } from "./features/classes/fighter.mjs";
import {
	macros as monkMacros,
	elementalAttunement,
	hijackShadow,
	meldWithShadows,
	rmvMeldShadow,
	rmvhijackShadow,
} from "./features/classes/monk.mjs";
import { macros as rogueMacros, slicingBlow } from "./features/classes/rogue.mjs";
import { delayedDuration, delayedItem, wildSurge } from "./features/classes/sorcerer.mjs";
import { initWarlockSpellSlot } from "./features/classes/warlock.mjs";
import {
	lifeDrainGraveguard,
	monsterMacros as wizardMonsterMacros,
	spectralEmpowerment,
} from "./features/classes/wizard.mjs";

import { armor, updateBarbarianDefense } from "./features/rules/armor.mjs";
import { conditions, conditionsReady } from "./features/rules/condition.mjs";
import { formating } from "./features/rules/format.mjs";
import { language } from "./features/rules/language.mjs";
import { setupReferences } from "./features/rules/references.mjs";
import { scroll } from "./features/rules/scroll.mjs";
import { skills } from "./features/rules/skills.mjs";
import { tools } from "./features/rules/tools.mjs";
import { weapons } from "./features/rules/weapon.mjs";

import * as Feats from "./features/feats.mjs";
import * as Spells from "./features/spells.mjs";

registerPatreonModuleCTA();


Hooks.once("init", async () => {
	try {
		console.log("Elkan 5e | Initializing Elkan 5e");
		await gameSettingRegister();

		initWarlockSpellSlot();

		// Initialize rule systems
		conditions();
		tools();
		weapons();
		armor();
		language();
		formating();
		scroll();
		skills();
		// Setup references
		setupReferences();
	} catch (error) {
		console.error("Elkan 5e  |  Initialization Error:", error);
	}
});

Hooks.once("ready", () => {
	try {
		conditionsReady();
		startDialog();
	} catch (error) {
		console.error("Elkan 5e | Ready Hook Error:", error);
	}
});

// Hit die customization
Hooks.on("dnd5e.preRollHitDieV2", (config) => {
	try {
		Feats.undeadNature(config);
	} catch (error) {
		console.error("Elkan 5e | Error in preRollHitDieV2 hook:", error);
	}
});

// Post-use activity (Sorcerer wild surge)
Hooks.on("dnd5e.postUseActivity", (activity, usageConfig) => {
	try {
		wildSurge(activity, usageConfig);
	} catch (error) {
		console.error("Elkan 5e | Error in postUseActivity hook:", error);
	}
});

// Initiative pre-roll (Druid archdruid)
Hooks.on("dnd5e.preRollInitiative", (actor) => {
	try {
		archDruid(actor);
	} catch (error) {
		console.error("Elkan 5e | Error in preRollInitiative hook:", error);
	}
});

// Active effect deletion hooks
Hooks.on("deleteActiveEffect", async (effect) => {
	try {
		await delayedDuration(effect);
	} catch (error) {
		console.error("Elkan 5e | Error in deleteActiveEffect hook:", error);
	}
});

// Item deletion hooks
Hooks.on("deleteItem", async (item) => {
	try {
		delayedItem(item);
	} catch (error) {
		console.error("Elkan 5e | Error in deleteItem hook:", error);
	}
});

// End of turn (Monk shadow meld cleanup)
Hooks.on("combatTurnChange", (combat, prior) => {
	try {
		const lastActor = combat.combatants.get(prior.combatantId).actor;
		rmvMeldShadow(lastActor);
		rmvhijackShadow(lastActor);
	} catch (error) {
		console.error("Elkan 5e | Error in combatTurnChange hook:", error);
	}
});

// Item update (Barbarian defense update)
Hooks.on("updateItem", (item) => {
	try {
		updateBarbarianDefense(item.parent, "updateItem");
	} catch (error) {
		console.error("Elkan 5e | Error in updateItem hook:", error);
	}
});

// Actor update (Barbarian defense update)
Hooks.on("updateActor", async (actor) => {
	try {
		await updateBarbarianDefense(actor, "updateActor");
	} catch (error) {
		console.error("Elkan 5e | Error in updateActor hook:", error);
	}
});

// Goodberry & size effects cleanup
Hooks.on("deleteActiveEffect", (effect) => {
	Spells.goodberryDeleteActive(effect);
	Spells.returnToNormalSize(effect);
});

Hooks.on("deleteItem", (item) => {
	Spells.goodberryDeleteItem(item);
});

// Template movement synchronization
Hooks.on("updateMeasuredTemplate", async (template) => {
	const lights = canvas.lighting.placeables.filter(
		(l) => l.document.getFlag("elkan5e", "linkedTemplate") === template.id,
	);
	if (!lights.length) return;
	for (const light of lights) {
		await light.document.update({ x: template.x, y: template.y });
	}
});

Hooks.on("deleteMeasuredTemplate", async (template) => {
	const lights = canvas.lighting.placeables.filter(
		(l) => l.document.getFlag("elkan5e", "linkedTemplate") === template.id,
	);
	if (!lights.length) return;
	const ids = lights.map((l) => l.id);
	await canvas.scene.deleteEmbeddedDocuments("AmbientLight", ids);
});

// Expose macros
const featureMacros = {
	...barbarianMacros,
	...clericMacros,
	...fighterMacros,
	...monkMacros,
	...rogueMacros,
};

const monsterFeatureMacros = {
	...wizardMonsterMacros,
};

globalThis.elkan5e ??= {};
const existingMacros = globalThis.elkan5e.macros ?? {};
globalThis.elkan5e.macros = {
	...existingMacros,
	spells: Spells,
	features: {
		...(existingMacros.features ?? {}),
		...featureMacros,
	},
	monsterFeatures: {
		...(existingMacros.monsterFeatures ?? {}),
		...monsterFeatureMacros,
	},
};
