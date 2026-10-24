import { createLightRegion, planTeleportForOwner, t } from "../shared/helpers.mjs";

const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Runs Lurking Fog automation: a murky, low-hanging bank of fog.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function lurkingFogDarkness(workflow) {
	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 0,
				bright: 15,
				alpha: 0.3,
				luminosity: 0.5,
				negative: true,
				color: "#4a5d4a",
				animation: {
					type: "fog",
					speed: 2,
					intensity: 5,
				},
				priority: 30,
			},
			"Darkness",
		);
	}
}

/**
 * Runs arch Druid class feature automation.
 *
 * @param {*} actor - Actor document to process.
 */
export function archDruid(actor) {
	if (
		actor.items.find((i) => i.system.identifier === "archdruid") &&
		(game.user.isGM || actor.isOwner)
	) {
		ui.notifications.notify(
			game.i18n.format("elkan5e.notifications.ArchDruidNotification", {
				name: actor.name,
			}),
		);
	}
}

/**
 * Runs Shifting Sands at the end of the druid's turn: asks the druid which ally inside the area to
 * move, then lets that ally's owner move it up to 30 ft. through the ground (a teleport-style move,
 * so it doesn't provoke). Runs for the druid's owner, or the GM.
 *
 * @param {Combat} combat - Combat whose turn just changed.
 * @param {object} prior - The turn that just ended.
 * @returns {Promise<void>}
 */
export async function shiftingSandsTurnEnd(combat, prior) {
	const ended = prior?.combatantId ? combat.combatants.get(prior.combatantId) : null;
	const actor = ended?.actor;
	const tokenDoc = ended?.token;
	if (!actor || !tokenDoc) return;
	const responsible =
		game.users.find((u) => u.active && !u.isGM && actor.testUserPermission(u, "OWNER")) ??
		game.users.activeGM;
	if (!responsible?.isSelf) return;

	const items = new Set(
		actor.items.filter((i) => i.system?.identifier === "shifting-sands").map((i) => i.uuid),
	);
	if (!items.size) return;
	const region = tokenDoc.parent.regions.find((r) => items.has(r.getFlag("dnd5e", "item")));
	if (!region) return;

	const allies = [...region.tokens].filter((tk) => tk.disposition === tokenDoc.disposition);
	if (!allies.length) return;
	const choice = await DialogV2.wait({
		window: { title: t("elkan5e.druid.shiftingSandsTitle") },
		content: `<p>${t("elkan5e.druid.shiftingSandsContent", { name: actor.name })}</p>`,
		buttons: [
			...allies.map((tk) => ({ action: tk.id, label: tk.name })),
			{ action: "none", label: t("elkan5e.druid.shiftingSandsSkip"), default: true },
		],
		rejectClose: false,
	});
	const ally = allies.find((tk) => tk.id === choice);
	if (ally) await planTeleportForOwner(ally, 30, "blink");
}
