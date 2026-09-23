/**
 * Runs second Wind class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function secondWind(workflow) {
	const actor = workflow.actor;
	persistentLeader(actor);
	rallySurge(actor);
}

/**
 * Runs persistent Leader class feature automation.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function persistentLeader(actor) {
	if (actor.items.find((i) => i.system.identifier === "persistent-leader")) {
		const rallyFeature = actor.items.find((i) => i.system.identifier === "rally");

		if (rallyFeature) {
			rallyFeature.update({
				"system.uses.spent": Math.max(rallyFeature.system.uses.spent - 1, 0),
			});
		}

		if (game.user.isGM || actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.PersistentLeader", {
					name: actor.name,
				}),
			);
		}
	}
}

/**
 * Improved Critical: critical hits with attacks roll three times the number of damage dice instead of two.
 * Must stay synchronous so the multiplier is set before the damage roll is built.
 *
 * @param {*} rollConfig - Damage roll process configuration.
 */
export function improvedCriticalDamage(rollConfig) {
	const activity = rollConfig?.subject;
	if (activity?.type !== "attack") return;
	if (!activity.actor?.items.some((i) => i.system.identifier === "improved-critical")) return;
	rollConfig.critical = { ...rollConfig.critical, multiplier: 3 };
}

/**
 * Runs rally Surge class feature automation.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function rallySurge(actor) {
	if (actor.items.find((i) => i.system.identifier === "rallying-surge")) {
		if (game.user.isGM || actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.RallyingSurge", {
					name: actor.name,
				}),
			);
		}
	}
}
