import { removeStatuses, t, targetedActors } from "../shared/helpers.mjs";

/**
 * Counts how many Lay on Hands points an activity spent.
 *
 * @param {object} activity - Activity that was used.
 * @param {object} usageConfig - Usage configuration for the activation.
 * @returns {number} Points spent from the Lay on Hands pool.
 */
function layOnHandsPointsSpent(activity, usageConfig) {
	const actor = activity.actor;
	let spent = 0;
	for (const target of activity.consumption?.targets ?? []) {
		if (target.type !== "itemUses") continue;
		const pool = target.target
			? (actor.items.get(target.target.split(".").at(-1)) ??
				actor.items.find((i) => i._stats?.compendiumSource === target.target))
			: activity.item;
		if (pool?.system?.identifier !== "lay-on-hands") continue;
		spent += Number(target.value) || 0;
		if (target.scaling?.mode === "amount") spent += Number(usageConfig?.scaling) || 0;
	}
	return spent;
}

/**
 * Runs Cleansing Touch class feature automation. Spending Lay on Hands points to cleanse
 * removes the poisoned condition from the targets, and spending 10 or more points at once
 * (whether healing or cleansing) also ends the drained condition.
 *
 * @param {object} activity - Activity that was used.
 * @param {object} usageConfig - Usage configuration for the activation.
 * @returns {Promise<void>}
 */
export async function cleansingTouch(activity, usageConfig) {
	const actor = activity?.actor;
	if (!actor?.items.some((i) => i.system?.identifier === "cleansing-touch")) return;

	const spent = layOnHandsPointsSpent(activity, usageConfig);
	if (!spent) return;

	// Cleansing uses are the utility activities, whether on Cleansing Touch or granted to Lay on Hands.
	const statuses = [];
	if (activity.type === "utility") statuses.push("poisoned");
	if (spent >= 10) statuses.push("drained");
	if (!statuses.length) return;

	for (const target of targetedActors()) {
		const removed = await removeStatuses(target, statuses);
		if (removed.length) {
			ui.notifications.info(
				t("elkan5e.paladin.cleansingTouchRemoved", {
					name: actor.name,
					conditions: removed.join(", "),
					target: target.name,
				}),
			);
		} else if (activity.type === "utility") {
			ui.notifications.info(
				t("elkan5e.paladin.cleansingTouchNothing", { name: actor.name, target: target.name }),
			);
		}
	}
}
