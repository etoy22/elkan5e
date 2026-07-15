import {
	rage,
	relentlessRage,
	wildBlood,
	onBloodragerRenderAdvancementManager,
	preBloodragerCreateItem,
	onBloodragerCreateItem,
	updateBloodragerOnLevelup,
	handleBloodragerDelete,
} from "./module/classes/barbarian.mjs";
import { undeadFortitude } from "./module/creatures/undead.mjs";
import {
	healingOverflow,
	infusedHealer,
	shadowRefuge,
	holyStrike,
} from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { secondWind } from "./module/classes/fighter.mjs";
import {
	elementalAttunement,
	hijackShadow,
	meldWithShadows,
	onCombatTurnChange,
} from "./module/classes/monk.mjs";
import { slicingBlow, sneakAttack } from "./module/classes/rogue.mjs";
import { delayedDuration, delayedItem, wildSurge } from "./module/classes/sorcerer.mjs";
import { initWarlockSpellSlot, onWarlockFilterInvocations } from "./module/classes/warlock.mjs";
import { markForDeath, markOfAffliction, markOfThorns } from "./module/classes/ranger.mjs";
import {
	lifeDrainGraveguard,
	necromanticSurge,
	soulConduit,
	spectralEmpowerment,
} from "./module/classes/wizard.mjs";
import {
	relentlessEndurance,
	undeadNature,
	initFeatIdentifierMap,
	onFilterOwnedFeats,
} from "./module/feats.mjs";
import { armor, updateBarbarianDefense } from "./module/rules/armor.mjs";
import { speed } from "./module/rules/speed.mjs";
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
import {
	handleBurningCreate,
	handleBurningDelete,
	quenchBurning,
} from "./module/rules/condition/burning.mjs";
import { push } from "./module/rules/condition/push.mjs";
import { formating } from "./module/rules/format.mjs";
import { language } from "./module/rules/language.mjs";
import { refs } from "./module/rules/references.mjs";
import { scroll } from "./module/rules/scroll.mjs";
import { skills } from "./module/rules/skills.mjs";
import { tools, updateToolTypes } from "./module/rules/tools.mjs";
import { weapons } from "./module/rules/weapon.mjs";
import {
	onPreRestCompleted,
	onRestCompleted,
	onPreUpdateActorDeathSaves,
} from "./module/rules/death-saves.mjs";
import { startDialog } from "./module/settings/dialog.mjs";
import { gameSettingRegister, gameSettingsMigrate } from "./module/settings/game-settings.mjs";
import {
	deleteRegionLights,
	handleDeleteMeasuredTemplate,
	handleUpdateMeasuredTemplate,
	registerDaeSpecials,
	syncRegionLightSort,
} from "./module/shared/helpers.mjs";
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
			speed();

			// Hides pact-specific invocations from advancement dialogs for actors
			// that don't have the corresponding pact boon.
			Hooks.on("renderApplication", onWarlockFilterInvocations);

			// Hides already-owned (non-repeatable) feats from advancement dialogs.
			Hooks.on("renderApplication", onFilterOwnedFeats);

			Hooks.on("renderAdvancementManager", async (app, ..._rest) => {
				try {
					await onBloodragerRenderAdvancementManager(app);
				} catch (error) {
					console.error(
						"Elkan 5e | Error in renderAdvancementManager Bloodrager hook:",
						error,
					);
				}
			});

			Hooks.on("preCreateItem", (item, data, options, userId) => {
				try {
					return preBloodragerCreateItem(item, data, options, userId);
				} catch (error) {
					console.error("Elkan 5e | Error in preCreateItem Bloodrager hook:", error);
				}
			});

			Hooks.on("createItem", async (item, options, userId) => {
				try {
					await onBloodragerCreateItem(item, options, userId);
				} catch (error) {
					console.error("Elkan 5e | Error in createItem Bloodrager hook:", error);
				}
			});

			// Registers custom DAE effect fields for push resistance.
			Hooks.on("dae.modifySpecials", registerDaeSpecials);
		} catch (error) {
			console.error("Elkan 5e  |  Initialization Error:", error);
		}
	});

	Hooks.once("ready", () => {
		void (async () => {
			try {
				await gameSettingsMigrate();
				await initFeatIdentifierMap();
				conditionsReady();
				updateToolTypes();
				await startDialog();

				// Registers custom DAE auto-fields so they appear in the DAE field picker.
				globalThis.DAE?.addAutoFields?.([
					"flags.elkan5e.pushResist",
					"flags.elkan5e.undeadFortitude",
					"flags.elkan5e.undeadFortitudeDCModifier",
				]);
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

	Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
		try {
			await Spells.sanctuary(workflow);
		} catch (error) {
			console.error("Elkan 5e | Error in Sanctuary hook:", error);
		}
	});

	Hooks.on("midi-qol.AttackRollComplete", async (workflow) => {
		try {
			await Spells.mirrorImage(workflow);
		} catch (error) {
			console.error("Elkan 5e | Error in Mirror Image hook:", error);
		}
	});

	Hooks.on("midi-qol.RollComplete", async (workflow) => {
		try {
			await markOfAffliction(workflow);
		} catch (error) {
			console.error("Elkan 5e | Error in Mark of Affliction hook:", error);
		}

		try {
			await markOfThorns(workflow);
		} catch (error) {
			console.error("Elkan 5e | Error in Mark of Thorns hook:", error);
		}
		try {
			await Spells.fireShield(workflow);
		} catch (error) {
			console.error("Elkan 5e | Error in Fire Shield hook:", error);
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
			await handleBurningDelete(effect);
		} catch (error) {
			console.error("Elkan 5e | Error in deleteActiveEffect burning hook:", error);
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

	Hooks.on("deleteItem", async (item, options, userId) => {
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

		try {
			await handleBloodragerDelete(item, options, userId);
		} catch (error) {
			console.error("Elkan 5e | Error in Bloodrager delete cleanup hook:", error);
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

		try {
			await handleBurningCreate(effect);
		} catch (error) {
			console.error("Elkan 5e | Error in createActiveEffect burning hook:", error);
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

	Hooks.on("dnd5e.preApplyDamage", (actor, amount, updates, options) => {
		try {
			return undeadFortitude(actor, amount, updates, options);
		} catch (error) {
			console.error("Elkan 5e | Error in undeadFortitude hook:", error);
		}

		try {
			return relentlessRage(actor, amount, updates, options);
		} catch (error) {
			console.error("Elkan 5e | Error in relentlessRage hook:", error);
		}
	});

	Hooks.on("dnd5e.damageActor", async (actor, changes, update, userId) => {
		try {
			await relentlessEndurance(actor, changes, update, userId);
		} catch (error) {
			console.error("Elkan 5e | Error in relentlessEndurance hook:", error);
		}

		try {
			await Level4.deathWard(actor, changes, update, userId);
		} catch (error) {
			console.error("Elkan 5e | Error in deathWard hook:", error);
		}
	});

	Hooks.on("preUpdateActor", (actor, changes, options) => {
		try {
			onPreUpdateActorDeathSaves(actor, changes, options);
		} catch (error) {
			console.error("Elkan 5e | Error in preUpdateActor death save hook:", error);
		}
	});

	Hooks.on("dnd5e.preRestCompleted", (actor, result) => {
		try {
			onPreRestCompleted(actor, result);
		} catch (error) {
			console.error("Elkan 5e | Error in preRestCompleted death save hook:", error);
		}
	});

	Hooks.on("dnd5e.restCompleted", async (actor, result) => {
		try {
			await onRestCompleted(actor, result);
		} catch (error) {
			console.error("Elkan 5e | Error in restCompleted death save hook:", error);
		}
	});

	Hooks.on("updateActor", async (actor, changes) => {
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

		try {
			await updateBloodragerOnLevelup(actor, changes);
		} catch (error) {
			console.error("Elkan 5e | Error in Bloodrager level-up spell pool hook:", error);
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
			onCombatTurnChange(combat, prior);
		} catch (error) {
			console.error("Elkan 5e | Error in combatTurnChange hook:", error);
		}

		Level1.sanctuarySuccessCache.clear();
	});

	Hooks.on("updateMeasuredTemplate", async (template) => {
		try {
			await handleUpdateMeasuredTemplate(template);
		} catch (error) {
			console.error("Elkan 5e | Error in updateMeasuredTemplate hook:", error);
		}
	});

	Hooks.on("deleteMeasuredTemplate", async (template) => {
		try {
			await handleDeleteMeasuredTemplate(template);
		} catch (error) {
			console.error("Elkan 5e | Error in deleteMeasuredTemplate hook:", error);
		}
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
				quenchBurning,
			},
			feats: {
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
