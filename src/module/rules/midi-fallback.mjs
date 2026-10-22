// Runs the module's Midi-QOL workflow automation from dnd5e's own hooks when Midi-QOL isn't active.
// Each handler was written for a Midi workflow, so these hooks build a stand-in object with the
// workflow fields that handler reads (actor, item, activity, targets, saves, damage, ...).
//
// Without Midi there's no single workflow per use: attacks, saves and damage are separate rolls,
// often made by different users. So each feature runs at the dnd5e step it depends on:
//   targeting       -> dnd5e.preUseActivity (stops the use, runs the prompts, then uses it again)
//   attack modifiers -> dnd5e.preRollAttackV2, results -> dnd5e.rollAttackV2
//   save modifiers  -> dnd5e.preRollSavingThrowV2, failed saves -> createChatMessage (caster's client)
//   damage changes  -> dnd5e.preRollDamageV2 (stops the roll, runs the prompts, then rolls again)
//   damage dealt    -> dnd5e.applyDamage (client applying the damage)

import { infusedHealer } from "../classes/cleric.mjs";
import { strickeningGazePrompt } from "../classes/paladin.mjs";
import { markOfAffliction, markOfThorns, preciseHunterAdvantage } from "../classes/ranger.mjs";
import { finishingBlow } from "../classes/rogue.mjs";
import { carefulSpell, elementalInfusion, savantSpellReminder } from "../classes/sorcerer.mjs";
import { powerOfLoveAndFearApply, powerOfLoveAndFearPrompt } from "../classes/warlock.mjs";
import { necromanticSurge } from "../classes/wizard.mjs";
import { suddenWarning } from "../origin/background.mjs";
import { tokenForActor, withTargets } from "../shared/midi-compat.mjs";
import {
	ensnaringVineSize,
	gentleCurrent,
	prismaticBolt,
	sanctuary,
	sanctuarySuccessCache,
} from "../spells/level-1.mjs";
import { mirrorImage, shatter } from "../spells/level-2.mjs";
import { spectralLance } from "../spells/level-3.mjs";
import {
	blight,
	blightMaximizePlantDamage,
	blightPlantDisadvantage,
	fireShield,
} from "../spells/level-4.mjs";
import { disintegrate, sunbeam } from "../spells/level-6.mjs";
import { painReflection } from "../spells/level-7.mjs";
import { darknessAttackDisadvantage } from "./condition/vision.mjs";

// Usage/roll config flag marking a use or roll this module already stopped and restarted.
const RESOLVED_FLAG = "elkan5eMidiFallback";

const hasFeature = (actor, identifier) =>
	Boolean(actor?.items.some((i) => i.system?.identifier === identifier));

/**
 * Builds the workflow stand-in shared by every hook.
 *
 * @param {Activity} activity - Activity being used or rolled.
 * @param {Token[]} [targets] - Tokens it targets.
 * @returns {object}
 */
function fallbackWorkflow(activity, targets = []) {
	const actor = activity?.actor;
	return {
		actor,
		token: tokenForActor(actor),
		item: activity?.item,
		activity,
		targets: new Set(targets),
		hitTargets: new Set(targets),
		failedSaves: new Set(),
		saves: new Set(),
		damageList: [],
	};
}

/**
 * Tokens recorded as targets on a chat message.
 *
 * @param {ChatMessage} message - Usage or roll message.
 * @returns {Token[]}
 */
const messageTargets = (message) =>
	(message?.system?.targets ?? [])
		.map((target) => fromUuidSync(target.token, { strict: false })?.object)
		.filter(Boolean);

/* -------------------------------------------- */
/*  Targeting                                   */
/* -------------------------------------------- */

// Features that run before targets roll anything. `applies` must be synchronous: it decides
// whether the use is stopped so `run` can prompt.
const TARGETING = [
	{
		name: "Sanctuary",
		applies: (activity, targets) => {
			if (activity.type !== "attack" || targets.length !== 1) return false;
			const defender = targets[0].actor;
			if (!defender?.effects.some((e) => !e.disabled && e.name === "Sanctuary")) return false;
			return !sanctuarySuccessCache.has(`${activity.actor.id}-${defender.id}`);
		},
		run: sanctuary,
	},
	{
		name: "Careful Spell",
		applies: (activity, targets) =>
			activity.type === "save" &&
			targets.length > 0 &&
			activity.actor.effects.some((e) => e.name === "Careful Spell" && !e.disabled),
		run: carefulSpell,
	},
	{
		name: "Power of Love and Fear",
		applies: (activity) =>
			activity.item.type === "spell" &&
			activity.item.system.level >= 1 &&
			activity.type === "save" &&
			Boolean(activity.save?.ability?.has?.("wis")) &&
			activity.actor.isOwner &&
			hasFeature(activity.actor, "power-of-love-and-fear"),
		run: powerOfLoveAndFearPrompt,
	},
	{
		name: "Blight",
		applies: (activity, targets) =>
			activity.item.system?.identifier === "blight" && targets.length > 0,
		run: blight,
	},
];

/**
 * Stops an activity use that a targeting feature applies to, so its prompts can run first.
 *
 * @param {Activity} activity - Activity being used (on a clone of the item).
 * @param {object} usage - Usage configuration.
 * @param {object} dialog - Dialog configuration.
 * @param {object} message - Message configuration.
 * @returns {false|void}
 */
function onPreUseActivity(activity, usage, dialog, message) {
	if (usage?.[RESOLVED_FLAG] || !activity?.actor) return;
	const targets = Array.from(game.user.targets);
	const features = TARGETING.filter((f) => f.applies(activity, targets));
	if (!features.length) return;
	resolveTargeting(activity, targets, features, usage, dialog, message).catch((error) =>
		console.error("Elkan 5e | Error running targeting automation:", error),
	);
	return false;
}

/**
 * Runs the targeting features, drops creatures they excluded from the use's targets, then uses
 * the activity again. An attack whose only target was excluded (Sanctuary) isn't made.
 *
 * @param {Activity} activity - Activity being used.
 * @param {Token[]} targets - The user's targets.
 * @param {object[]} features - Targeting features that apply.
 * @param {object} usage - Usage configuration.
 * @param {object} dialog - Dialog configuration.
 * @param {object} message - Message configuration.
 * @returns {Promise<void>}
 */
async function resolveTargeting(activity, targets, features, usage, dialog, message) {
	const workflow = fallbackWorkflow(activity, targets);
	for (const feature of features) {
		try {
			await feature.run(workflow);
		} catch (error) {
			console.error(`Elkan 5e | Error in ${feature.name} targeting automation:`, error);
		}
	}
	if (activity.type === "attack" && targets.length && !workflow.targets.size) return;

	const excluded = new Set(
		(workflow.elkan5eExcludedTargets ?? []).map((t) => t?.document?.uuid ?? t?.uuid),
	);
	const descriptors = message?.data?.system?.targets;
	if (excluded.size && descriptors) {
		message.data.system.targets = descriptors.filter((d) => !excluded.has(d.token));
	}
	if (workflow.elkan5eLoveAndFear) {
		foundry.utils.setProperty(
			message,
			"data.flags.elkan5e.loveAndFear",
			workflow.elkan5eLoveAndFear,
		);
	}

	// The hook's activity belongs to a clone of the item, so use the actor's own copy.
	const original =
		activity.actor.items.get(activity.item.id)?.system.activities.get(activity.id) ?? activity;
	await original.use({ ...usage, [RESOLVED_FLAG]: true }, dialog, message);
}

/**
 * Runs features that react to an activity being used.
 *
 * @param {Activity} activity - Activity that was used.
 * @param {object} usage - Usage configuration.
 * @param {object} results - Usage results.
 */
function onPostUseActivity(activity, usage, results) {
	if (!activity?.actor) return;
	const workflow = fallbackWorkflow(activity, messageTargets(results?.message));
	if (activity.item.type === "spell") {
		workflow.castData = {
			castLevel: activity.item.system.level + (Number(usage?.scaling) || 0),
		};
	}
	for (const [name, run] of [
		["Necromantic Surge", necromanticSurge],
		["Gentle Current", gentleCurrent],
	]) {
		Promise.resolve(run(workflow)).catch((error) =>
			console.error(`Elkan 5e | Error in ${name} automation:`, error),
		);
	}
}

/* -------------------------------------------- */
/*  Attacks                                     */
/* -------------------------------------------- */

/**
 * Applies the features that give an attack advantage or disadvantage.
 *
 * @param {object} config - Attack roll process configuration.
 */
function onPreRollAttack(config) {
	const activity = config?.subject;
	if (!activity?.actor) return;
	const workflow = fallbackWorkflow(activity, Array.from(game.user.targets));
	workflow.attackRollModifierTracker = {
		advantage: { add: () => (config.advantage = true) },
		disadvantage: { add: () => (config.disadvantage = true) },
	};
	// Both handlers set the tracker before their first await, so the roll sees it.
	for (const [name, run] of [
		["darkness disadvantage", darknessAttackDisadvantage],
		["Precise Hunter", preciseHunterAdvantage],
	]) {
		Promise.resolve(run(workflow)).catch((error) =>
			console.error(`Elkan 5e | Error in ${name} automation:`, error),
		);
	}
}

/**
 * Runs features that react to an attack roll.
 *
 * @param {D20Roll[]} rolls - Attack rolls.
 * @param {object} data
 * @param {Activity} data.subject - Attacking activity.
 */
function onRollAttack(rolls, { subject } = {}) {
	if (!subject?.actor || !rolls?.length) return;
	const workflow = fallbackWorkflow(subject, Array.from(game.user.targets));
	workflow.attackRoll = rolls[0];
	workflow.attackTotal = rolls[0].total;
	mirrorImage(workflow).catch((error) =>
		console.error("Elkan 5e | Error in Mirror Image automation:", error),
	);
}

/* -------------------------------------------- */
/*  Saving Throws                               */
/* -------------------------------------------- */

const SAVE_MODIFIERS = [
	shatter,
	spectralLance,
	sunbeam,
	disintegrate,
	blightPlantDisadvantage,
	ensnaringVineSize,
];

/**
 * Applies the features that give a creature advantage or disadvantage on a save against a
 * particular spell. The save button records the spell on the roll's message.
 *
 * @param {object} config - Saving throw process configuration.
 * @param {object} _dialog - Dialog configuration.
 * @param {object} message - Message configuration.
 */
function onPreRollSavingThrow(config, _dialog, message) {
	const item = fromUuidSync(message?.data?.system?.item?.uuid ?? "", { strict: false });
	const actor = config?.subject;
	if (!item || !actor) return;
	const target = { actor, document: tokenForActor(actor)?.document };
	const workflow = { actor: item.actor, item };
	const saveDetails = { advantage: false, disadvantage: false };
	for (const modify of SAVE_MODIFIERS) {
		try {
			modify(target, workflow, saveDetails);
		} catch (error) {
			console.error(`Elkan 5e | Error in ${modify.name} save automation:`, error);
		}
	}
	if (saveDetails.advantage) config.advantage = true;
	if (saveDetails.disadvantage) config.disadvantage = true;
}

/**
 * Runs features that react to a creature failing a save against an activity. Every client sees
 * the save's message; these run on the client of the user who used the activity.
 *
 * @param {ChatMessage} message - Created chat message.
 */
function onSaveMessage(message) {
	if (message?.type !== "save") return;
	const usage = message.getOriginatingMessage?.();
	if (!usage || usage === message || !usage.isAuthor) return;
	const roll = message.rolls?.[0];
	const token = message.getAssociatedToken()?.object;
	const activity = usage.getAssociatedActivity?.();
	if (!roll?.isFailure || !token || activity?.type !== "save") return;

	const workflow = fallbackWorkflow(activity, [token]);
	Object.assign(workflow, {
		saveActivity: activity,
		failedSaves: new Set([token]),
		targetSaveDetails: { [token.document.uuid]: { saveRoll: roll } },
		elkan5eLoveAndFear: usage.getFlag("elkan5e", "loveAndFear"),
		// Midi updates its save display after a reroll; the reroll's own chat card does that here.
		updateSaveFailSets: () => {},
		buildSaveDisplayEntry: async () => {},
	});
	for (const [name, run] of [
		["Power of Love and Fear", powerOfLoveAndFearApply],
		["Strickening Gaze", strickeningGazePrompt],
		["Sudden Warning", suddenWarning],
	]) {
		Promise.resolve(run(workflow)).catch((error) =>
			console.error(`Elkan 5e | Error in ${name} automation:`, error),
		);
	}
}

/* -------------------------------------------- */
/*  Damage                                      */
/* -------------------------------------------- */

// Workflow stand-ins for damage rolls, by the usage message they belong to, so a choice made on
// one damage roll (Prismatic Bolt's type, Elemental Infusion) carries over to the rest of the cast.
const damageWorkflows = new Map();

/**
 * The most recent usage message for an activity, from which its damage is being rolled.
 *
 * @param {Activity} activity - Activity rolling damage.
 * @returns {ChatMessage|undefined}
 */
const lastUsageMessage = (activity) =>
	game.messages.contents.findLast(
		(m) =>
			!m.rolls.length &&
			(m.system?.activity?.uuid ?? m.getFlag("dnd5e", "activity.uuid")) === activity.uuid,
	);

/**
 * Stops a damage roll that a damage-changing feature applies to, so it can prompt first.
 *
 * @param {object} config - Damage roll process configuration.
 * @param {object} dialog - Dialog configuration.
 * @param {object} message - Message configuration.
 * @returns {false|void}
 */
function onPreRollDamage(config, dialog, message) {
	const activity = config?.subject;
	const item = activity?.item;
	if (config?.[RESOLVED_FLAG] || !item || !activity.actor) return;
	const prismatic = item.system?.identifier === "prismatic-bolt" && activity.type === "attack";
	const infusion =
		item.type === "spell" &&
		activity.actor.isOwner &&
		activity.actor.items.some((i) => i.flags?.elkan5e?.infusionTypes);
	if (!prismatic && !infusion) return;
	rerollDamage(activity, config, dialog, message).catch((error) =>
		console.error("Elkan 5e | Error running damage automation:", error),
	);
	return false;
}

/**
 * Runs the damage-changing features, which change the activity's damage parts for one roll,
 * then rolls the damage again.
 *
 * @param {Activity} activity - Activity rolling damage.
 * @param {object} config - Damage roll process configuration.
 * @param {object} dialog - Dialog configuration.
 * @param {object} message - Message configuration.
 * @returns {Promise<void>}
 */
async function rerollDamage(activity, config, dialog, message) {
	const key = lastUsageMessage(activity)?.id ?? activity.uuid;
	let workflow = damageWorkflows.get(key);
	if (!workflow) {
		workflow = fallbackWorkflow(activity);
		damageWorkflows.clear();
		damageWorkflows.set(key, workflow);
	}
	await prismaticBolt(workflow, activity, config, dialog);
	await elementalInfusion(workflow, activity, config, dialog);

	// The rolls are rebuilt from the changed damage parts; the rest of the config carries over.
	const { rolls: _rolls, subject: _subject, hookNames: _hookNames, ...rest } = config;
	await activity.rollDamage({ ...rest, [RESOLVED_FLAG]: true }, dialog, message);
}

/**
 * Runs features that react to a damage or healing roll.
 *
 * @param {DamageRoll[]} rolls - Damage rolls.
 * @param {object} data
 * @param {Activity} data.subject - Activity that rolled.
 */
function onRollDamage(rolls, { subject } = {}) {
	if (!subject?.actor || !rolls?.length) return;
	if (!subject.actor.items.some((i) => i.system?.identifier === "infused-healer")) return;
	const workflow = fallbackWorkflow(subject, Array.from(game.user.targets));
	infusedHealer(workflow).catch((error) =>
		console.error("Elkan 5e | Error in Infused Healer automation:", error),
	);
}

// Damage roll messages whose once-per-roll reminders were already shown.
const remindedRolls = new Set();
// Highest damage each roll dealt to one creature so far, for Pain Reflection.
const highestDamage = new Map();

/**
 * Runs features that react to damage being dealt, once per creature it's applied to.
 *
 * @param {Actor} actor - Actor that took the damage.
 * @param {number} amount - Damage dealt (negative for healing).
 * @param {object} options - Damage application options.
 */
function onApplyDamage(actor, amount, options) {
	const roll = options?.origin;
	const activity = roll?.getAssociatedActivity?.();
	const token = tokenForActor(actor);
	if (!(amount > 0) || !activity?.actor || !token) return;

	const usage = roll.getOriginatingMessage?.();
	const outcome = usage?.system?.outcomes?.get?.(token.document.uuid);
	const workflow = fallbackWorkflow(activity, [token]);
	Object.assign(workflow, {
		failedSaves: new Set(outcome === "failure" ? [token] : []),
		saves: new Set(outcome === "success" ? [token] : []),
		damageRoll: roll.rolls[0],
		damageRolls: roll.rolls,
		damageList: [
			{
				targetUuid: token.document.uuid,
				actorUuid: actor.uuid,
				hpDamage: amount,
				tempDamage: 0,
				saved: outcome === "success",
			},
		],
	});

	const run = (name, handler, data = workflow) =>
		Promise.resolve(handler(data)).catch((error) =>
			console.error(`Elkan 5e | Error in ${name} automation:`, error),
		);
	// Mark of Affliction's save is made against the user's targets.
	run("Mark of Affliction", () => withTargets([token.id], () => markOfAffliction(workflow)));
	run("Mark of Thorns", markOfThorns);
	run("Fire Shield", fireShield);
	run("Blight", blightMaximizePlantDamage);
	run("Finishing Blow", finishingBlow);

	if (!remindedRolls.has(roll.id)) {
		remindedRolls.add(roll.id);
		run("savant spell reminder", savantSpellReminder);
	}

	// Pain Reflection reflects half the most damage the roll dealt to one creature. Damage is
	// applied one creature at a time here, so only the amount above the previous highest counts.
	const previous = highestDamage.get(roll.id) ?? 0;
	if (amount > previous) {
		highestDamage.set(roll.id, amount);
		const extra = Math.floor(amount / 2) - Math.floor(previous / 2);
		run("Pain Reflection", painReflection, {
			...workflow,
			damageList: [{ targetUuid: null, actorUuid: null, hpDamage: extra * 2, tempDamage: 0 }],
		});
	}
}

/* -------------------------------------------- */

/**
 * Registers the dnd5e hooks that run Midi-QOL workflow automation when Midi-QOL isn't active.
 * Called once on init; does nothing when Midi-QOL is active.
 */
export function registerMidiFallback() {
	if (game.modules.get("midi-qol")?.active) return;
	console.log("Elkan 5e | Midi-QOL isn't active; running automation from dnd5e hooks.");
	Hooks.on("dnd5e.preUseActivity", onPreUseActivity);
	Hooks.on("dnd5e.postUseActivity", onPostUseActivity);
	Hooks.on("dnd5e.preRollAttackV2", onPreRollAttack);
	Hooks.on("dnd5e.rollAttackV2", onRollAttack);
	Hooks.on("dnd5e.preRollSavingThrowV2", onPreRollSavingThrow);
	Hooks.on("createChatMessage", onSaveMessage);
	Hooks.on("dnd5e.preRollDamageV2", onPreRollDamage);
	Hooks.on("dnd5e.rollDamageV2", onRollDamage);
	Hooks.on("dnd5e.applyDamage", onApplyDamage);
}
