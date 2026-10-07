import {
	drainedEffect,
	forEachDamagedTarget,
	markUsedThisTurn,
	measureRangeDistance,
	t,
	updateActorAsGM,
	usedThisTurn,
} from "../shared/helpers.mjs";

const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Runs slicing Blow class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function slicingBlow(workflow) {
	const casterUuid = workflow.token?.actor?.uuid;
	if (!workflow.actor || !workflow.token) {
		console.warn("Slicing Blow aborted: missing actor or actorToken");
		return;
	}

	await forEachDamagedTarget(workflow, async (token, damage) => {
		await drainedEffect(
			token.actor,
			damage,
			"Slicing Blow",
			"icons/skills/melee/strike-sword-blood-red.webp",
			casterUuid,
		);
	});
}

const SNEAK_ATTACK_FLAG = "sneakAttackTime";
const INCAPACITATING = [
	"incapacitated",
	"paralyzed",
	"petrified",
	"stunned",
	"unconscious",
	"dead",
];

/**
 * Checks whether the rogue can Sneak Attack again. After a Sneak Attack, they can't use it again
 * until the beginning of their next turn. Always available outside combat.
 *
 * @param {Actor} actor - Rogue attacking.
 * @returns {boolean}
 */
function sneakAttackAvailable(actor) {
	const combat = game.combat;
	const used = actor.getFlag("elkan5e", SNEAK_ATTACK_FLAG);
	if (!combat?.started || used?.combatId !== combat.id) return true;

	const ownTurns = combat.turns
		.map((c, i) => (c.actor?.uuid === actor.uuid ? i : -1))
		.filter((i) => i >= 0);
	if (!ownTurns.length) return !(used.round === combat.round && used.turn === combat.turn);

	// The first of the rogue's own turns that starts after the Sneak Attack.
	const laterThisRound = ownTurns.find((i) => i > used.turn);
	const next =
		laterThisRound === undefined
			? { round: used.round + 1, turn: ownTurns[0] }
			: { round: used.round, turn: laterThisRound };
	return combat.round > next.round || (combat.round === next.round && combat.turn >= next.turn);
}

/**
 * Records a Sneak Attack. Does nothing outside combat.
 *
 * @param {Actor} actor - Rogue attacking.
 * @returns {Promise<void>}
 */
async function markSneakAttackUsed(actor) {
	const combat = game.combat;
	if (!combat?.started) return;
	await actor.setFlag("elkan5e", SNEAK_ATTACK_FLAG, {
		combatId: combat.id,
		round: combat.round,
		turn: combat.turn,
	});
}

/**
 * Checks whether a weapon attack meets Sneak Attack's criteria: advantage on the attack, or another
 * creature hostile to the target within 5 ft. of it that isn't incapacitated. Enforcer's Training
 * also allows creatures the rogue is grappling, and Lethal Opening allows attacks of opportunity.
 *
 * @param {object} workflow - MIDI-QOL workflow of the attack.
 * @param {Token} target - Creature that was hit.
 * @returns {boolean}
 */
function meetsSneakAttackCriteria(workflow, target) {
	const actor = workflow.actor;
	const advantage =
		workflow.attackRoll?.hasAdvantage ?? (workflow.advantage && !workflow.disadvantage);
	if (advantage) return true;

	const distance = (a, b) =>
		globalThis.MidiQOL?.computeDistance
			? MidiQOL.computeDistance(a, b, { wallsBlock: false })
			: measureRangeDistance(a, b);
	const flanked = canvas.tokens.placeables.some(
		(t) =>
			t !== target &&
			t.document !== workflow.token?.document &&
			t.actor &&
			t.actor.system.attributes?.hp?.value > 0 &&
			!INCAPACITATING.some((s) => t.actor.statuses.has(s)) &&
			t.document.disposition !== target.document.disposition &&
			distance(t, target) <= 5,
	);
	if (flanked) return true;

	if (
		hasFeature(actor, "enforcers-training") &&
		target.actor?.effects.some(
			(e) =>
				e.flags?.elkan5e?.grapple?.grapplerUuid === actor.uuid &&
				e.statuses?.has("grappled"),
		)
	)
		return true;

	// Attacks of opportunity are the melee attacks a rogue makes outside their own turn.
	const combat = game.combat;
	return (
		hasFeature(actor, "lethal-opening") &&
		workflow.activity.actionType === "mwak" &&
		Boolean(combat?.started) &&
		combat.combatant?.actor?.uuid !== actor.uuid
	);
}

/**
 * Runs Sneak Attack class feature automation as a MIDI-QOL damage bonus. When a weapon attack
 * (not a heavy melee weapon) hits and meets the criteria, Sneak Attack's damage is added to the
 * weapon's damage, doubled on a critical hit. Rogues with precision attacks choose between Sneak
 * Attack and their precision attacks, which roll their own save and damage against the target.
 *
 * @param {object} args - MIDI-QOL macro arguments, or the workflow itself.
 * @returns {Promise<Roll[]|{}>} Bonus damage rolls.
 */
export async function sneakAttack(args) {
	try {
		const workflow = args?.workflow ?? args;
		const actor = workflow?.actor;
		const weapon = workflow?.item;
		const actionType = workflow?.activity?.actionType;
		if (!actor?.isOwner || !workflow.token || !["mwak", "rwak"].includes(actionType)) return {};
		if (weapon?.type !== "weapon") return {};
		if (actionType === "mwak" && weapon.system.properties?.has("hvy")) return {};

		const target = workflow.hitTargets?.first();
		if (!target || !sneakAttackAvailable(actor)) return {};

		const sneakItem = actor.items.find((i) => i.system?.identifier === "sneak-attack");
		if (!sneakItem || !meetsSneakAttackCriteria(workflow, target)) return {};

		// Rogues with precision attacks choose which one to use.
		const precisionFeatures = actor.items.filter(
			(i) => i !== sneakItem && i.system?.type?.subtype === "precision",
		);
		let choice = "sneak";
		if (precisionFeatures.length) {
			choice = await DialogV2.wait({
				window: { title: t("elkan5e.rogue.sneakAttackTitle") },
				content: `<p>${t("elkan5e.rogue.sneakAttackContent", { target: target.name })}</p>`,
				buttons: [
					{ label: sneakItem.name, action: "sneak", default: true },
					...precisionFeatures.map((f) => ({ label: f.name, action: f.id })),
					{ label: t("elkan5e.rogue.sneakAttackNone"), action: "none" },
				],
				rejectClose: false,
			});
			if (!choice || choice === "none") return {};
		}

		await markSneakAttackUsed(actor);

		// A precision attack rolls its own save, damage and effects against the target.
		if (choice !== "sneak") {
			const activity = actor.items.get(choice)?.system.activities.contents[0];
			if (!activity) return {};
			const midiOptions = {
				targetUuids: [target.document.uuid],
				ignoreUserTargets: true,
				isCritical: workflow.isCritical,
			};
			const use = globalThis.MidiQOL?.completeActivityUse
				? MidiQOL.completeActivityUse(activity, { midiOptions }, { configure: false })
				: activity.use({}, { configure: false });
			Promise.resolve(use).catch((error) => console.error("Sneak Attack |", error));
			return {};
		}

		// Sneak Attack adds its damage to the weapon's, using the weapon's damage type.
		const part = sneakItem.system.activities.getByType("damage")[0]?.damage?.parts?.[0];
		const formula = part?.formula || "(@scale.rogue.sneak-attack)d6";
		const type =
			workflow.damageRolls?.[0]?.options?.type ??
			[...(weapon.system.damage?.base?.types ?? [])][0] ??
			"piercing";
		const roll = new CONFIG.Dice.DamageRoll(formula, sneakItem.getRollData(), {
			type,
			flavor: sneakItem.name,
			isCritical: workflow.isCritical,
		});
		return [await roll.evaluate()];
	} catch (err) {
		console.error("Sneak Attack |", err);
		return {};
	}
}

const hasFeature = (actor, identifier) =>
	Boolean(actor?.items.some((i) => i.system?.identifier === identifier));

/**
 * Runs Finishing Blow class feature automation: after a weapon hit leaves a creature with
 * 10 hit points or fewer, prompts the assassin to reduce it to 0 hit points. Once per turn.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {Promise<void>}
 */
export async function finishingBlow(workflow) {
	const actor = workflow.actor;
	if (!actor?.isOwner || !["mwak", "rwak"].includes(workflow.activity?.actionType)) return;
	if (!hasFeature(actor, "finishing-blow")) return;

	await forEachDamagedTarget(workflow, async (token) => {
		const target = token.actor;
		const hp = target?.system?.attributes?.hp;
		if (!hp || usedThisTurn(actor, "finishingBlowTime")) return;
		const remaining = (Number(hp.value) || 0) + (Number(hp.temp) || 0);
		if (hp.value <= 0 || remaining > 10) return;

		const confirmed = await DialogV2.confirm({
			window: { title: t("elkan5e.rogue.finishingBlowTitle") },
			content: `<p>${t("elkan5e.rogue.finishingBlowContent", { target: target.name, hp: remaining })}</p>`,
			rejectClose: false,
			modal: true,
		});
		if (!confirmed) return;
		await markUsedThisTurn(actor, "finishingBlowTime");
		await updateActorAsGM(target, {
			"system.attributes.hp.value": 0,
			"system.attributes.hp.temp": 0,
		});
	});
}

/**
 * Runs Brutal Fighting class feature automation: after the rogue wins a shove or grapple
 * contest, prompts them to deal their Brutal Fighting damage to that creature.
 *
 * @param {object} workflow - Workflow of the shove or grapple.
 * @param {Token} targetToken - Creature that was shoved or grappled.
 * @param {"shove"|"grapple"} action - Which contest was won.
 * @returns {Promise<void>}
 */
export async function brutalFighting(workflow, targetToken, action) {
	const actor = workflow?.actor;
	if (!actor?.isOwner || !targetToken?.actor) return;
	const feature = actor.items.find((i) => i.system?.identifier === "brutal-fighting");
	const damage = feature?.system.activities.getByType("damage")[0];
	if (!damage) return;

	const actionLabel = t(
		action === "grapple"
			? "elkan5e.rogue.brutalFightingGrapple"
			: "elkan5e.rogue.brutalFightingShove",
	);
	const confirmed = await DialogV2.confirm({
		window: { title: t("elkan5e.rogue.brutalFightingTitle") },
		content: `<p>${t("elkan5e.rogue.brutalFightingContent", { action: actionLabel, target: targetToken.actor.name })}</p>`,
		rejectClose: false,
		modal: true,
	});
	if (!confirmed) return;

	if (globalThis.MidiQOL?.completeActivityUse) {
		await MidiQOL.completeActivityUse(
			damage,
			{
				midiOptions: {
					targetUuids: [targetToken.document.uuid],
					ignoreUserTargets: true,
				},
			},
			{ configure: false },
		);
	} else {
		await damage.use({}, { configure: false });
	}
}

const REFLEXES_FLAG = "assassinsReflexes";

/**
 * Runs Assassin's Reflexes class feature automation when combat starts: every assassin who
 * isn't surprised gets a second combatant at their initiative minus 10. Runs on the active GM.
 *
 * @param {Combat} combat - Combat that started.
 * @returns {Promise<void>}
 */
export async function assassinsReflexesStart(combat) {
	if (!game.users.activeGM?.isSelf) return;
	const extraTurns = combat.combatants
		.filter(
			(c) =>
				!c.getFlag("elkan5e", REFLEXES_FLAG) &&
				c.initiative !== null &&
				hasFeature(c.actor, "assassins-reflexes") &&
				!c.actor.statuses.has("surprised"),
		)
		.map((c) => ({
			tokenId: c.tokenId,
			sceneId: c.sceneId,
			actorId: c.actorId,
			name: t("elkan5e.rogue.assassinsReflexesTurn", { name: c.name }),
			initiative: c.initiative - 10,
			hidden: c.hidden,
			flags: { elkan5e: { [REFLEXES_FLAG]: c.id } },
		}));
	if (extraTurns.length) await combat.createEmbeddedDocuments("Combatant", extraTurns);
}

/**
 * Removes the extra Assassin's Reflexes turns once the first round is over. Runs on the active GM.
 *
 * @param {Combat} combat - Combat that changed.
 * @param {object} changes - Changes to the combat.
 * @returns {Promise<void>}
 */
export async function assassinsReflexesEnd(combat, changes) {
	if (!game.users.activeGM?.isSelf || !(changes.round > 1)) return;
	const ids = combat.combatants
		.filter((c) => c.getFlag("elkan5e", REFLEXES_FLAG))
		.map((c) => c.id);
	if (ids.length) await combat.deleteEmbeddedDocuments("Combatant", ids);
}
