import { measureRangeDistance } from "./shared/helpers.mjs";

const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Handles Relentless Endurance.
 * Triggered by the dnd5e.damageActor hook after damage has been applied.
 *
 * @param {Actor5e} actor - Actor document that was damaged.
 * @returns {Promise<void>}
 */
export async function relentlessEndurance(actor) {
	if (!actor) return;
	if (Number(actor.system?.attributes?.hp?.value) !== 0) return;

	const feature = actor.items.find(
		(item) =>
			item.system?.identifier === "relentless-endurance" &&
			item.system?.source?.book === "Elkan 5e",
	);
	if (!feature) return;

	const max = Number(feature.system?.uses?.max ?? 0);
	const spent = Number(feature.system?.uses?.spent ?? 0);
	const remaining = max > 0 ? Math.max(max - spent, 0) : 0;
	if (remaining <= 0) return;

	const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
	const promptUser =
		game.users.find((u) => u.active && !u.isGM && actor.testUserPermission(u, ownerLevel)) ??
		game.users.find((u) => u.active && u.isGM) ??
		null;
	if (!promptUser || promptUser.id !== game.user?.id) return;

	const confirmed = await DialogV2.confirm({
		window: { title: "Relentless Endurance" },
		content: `<p><strong>${actor.name}</strong> would drop to 0 HP. Use Relentless Endurance to drop to 1 HP instead? (${remaining} use${remaining === 1 ? "" : "s"} remaining)</p>`,
		rejectClose: false,
		modal: true,
	});

	if (!confirmed) return;

	await actor.update({ "system.attributes.hp.value": 1 });
	await feature.update({ "system.uses.spent": Math.min(spent + 1, max) });
}

/**
 * Handles undead Nature.
 *
 * @param {*} config - Configuration object.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function undeadNature(config) {
	const actor = config.subject;
	const HAS_UNDEAD_NATURE = actor.items.find((feature) => feature.name === "Undead Nature");
	const HAS_GENTLE_REPOSE = actor.effects.find((effect) => effect.name === "Gentle Repose");
	// Subtract Constitution modifier from hit die roll for undead characters without Gentle Repose
	if (HAS_UNDEAD_NATURE && !HAS_GENTLE_REPOSE) {
		config.rolls[0].parts[0] += "-@abilities.con.mod";
	}
}

/**
 * Whether an actor's attack with a Marksman-eligible weapon is ranged or thrown at a target, and
 * whether midi-qol already treats it as a ranged weapon attack.
 *
 * @param {Activity} activity - Attack activity.
 * @param {Token} [target] - Target token.
 * @returns {{eligible: boolean, thrown: boolean}}
 */
function marksmanAttack(activity, target) {
	const actor = activity?.actor;
	const item = activity?.item;
	if (!actor?.flags?.elkan5e?.marksman || item?.type !== "weapon") return { eligible: false };
	if (!(item.system.prof?.multiplier > 0)) return { eligible: false };
	if (activity.actionType === "rwak") return { eligible: true, thrown: false };
	if (!item.system.properties?.has("thr") || !target) return { eligible: false };
	const token = actor.getActiveTokens()?.[0];
	const reach = item.system.range?.reach || 5;
	const thrown = !!token && measureRangeDistance(token, target) > reach;
	return { eligible: thrown, thrown };
}

/**
 * Marksman: cover gives a target less protection against your ranged and thrown weapon attacks.
 * Half cover gives no bonus, and three-quarters cover counts as half cover. Midi-QOL's sharpShooter
 * flag (set by the feat) already removes half cover from ranged weapon attacks; this adds the rest
 * to the attack roll: 3 against three-quarters cover, and 2 against half cover on thrown attacks.
 *
 * @param {object} config - Attack roll configuration from dnd5e.preRollAttackV2.
 */
export function marksmanCover(config) {
	const target = game.user.targets.first();
	const { eligible, thrown } = marksmanAttack(config?.subject, target);
	if (!eligible) return;
	const targetActor = target?.actor;
	if (!targetActor || targetActor.statuses?.has("coverTotal")) return;
	const cover = targetActor.system?.attributes?.ac?.cover ?? 0;
	const bonus = cover >= 5 ? 3 : cover >= 2 && thrown ? 2 : 0;
	if (!bonus) return;
	const label = game.i18n.localize("elkan5e.feats.marksman");
	config.rolls?.[0]?.parts?.push(`${bonus}[${label}]`);
}

/**
 * Marksman: no disadvantage for attacking at long range with a ranged or thrown weapon.
 *
 * @param {Workflow} workflow - Midi-QOL workflow, before attack advantage is worked out.
 */
export function marksmanLongRange(workflow) {
	if (!workflow?.longRangeAttack) return;
	if (marksmanAttack(workflow.activity, workflow.targets?.first()).eligible) {
		workflow.longRangeAttack = false;
	}
}
