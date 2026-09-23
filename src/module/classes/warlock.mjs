import { push } from "../rules/condition/push.mjs";
import { markUsedThisTurn, t, usedThisTurn } from "../shared/helpers.mjs";

const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Maps each pact identifier to the item IDs of invocations that require it.
 * Used to hide wrong-pact invocations from the advancement choice dialog.
 */
const PACT_INVOCATION_IDS = {
	"pact-of-the-chain": new Set([
		"W35yiXw2c7pP9VYq", // Bonded Transposition (Chain)
		"0DujGo03Z1E18c7A", // Familiar's Blast (Chain)
		"oQk819H0v53a3xQB", // Familiar's Cloak (Chain)
		"mfq3bMMSsxv64kM0", // Shared Life (Chain)
		"h8zo2cifVsE9X8Uy", // Voice of the Chain Master (Chain)
	]),
	"pact-of-the-tome": new Set([
		"Eoy9E4sb8gMSxi03", // Book of Magical Secrets (Tome)
		"vINGSaFuXG5d8FhS", // Book of Rituals (Tome)
	]),
	"pact-of-the-warrior": new Set([
		"c1lEKIaiHk8rQNMa", // Eldritch Weapon (Warrior)
		"QC6cUJbTMX1ZX2LK", // Extra Attack (Warrior)
		"f9RrkxWmBTX6uLSm", // Pact Armor (Warrior)
	]),
};

/**
 * Hook callback for "renderApplication". Hides pact-specific invocations from
 * the advancement dialog when the actor doesn't have the required pact boon.
 * Runs on every renderApplication so it catches both the initial render and any
 * re-renders as the player navigates through advancement steps.
 *
 * @param {Application} app  - The rendered application.
 * @param {HTMLElement|jQuery} html - The rendered HTML.
 */
export function onWarlockFilterInvocations(app, html) {
	try {
		const actor = app.actor;
		if (!actor) return;

		// Only apply to warlocks
		const isWarlock = actor.items.some(
			(i) => i.type === "class" && i.system?.identifier === "warlock",
		);
		if (!isWarlock) return;

		// Find which pact (if any) the actor currently has
		const actorPact = Object.keys(PACT_INVOCATION_IDS).find((pact) =>
			actor.items.some((i) => i.system?.identifier === pact),
		);

		// Collect all item IDs that belong to a pact the actor does NOT have
		const idsToHide = new Set();
		for (const [pact, ids] of Object.entries(PACT_INVOCATION_IDS)) {
			if (pact !== actorPact) {
				for (const id of ids) idsToHide.add(id);
			}
		}
		if (idsToHide.size === 0) return;

		// Support both HTMLElement (FoundryVTT v12+ ApplicationV2) and jQuery
		const root = html instanceof HTMLElement ? html : html[0];
		if (!root) return;

		for (const id of idsToHide) {
			const matches = root.querySelectorAll(`[data-uuid*="${id}"], [data-item-id="${id}"]`);
			for (const el of matches) {
				const row = el.closest("li, .item, tr, [class*='item-choice']") ?? el;
				row.style.display = "none";
			}
		}
	} catch (error) {
		console.error("Elkan 5e | Error filtering warlock invocations:", error);
	}
}

/**
 * Runs init Warlock Spell Slot class feature automation.
 *
 */
export function initWarlockSpellSlot() {
	CONFIG.DND5E.spellcasting.elkanWarlock = {
		label: "Spellcasting (Elkan Warlock)",
		type: "multi",
		cantrips: true,
		prepares: true,
		img: "systems/dnd5e/icons/spell-tiers/{id}.webp",

		order: 20,
		progression: {
			elkan: { label: "Elkan Warlock", divisor: 1, roundUp: true },
		},
		table: {
			0: { 0: 2 },
			1: { 0: 2 },
			2: { 0: 2, 1: 1 },
			3: { 0: 2, 1: 2 },
			4: { 0: 2, 1: 2, 2: 1 },
			5: { 0: 2, 1: 2, 2: 2 },
			6: { 0: 2, 1: 2, 2: 2, 3: 1 },
			7: { 0: 2, 1: 2, 2: 2, 3: 1 },
			8: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1 },
			9: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1 },
			10: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 },
			11: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 },
			12: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1 },
			13: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1 },
			14: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1 },
			15: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1 },
			16: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
			17: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
			18: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1 },
			19: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 1, 7: 1, 8: 1 },
		},
		key: "spell",
	};
	// Optionally add recovery behavior
	CONFIG.DND5E.restTypes.long.recoverSpellSlotTypes.add("elkanWarlock");
}

// Power of Love and Fear activities, by condition and whether the spell is instantaneous.
const LOVE_AND_FEAR_ACTIVITIES = {
	charmed: { round: "7751UYuelIlssKTJ", minute: "i299ypuHkGFuivCO" },
	frightened: { round: "bqTbXyf3RySL4FtV", minute: "ffptSc1PjIKxJa0o" },
};

/**
 * Runs Power of Love and Fear class feature automation (midi-qol preambleComplete). Before the
 * targets roll their Wisdom saves against one of the warlock's spells of 1st level or higher, asks
 * whether to also charm or frighten creatures that fail, so any advantage they have against that
 * condition applies to the save.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {Promise<void>}
 */
export async function powerOfLoveAndFearPrompt(workflow) {
	const actor = workflow?.actor;
	const item = workflow?.item;
	if (item?.type !== "spell" || !(item.system.level >= 1) || !actor?.isOwner) return;
	if (workflow.activity?.type !== "save" || !workflow.activity.save?.ability?.has?.("wis"))
		return;
	if (!actor.items.some((i) => i.system?.identifier === "power-of-love-and-fear")) return;

	const choice = await DialogV2.wait({
		window: { title: t("elkan5e.warlock.loveAndFearTitle") },
		content: `<p>${t("elkan5e.warlock.loveAndFearContent", { spell: item.name })}</p>`,
		buttons: [
			{ action: "charmed", label: CONFIG.DND5E.conditionTypes.charmed?.name ?? "Charmed" },
			{
				action: "frightened",
				label: CONFIG.DND5E.conditionTypes.frightened?.name ?? "Frightened",
			},
			{ action: "none", label: t("elkan5e.warlock.loveAndFearDecline"), default: true },
		],
		rejectClose: false,
	});
	if (choice in LOVE_AND_FEAR_ACTIVITIES) workflow.elkan5eLoveAndFear = choice;
}

/**
 * Applies the condition chosen in {@link powerOfLoveAndFearPrompt} to every creature that failed
 * its save (midi-qol RollComplete). It lasts 1 round for instantaneous spells, otherwise 1 minute.
 *
 * @param {object} workflow - MIDI-QOL workflow.
 * @returns {Promise<void>}
 */
export async function powerOfLoveAndFearApply(workflow) {
	const choice = workflow?.elkan5eLoveAndFear;
	if (!choice || !workflow.failedSaves?.size) return;
	const feature = workflow.actor.items.find(
		(i) => i.system?.identifier === "power-of-love-and-fear",
	);
	const length = workflow.item.system.duration?.units === "inst" ? "round" : "minute";
	const activity = feature?.system.activities.get(LOVE_AND_FEAR_ACTIVITIES[choice][length]);
	if (!activity) return;

	await MidiQOL.completeActivityUse(
		activity,
		{
			midiOptions: {
				targetUuids: [...workflow.failedSaves].map((token) => token.document.uuid),
				ignoreUserTargets: true,
			},
		},
		{ configure: false },
	);
}

// Name of the Repelling Blast attack. Granted copies get a new activity id, so it's matched by name.
const REPELLING_BLAST = "Repelling Blast";

/**
 * Repelling Blast (midi function macro on the Repelling Blast attack, and on Eldritch Blast once
 * the attack is granted to it). Only the "Repelling Blast" attack pushes: once per turn, when it
 * hits, the creature is pushed 10 feet straight away from the warlock.
 *
 * @param {object} context - Midi function-macro context.
 * @param {object} context.workflow - MIDI-QOL workflow.
 * @returns {Promise<void>}
 */
export async function repellingBlast({ workflow }) {
	const actor = workflow?.actor;
	const target = workflow?.hitTargets?.first();
	if (workflow?.activity?.name !== REPELLING_BLAST || !actor?.isOwner || !target) return;
	if (usedThisTurn(actor, "repellingBlastTime")) {
		ui.notifications.warn(t("elkan5e.warlock.repellingBlastUsed", { name: actor.name }));
		return;
	}
	await markUsedThisTurn(actor, "repellingBlastTime");
	await push(
		{ ...workflow, actor, token: workflow.token, targets: new Set([target]) },
		false,
		10,
		0,
		true,
	);
}
