import {
	measureRangeDistance,
	removeStatuses,
	t,
	targetedActors,
	updateActorAsGM,
} from "../shared/helpers.mjs";

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
				t("elkan5e.paladin.cleansingTouchNothing", {
					name: actor.name,
					target: target.name,
				}),
			);
		}
	}
}

const DialogV2 = foundry.applications.api.DialogV2;
const STRICKENING_GAZE_RANGE = 120;

/**
 * Checks whether an item is one of the paladin's smites.
 *
 * @param {Item} item - Item to check.
 * @returns {boolean}
 */
const isSmite = (item) => /(^|-)smite$/.test(item?.system?.identifier ?? "");

/**
 * Runs Strickening Gaze class feature automation: when creatures within 120 ft. fail a saving throw
 * against the paladin's spell or smite, offers to spend a use to give one of them exhaustion.
 *
 * @param {object} workflow - MIDI-QOL workflow of the spell or smite.
 * @returns {Promise<void>}
 */
export async function strickeningGazePrompt(workflow) {
	const actor = workflow?.actor;
	const item = workflow?.item;
	if (!actor?.isOwner || !(item?.type === "spell" || isSmite(item))) return;

	const gaze = actor.items.find((i) => i.system?.identifier === "strickening-gaze");
	const activity = gaze?.system.activities.contents[0];
	const uses = gaze?.system.uses?.value ?? 0;
	if (!activity || uses <= 0) return;

	const origin = workflow.token;
	const targets = [...(workflow.failedSaves ?? [])].filter(
		(token) =>
			token.actor &&
			token.actor !== actor &&
			(!origin || measureRangeDistance(origin, token) <= STRICKENING_GAZE_RANGE),
	);
	if (!targets.length) return;

	const chosen = await DialogV2.wait({
		window: { title: gaze.name },
		content: `<p>${t("elkan5e.paladin.strickeningGazePrompt", {
			targets: targets.map((token) => token.name).join(", "),
			item: item.name,
			uses,
		})}</p>`,
		buttons: [
			...targets.map((token, i) => ({
				label: token.name,
				action: token.document.uuid,
				default: i === 0,
			})),
			{ label: t("Cancel"), action: "none" },
		],
		rejectClose: false,
	});
	if (!chosen || chosen === "none") return;

	if (globalThis.MidiQOL?.completeActivityUse) {
		await MidiQOL.completeActivityUse(
			activity,
			{ midiOptions: { targetUuids: [chosen], ignoreUserTargets: true } },
			{ configure: false },
		);
	} else {
		await activity.use({ strickeningGazeTargets: [chosen] }, { configure: false });
	}
}

/**
 * Applies Strickening Gaze's exhaustion when the feature is used, to the creature chosen by
 * {@link strickeningGazePrompt} or, when used by hand, the user's targets.
 *
 * @param {object} activity - Activity that was used.
 * @param {object} usageConfig - Usage configuration for the activation.
 * @returns {Promise<void>}
 */
export async function strickeningGaze(activity, usageConfig) {
	if (activity?.item?.system?.identifier !== "strickening-gaze") return;
	const actor = activity.actor;
	if (!actor?.isOwner) return;

	const uuids = usageConfig?.midiOptions?.targetUuids ?? usageConfig?.strickeningGazeTargets;
	const targets = uuids
		? (await Promise.all(uuids.map((uuid) => fromUuid(uuid).catch(() => null))))
				.map((doc) => doc?.actor ?? doc)
				.filter(Boolean)
		: targetedActors();

	const maxLevel = CONFIG.DND5E.conditionTypes.exhaustion?.levels ?? 6;
	for (const target of targets) {
		if (target.system?.traits?.ci?.value?.has("exhaustion")) {
			ui.notifications.info(
				t("elkan5e.paladin.strickeningGazeImmune", {
					name: actor.name,
					target: target.name,
				}),
			);
			continue;
		}
		const level = Number(target.system?.attributes?.exhaustion ?? 0);
		await updateActorAsGM(target, {
			"system.attributes.exhaustion": Math.min(level + 1, maxLevel),
		});
		ui.notifications.info(
			t("elkan5e.paladin.strickeningGazeApplied", { name: actor.name, target: target.name }),
		);
	}
}
