import {
	archDruid,
	delayedDuration,
	delayedItem,
	elementalAttunement,
	healingOverflow,
	hijackShadow,
	infusedHealer,
	initWarlockSpellSlot,
	lifeDrainGraveguard,
	meldWithShadows,
	necromanticSurge,
	rage,
	rmvMeldShadow,
	rmvhijackShadow,
	secondWind,
	shadowRefuge,
	slicingBlow,
	soulConduit,
	spectralEmpowerment,
	wildBlood,
	wildSurge,
} from "./module/classes/index.mjs";
import { undeadNature } from "./module/feats/index.mjs";
import {
	armor,
	conditions,
	conditionsReady,
	formating,
	language,
	refs,
	scroll,
	skills,
	tools,
	updateBarbarianDefense,
	updateToolTypes,
	weapons,
} from "./module/rules/index.mjs";
import { gameSettingRegister, gameSettingsMigrate, startDialog } from "./module/settings/index.mjs";
import * as Spells from "./module/spells/index.mjs";

function registerHooks() {
	Hooks.once("init", async () => {
		try {
			console.log("Elkan 5e | Initializing Elkan 5e");
			await gameSettingRegister();
			initWarlockSpellSlot();

			conditions();
			tools();
			weapons();
			armor();
			language();
			formating();
			scroll();
			skills();
			refs();
		} catch (error) {
			console.error("Elkan 5e  |  Initialization Error:", error);
		}
	});

	Hooks.once("ready", () => {
		try {
			gameSettingsMigrate();
			conditionsReady();
			updateToolTypes();
			startDialog();
		} catch (error) {
			console.error("Elkan 5e | Ready Hook Error:", error);
		}
	});

	Hooks.on("dnd5e.preRollHitDieV2", (config) => {
		try {
			undeadNature(config);
		} catch (error) {
			console.error("Elkan 5e | Error in preRollHitDieV2 hook:", error);
		}
	});

	Hooks.on("dnd5e.postUseActivity", (activity, usageConfig) => {
		try {
			wildSurge(activity, usageConfig);
		} catch (error) {
			console.error("Elkan 5e | Error in postUseActivity hook:", error);
		}
	});

	Hooks.on("dnd5e.preRollInitiative", (actor) => {
		try {
			archDruid(actor);
		} catch (error) {
			console.error("Elkan 5e | Error in preRollInitiative hook:", error);
		}
	});

	Hooks.on("deleteActiveEffect", async (effect) => {
		try {
			await delayedDuration(effect);
		} catch (error) {
			console.error("Elkan 5e | Error in deleteActiveEffect hook:", error);
		}

		try {
			await Promise.resolve(Spells.goodberryDeleteActive(effect));
		} catch (error) {
			console.error("Elkan 5e | Error cleaning goodberry effect:", error);
		}

		try {
			await Promise.resolve(Spells.returnToNormalSize(effect));
		} catch (error) {
			console.error("Elkan 5e | Error restoring token size:", error);
		}
	});

	Hooks.on("deleteItem", async (item) => {
		try {
			await delayedItem(item);
		} catch (error) {
			console.error("Elkan 5e | Error in deleteItem hook:", error);
		}

		try {
			await Promise.resolve(Spells.goodberryDeleteItem(item));
		} catch (error) {
			console.error("Elkan 5e | Error cleaning goodberry item:", error);
		}
	});

	Hooks.on("updateItem", (item) => {
		try {
			updateBarbarianDefense(item.parent, "updateItem");
		} catch (error) {
			console.error("Elkan 5e | Error in updateItem hook:", error);
		}
	});

	Hooks.on("updateActor", async (actor) => {
		try {
			await updateBarbarianDefense(actor, "updateActor");
		} catch (error) {
			console.error("Elkan 5e | Error in updateActor hook:", error);
		}
	});

	Hooks.on("combatTurnChange", (combat, prior) => {
		try {
			const lastActor = combat.combatants.get(prior.combatantId).actor;
			rmvMeldShadow(lastActor);
			rmvhijackShadow(lastActor);
		} catch (error) {
			console.error("Elkan 5e | Error in combatTurnChange hook:", error);
		}
	});

	Hooks.on("updateMeasuredTemplate", async (template) => {
		const lights = canvas.lighting.placeables.filter(
			(light) => light.document.getFlag("elkan5e", "linkedTemplate") === template.id,
		);
		if (!lights.length) return;
		for (const light of lights) {
			await light.document.update({ x: template.x, y: template.y });
		}
	});

	Hooks.on("deleteMeasuredTemplate", async (template) => {
		const lights = canvas.lighting.placeables.filter(
			(light) => light.document.getFlag("elkan5e", "linkedTemplate") === template.id,
		);
		if (!lights.length) return;
		const ids = lights.map((light) => light.id);
		await canvas.scene.deleteEmbeddedDocuments("AmbientLight", ids);
	});

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

registerHooks();
