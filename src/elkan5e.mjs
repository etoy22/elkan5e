import { rage, wildBlood } from "./module/classes/barbarian.mjs";
import { healingOverflow, infusedHealer, shadowRefuge, holyStrike } from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { secondWind } from "./module/classes/fighter.mjs";
import {
	elementalAttunement,
	hijackShadow,
	meldWithShadows,
	rmvhijackShadow,
	rmvMeldShadow,
} from "./module/classes/monk.mjs";
import { slicingBlow, sneakAttack } from "./module/classes/rogue.mjs";
import { delayedDuration, delayedItem, wildSurge } from "./module/classes/sorcerer.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
import { markForDeath } from "./module/classes/ranger.mjs";
import {
	lifeDrainGraveguard,
	necromanticSurge,
	soulConduit,
	spectralEmpowerment,
} from "./module/classes/wizard.mjs";
import { relentlessEndurance, undeadNature } from "./module/feats.mjs";
import { armor, updateBarbarianDefense } from "./module/rules/armor.mjs";
import {
	conditions,
	conditionsReady,
	handleHazardExhaustion,
} from "./module/rules/condition/setup.mjs";
import {
	grapple,
	handleDeadGrapplePrompt,
	handleGrapplerMove,
	handlePushedEffect,
} from "./module/rules/condition/grapple.mjs";
import { push } from "./module/rules/condition/push.mjs";
import { formating } from "./module/rules/format.mjs";
import { language } from "./module/rules/language.mjs";
import { refs } from "./module/rules/references.mjs";
import { scroll } from "./module/rules/scroll.mjs";
import { skills } from "./module/rules/skills.mjs";
import { tools, updateToolTypes } from "./module/rules/tools.mjs";
import { weapons } from "./module/rules/weapon.mjs";
import { startDialog } from "./module/settings/dialog.mjs";
import { gameSettingRegister, gameSettingsMigrate } from "./module/settings/game-settings.mjs";
import { deleteRegionLights, syncRegionLightSort } from "./module/shared/helpers.mjs";
import * as Cantrip from "./module/spells/cantrip.mjs";
import * as Level1 from "./module/spells/level-1.mjs";
import * as Level2 from "./module/spells/level-2.mjs";
import * as Level3 from "./module/spells/level-3.mjs";
import * as Level4 from "./module/spells/level-4.mjs";
import * as Level5 from "./module/spells/level-5.mjs";
import * as Level9 from "./module/spells/level-9.mjs";

const Spells = {
	...Cantrip,
	...Level1,
	...Level2,
	...Level3,
	...Level4,
	...Level5,
	...Level9,
};

/**
 * Registers Hooks.
 *
 */
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
		void (async () => {
			try {
				await gameSettingsMigrate();
				conditionsReady();
				updateToolTypes();
				await startDialog();
			} catch (error) {
				console.error("Elkan 5e | Ready Hook Error:", error);
			}
		})();
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
			await handleHazardExhaustion(effect);
		} catch (error) {
			console.error("Elkan 5e | Error in deleteActiveEffect hazard exhaustion hook:", error);
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

	Hooks.on("createActiveEffect", async (effect) => {
		try {
			await handlePushedEffect(effect);
		} catch (error) {
			console.error("Elkan 5e | Error in createActiveEffect pushed hook:", error);
		}

		try {
			await handleHazardExhaustion(effect);
		} catch (error) {
			console.error("Elkan 5e | Error in createActiveEffect hazard exhaustion hook:", error);
		}
	});

	Hooks.on("updateActiveEffect", async (effect, changes) => {
		try {
			await handlePushedEffect(effect, changes);
		} catch (error) {
			console.error("Elkan 5e | Error in updateActiveEffect pushed hook:", error);
		}

		try {
			await handleHazardExhaustion(effect);
		} catch (error) {
			console.error("Elkan 5e | Error in updateActiveEffect hazard exhaustion hook:", error);
		}
	});

	Hooks.on("updateItem", (item) => {
		try {
			updateBarbarianDefense(item.parent, "updateItem");
		} catch (error) {
			console.error("Elkan 5e | Error in updateItem hook:", error);
		}
	});

	Hooks.on("updateActor", async (actor, changes) => {
		try {
			await relentlessEndurance(actor, changes);
		} catch (error) {
			console.error("Elkan 5e | Error in relentlessEndurance hook:", error);
		}

		try {
			await updateBarbarianDefense(actor, "updateActor");
		} catch (error) {
			console.error("Elkan 5e | Error in updateActor hook:", error);
		}

		try {
			await handleDeadGrapplePrompt(actor);
		} catch (error) {
			console.error("Elkan 5e | Error in dead grapple prompt hook:", error);
		}
	});

	Hooks.on("updateToken", async (tokenDoc, changes) => {
		try {
			await handleGrapplerMove(tokenDoc, changes);
		} catch (error) {
			console.error("Elkan 5e | Error in updateToken grapple hook:", error);
		}
	});

	Hooks.on("combatTurnChange", (combat, prior) => {
		try {
			const priorCombatantId = prior?.combatantId;
			if (!priorCombatantId) return;
			const lastActor = combat?.combatants?.get(priorCombatantId)?.actor;
			if (!lastActor) return;
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

	Hooks.on("deleteRegion", async (region) => {
		try {
			await deleteRegionLights(region);
		} catch (error) {
			console.error("Elkan 5e | Error in deleteRegion light cleanup hook:", error);
		}
	});

	Hooks.on("createRegionBehavior", async (behavior) => {
		try {
			await syncRegionLightSort(behavior);
		} catch (error) {
			console.error("Elkan 5e | Error in createRegionBehavior light sort hook:", error);
		}
	});

	Hooks.on("updateRegionBehavior", async (behavior) => {
		try {
			await syncRegionLightSort(behavior);
		} catch (error) {
			console.error("Elkan 5e | Error in updateRegionBehavior light sort hook:", error);
		}
	});

	globalThis.elkan5e = {
		macros: {
			spells: Spells,
			features: {
				grapple,
				push,
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
				markForDeath,
				sneakAttack,
			},
			feats:{
				holyStrike,
			},
			monsterFeatures: {
				lifeDrain: lifeDrainGraveguard,
				lifeDrainGraveguard,
				spectralEmpowerment,
			},
		},
	};
}

registerHooks();
