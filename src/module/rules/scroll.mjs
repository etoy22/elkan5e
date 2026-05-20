const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Applies scroll rule behavior.
 *
 */
export function scroll() {
	console.log("Elkan 5e  |  Initializing Scrolls");
	const SCROLLS = [
		"rQ6sO7HDWzqMhSI3",
		"9GSfMg0VOA2b4uFN",
		"XdDp6CKh9qEvPTuS",
		"hqVKZie7x9w3Kqds",
		"DM7hzgL836ZyUFB1",
		"wa1VF8TXHmkrrR35",
		"tI3rWx4bxefNCexS",
		"mtyw4NS1s7j2EJaD",
		"aOrinPg7yuDZEuWr",
		"O4YbkJkLlnsgUszZ",
	];

	if (!CONFIG.DND5E?.spellScrollIds) {
		console.warn("Elkan 5e | CONFIG.DND5E.spellScrollIds not initialized");
		return;
	}

	SCROLLS.forEach((id, index) => {
		CONFIG.DND5E.spellScrollIds[index] = `Compendium.elkan5e.elkan5e-equipment.Item.${id}`;
	});

	// registerScrollRules();
}

// TODO: implement the off-list scroll check and modifiers as described in the scroll rules doc. This will require both a pre-use hook to prompt the user and potentially cancel the activity, and a MidiQOL hook to apply the attack/DC modifiers if the check was passed.
/**
 * Determines whether the scroll's spell appears on any of the actor's class spell lists.
 *
 * @param {Actor5e} actor - The actor attempting to use the scroll.
 * @param {Item5e} scrollItem - The spell scroll item.
 * @returns {boolean} True if the spell is on the actor's class list.
 */
function isSpellOnActorClassList(actor, scrollItem) {
	const spellUuid = scrollItem.system.spell?.uuid;
	if (!spellUuid) return false;

	const actorClasses = actor.items.filter(
		(i) =>
			i.type === "class" &&
			i.system.spellcasting?.progression &&
			i.system.spellcasting.progression !== "none",
	);
	if (!actorClasses.length) return false;

	// Preferred: use the dnd5e spell list registry introduced in v4.
	const spellLists = game.dnd5e?.registry?.spellLists;
	if (spellLists) {
		for (const cls of actorClasses) {
			const list = spellLists.get(cls.system.identifier);
			if (list?.spells?.has(spellUuid)) return true;
		}
		return false;
	}

	// Fallback: check whether the actor already has this spell prepared/known.
	const spellName = scrollItem.system.spell?.name ?? "";
	return actor.items.some((i) => i.type === "spell" && i.name === spellName);
}

/**
 * Prompts the user to choose Arcana, Religion, or Nature for the off-list scroll check.
 *
 * @param {number} dc - The difficulty class for the check.
 * @returns {Promise<string|null>} The chosen skill key, or null if cancelled.
 */
async function promptScrollSkillCheck(dc) {
	const optionsHtml = [
		{ key: "arc", label: "Arcana" },
		{ key: "rel", label: "Religion" },
		{ key: "nat", label: "Nature" },
	]
		.map((s) => `<option value="${s.key}">${s.label}</option>`)
		.join("");

	const chosen = await DialogV2.prompt({
		window: { title: "Off-List Scroll Check" },
		content: `
			<p>This spell is not on your class list. Make a skill check (DC ${dc}) to attempt to use it.</p>
			<p>On a failure the scroll is <strong>not</strong> destroyed.</p>
			<select name="skill" style="width:100%; margin-top:6px;">${optionsHtml}</select>
		`,
		ok: { label: `Roll (DC ${dc})`, callback: (_ev, btn) => btn.form.elements.skill.value },
		rejectClose: false,
		modal: true,
	});
	return chosen ?? null;
}

/**
 * Registers scroll automation rules.
 *
 * Rules enforced:
 * - The user must be a spellcaster with at least one spell slot.
 * - Scroll Expert feat bypasses all checks and uses own spellcasting stats.
 * - Spell is on the actor's class list → no check, own spellcasting stats.
 * - Spell is NOT on the actor's class list → Arcana / Religion / Nature check
 *   at DC 10 + spell level. Failure aborts the use without destroying the scroll.
 *   Success proceeds with +5 attack bonus and save DC 13.
 *
 */
export function registerScrollRules() {
	// Gate: runs before the scroll activity fires so we can cancel if needed.
	Hooks.on("dnd5e.preUseActivity", async (activity, config, options) => {
		try {
			const item = activity.item;
			if (!item || item.type !== "consumable") return;
			if (item.system.type?.value !== "scroll") return;
			if (item.system.spell?.level === undefined) return;

			const actor = item.actor;
			if (!actor) return;

			// Must be a spellcaster with at least one spell slot.
			const hasSlots = Object.values(actor.system.spells ?? {}).some((s) => (s.max ?? 0) > 0);
			if (!hasSlots) {
				ui.notifications.warn(
					`${actor.name} must be a spellcaster with spell slots to use a spell scroll.`,
				);
				return false;
			}

			// Scroll Expert bypasses all further checks.
			const hasScrollExpert = actor.items.some(
				(i) => i.type === "feat" && i.system?.identifier === "scroll-expert",
			);
			if (hasScrollExpert) return;

			// Spell is on the actor's class list — no check needed.
			if (isSpellOnActorClassList(actor, item)) return;

			// Off class list — require a skill check.
			const spellLevel = item.system.spell.level;
			const dc = 10 + spellLevel;

			const skillKey = await promptScrollSkillCheck(dc);
			if (!skillKey) return false; // Player cancelled.

			const rolls = await actor.rollSkill(skillKey, { chatMessage: true });
			const roll = Array.isArray(rolls) ? rolls[0] : rolls;
			if (!roll) return false;

			if (roll.total < dc) {
				ui.notifications.warn(
					`${actor.name} failed the scroll check (DC ${dc}). The scroll is not destroyed.`,
				);
				return false;
			}

			// Passed — flag actor so the MidiQOL hook can apply the off-list modifiers.
			await actor.setFlag("elkan5e", "scrollOffList", true);
		} catch (err) {
			console.error("Elkan 5e | Scroll automation error:", err);
		}
	});

	// Apply off-list modifiers (+5 attack, DC 13) once MidiQOL sets up the workflow.
	Hooks.on("midi-qol.preambleComplete", async (workflow) => {
		try {
			const item = workflow.item;
			if (!item || item.type !== "consumable") return;
			if (item.system.type?.value !== "scroll") return;

			const actor = workflow.actor;
			if (!actor?.getFlag("elkan5e", "scrollOffList")) return;
			await actor.unsetFlag("elkan5e", "scrollOffList");

			// Off-list scroll: +5 attack bonus, save DC 13.
			workflow.attackBonus = (workflow.attackBonus ?? 0) + 5;
			workflow.saveDC = 13;
		} catch (err) {
			console.error("Elkan 5e | Scroll off-list modifier error:", err);
		}
	});
}
