import { rage, wildBlood, onBloodragerCreateItem, updateBloodragerOnLevelup, handleBloodragerDelete, preHandleBloodragerDelete } from "./module/classes/barbarian.mjs";
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
	rmvhijackShadow,
	rmvMeldShadow,
} from "./module/classes/monk.mjs";
import { slicingBlow, sneakAttack } from "./module/classes/rogue.mjs";
import { delayedDuration, delayedItem, wildSurge } from "./module/classes/sorcerer.mjs";
import { initWarlockSpellSlot, onWarlockFilterInvocations } from "./module/classes/warlock.mjs";
import { markForDeath } from "./module/classes/ranger.mjs";
import {
	lifeDrainGraveguard,
	necromanticSurge,
	soulConduit,
	spectralEmpowerment,
} from "./module/classes/wizard.mjs";
import { relentlessEndurance, undeadNature, initFeatIdentifierMap, onFilterOwnedFeats } from "./module/feats.mjs";
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
	// Wraps prepareDerivedData to inject concentration save bonuses from the
	// flags.elkan5e.concentration.bonuses.save flag set by active effects.
	// Must run during setup (after init, before ready) so the prototype is in place.
	Hooks.once("setup", () => {
		const ActorClass = CONFIG.Actor?.documentClass;
		if (!ActorClass?.prototype?.prepareDerivedData) {
			console.warn("Elkan 5e | Could not wrap prepareDerivedData for concentration proficiency.");
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

			// Hides pact-specific invocations from advancement dialogs for actors
			// that don't have the corresponding pact boon.
			Hooks.on("renderApplication", onWarlockFilterInvocations);

			// Hides already-owned (non-repeatable) feats from advancement dialogs.
			Hooks.on("renderApplication", onFilterOwnedFeats);

			// Handles Bloodrager origin selection, subclass rename, spell pool
			// population, and Seething Blood / Wild Blood grants when the subclass
			// item is first added to an actor.
			Hooks.on("createItem", async (item, options, userId) => {
				try {
					await onBloodragerCreateItem(item, options, userId);
				} catch (error) {
					console.error("Elkan 5e | Error in createItem Bloodrager hook:", error);
				}
			});

			// Registers custom DAE effect fields for push resistance and fire damage.
			Hooks.on("dae.modifySpecials", (_actorType, specials) => {
				const BooleanField = foundry.data.fields.BooleanField;
				const StringField = foundry.data.fields.StringField;
				specials["flags.elkan5e.pushResist"] = [
					new BooleanField({
						label: game.i18n.localize("elkan5e.push.effects.pushResist"),
						hint: game.i18n.localize("elkan5e.push.effects.pushResistDescription"),
					}),
					CONST.ACTIVE_EFFECT_MODES.CUSTOM,
				];
				specials["system.traits.dm.amount.fire"] = [
					new StringField({
						label: game.i18n.localize("elkan5e.burning.effects.fireDamageTaken"),
						hint: game.i18n.localize("elkan5e.burning.effects.fireDamageTakenDescription"),
					}),
					CONST.ACTIVE_EFFECT_MODES.CUSTOM,
				];
			});

			// Applies ±5 adjustment to skill rolls on a natural 20 / natural 1
			// when the skillCriticalAdjustment setting is enabled.
			Hooks.on("dnd5e.rollSkillV2", (rolls, _data) => {
				try {
					const roll = rolls?.[0];
					if (!roll) return;

					const d20 = roll.dice?.find((d) => d.faces === 20);
					if (!d20) return;

					const natural = d20.results?.[0]?.result;
					if (!natural) return;
					if (!game.settings.get("elkan5e", "skillCriticalAdjustment")) return;

					let adjustment = 0;
					if (natural === 1) adjustment = -5;
					else if (natural === 20) adjustment = 5;
					if (adjustment === 0) return;

					const flavor = adjustment > 0 ? "Natural 20 Bonus" : "Natural 1 Penalty";
					const sign = adjustment > 0 ? "+" : "-";

					// Append the adjustment as visible terms so it appears in the roll breakdown.
					const operator = new foundry.dice.terms.OperatorTerm({ operator: sign });
					const bonus = new foundry.dice.terms.NumericTerm({
						number: Math.abs(adjustment),
						options: { flavor },
					});
					operator._evaluated = true;
					bonus._evaluated = true;
					roll.terms.push(operator, bonus);

					// Update both the cached formula string and the cached total so the card
					// header and total both reflect the adjustment.
					roll._formula = `${roll._formula} ${sign} ${Math.abs(adjustment)}[${flavor}]`;
					roll._total = (roll._total ?? roll.total) + adjustment;
				} catch (err) {
					console.error("Elkan 5e | Skill critical adjustment error:", err);
				}
			});
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
					"system.traits.dm.amount.fire",
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

	Hooks.on("preDeleteItem", async (item, options, userId) => {
		try {
			await preHandleBloodragerDelete(item, options, userId);
		} catch (error) {
			console.error("Elkan 5e | Error in preDeleteItem Bloodrager name reset hook:", error);
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
