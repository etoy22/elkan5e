import { push } from "../rules/condition/push.mjs";
import { markUsedThisTurn, t, usedThisTurn } from "../shared/helpers.mjs";
import { completeActivityUse } from "../shared/midi-compat.mjs";

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
 * Hook callback for "renderAdvancementFlow". Hides pact-specific invocations from
 * the advancement dialog when the actor doesn't have the required pact boon.
 * dnd5e renders each advancement step as its own flow, so this catches both the
 * initial render and any re-renders as the player navigates through advancement steps.
 *
 * @param {Application} app  - The rendered advancement flow.
 * @param {HTMLElement|jQuery} html - The rendered HTML.
 */
export function onWarlockFilterInvocations(app, html) {
	try {
		const actor = app.actor ?? app.advancement?.actor;
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
 * Pact Magic slots at each warlock level: WARLOCK_SLOTS[warlockLevel - 1][slotLevel - 1].
 */
const WARLOCK_SLOTS = [
	[2],
	[2],
	[2, 1],
	[2, 2],
	[2, 2, 1],
	[2, 2, 2],
	[2, 2, 2, 1],
	[2, 2, 2, 1],
	[2, 2, 2, 2, 1],
	[2, 2, 2, 2, 1],
	[2, 2, 2, 2, 1, 1],
	[2, 2, 2, 2, 1, 1],
	[2, 2, 2, 2, 1, 1, 1],
	[2, 2, 2, 2, 1, 1, 1],
	[2, 2, 2, 2, 1, 1, 1, 1],
	[2, 2, 2, 2, 1, 1, 1, 1],
	[2, 2, 2, 2, 1, 1, 1, 1, 1],
	[2, 2, 2, 2, 1, 1, 1, 1, 1],
	[2, 2, 2, 2, 2, 1, 1, 1, 1],
	[2, 2, 2, 2, 2, 1, 1, 1, 1],
];

// Warlock levels, kept on the progression object apart from the shared caster level.
const WARLOCK_LEVELS = Symbol("elkan5e.warlockLevels");

// Spellcasting method the warlock used before its slots joined the regular ones.
const OLD_WARLOCK_METHOD = "elkanWarlock";

const isElkanWarlock = (spellcasting) => spellcasting?.progression === "elkan";

/**
 * Sets up Pact Magic. The warlock is a regular spellcaster whose "elkan" progression doesn't count
 * toward the shared caster level. Its own table's slots are added on top of the regular spell slots
 * instead, so a multiclass character has one combined set of slots.
 */
export function initWarlockSpellSlot() {
	CONFIG.DND5E.spellcasting.spell.progression.elkan = {
		label: "elkan5e.warlock.progression",
		divisor: 1,
	};
	Hooks.on("dnd5e.computeSpellProgression", computeWarlockProgression);
	Hooks.on("dnd5e.prepareSpellSlots", prepareWarlockSlots);
	Hooks.on("preCreateItem", (item) => {
		if (item.type === "spell" && item._source.system?.method === OLD_WARLOCK_METHOD) {
			item.updateSource({ "system.method": "spell" });
		}
	});
}

/**
 * Hook callback for "dnd5e.computeSpellProgression". Sets warlock levels aside instead of adding
 * them to the caster level. Other classes are counted as though the warlock weren't there, so a
 * lone half or third caster still rounds its levels up.
 *
 * @param {object} progression - Spellcasting progression data. Will be mutated.
 * @param {Actor5e|void} actor - Actor being prepared, if any.
 * @param {Item5e} cls - Class being computed.
 * @param {object} spellcasting - The class's spellcasting description.
 * @param {number} count - Number of classes with regular spellcasting, warlock included.
 * @returns {boolean|void} False when the default calculation was handled here.
 */
function computeWarlockProgression(progression, actor, cls, spellcasting, count) {
	if (isElkanWarlock(spellcasting)) {
		progression[WARLOCK_LEVELS] =
			(progression[WARLOCK_LEVELS] ?? 0) + (spellcasting.levels ?? 0);
		return false;
	}
	const warlocks =
		actor?.itemTypes?.class.filter((c) => isElkanWarlock(c.spellcasting)).length ?? 0;
	if (!warlocks) return;
	CONFIG.DND5E.spellcasting.spell.computeProgression(
		progression,
		actor,
		cls,
		spellcasting,
		Math.max(count - warlocks, 1),
	);
	return false;
}

/**
 * Hook callback for "dnd5e.prepareSpellSlots". Prepares the regular spell slots, then adds the
 * warlock's slots to each level. A level with a manual override keeps its override.
 *
 * @param {object} spells - The actor's system.spells data. Will be mutated.
 * @param {Actor5e|void} actor - Actor being prepared, if any.
 * @param {object} progression - Spellcasting progression data.
 * @returns {boolean|void} False when the default preparation was handled here.
 */
function prepareWarlockSlots(spells, actor, progression) {
	const levels = progression?.[WARLOCK_LEVELS];
	if (!levels) return;
	const model = CONFIG.DND5E.spellcasting.spell;
	model.prepareSlots(spells, actor, progression);
	const extra = WARLOCK_SLOTS[Math.min(levels, WARLOCK_SLOTS.length) - 1] ?? [];
	extra.forEach((count, i) => {
		const slot = spells[model.getSpellSlotKey(i + 1)];
		if (slot && !Number.isNumeric(slot.override)) slot.max = (slot.max ?? 0) + count;
	});
	return false;
}

/**
 * Moves spells that still use the old warlock spellcasting method onto regular spellcasting, so
 * they cast with the combined spell slots. Runs on the active GM's client.
 *
 * @returns {Promise<void>}
 */
export async function migrateWarlockSpellMethod() {
	if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return;
	const actors = [
		...game.actors,
		...[...game.scenes].flatMap((s) =>
			s.tokens.filter((t) => !t.actorLink && t.actor).map((t) => t.actor),
		),
	];
	const update = async (parent, items) => {
		const updates = items
			.filter((i) => i.type === "spell" && i._source.system?.method === OLD_WARLOCK_METHOD)
			.map((i) => ({ _id: i.id, "system.method": "spell" }));
		if (!updates.length) return;
		try {
			if (parent) await parent.updateEmbeddedDocuments("Item", updates);
			else await CONFIG.Item.documentClass.updateDocuments(updates);
		} catch (error) {
			console.warn("Elkan 5e | Could not migrate warlock spells for", parent?.uuid, error);
		}
	};
	for (const actor of actors) await update(actor, actor.items);
	await update(null, game.items);
}

// Power of Love and Fear activities, by condition and whether the spell is instantaneous.
const LOVE_AND_FEAR_ACTIVITIES = {
	charmed: { round: "7751UYuelIlssKTJ", minute: "i299ypuHkGFuivCO" },
	frightened: { round: "bqTbXyf3RySL4FtV", minute: "ffptSc1PjIKxJa0o" },
};

/**
 * Runs Power of Love and Fear class feature automation (midi-qol targetingComplete). Before the
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

	await completeActivityUse(
		activity,
		[...workflow.failedSaves].map((token) => token.document.uuid),
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
