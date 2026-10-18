const DialogV2 = foundry.applications.api.DialogV2;
import { t } from "../shared/helpers.mjs";

/**
 * Attack bonus and save DC used when casting a scroll spell that isn't on your list.
 */
const OFF_LIST_VALUES = { bonus: 5, dc: 13 };

/**
 * Usage flag set when a scroll is re-used after the Elkan scroll rules have been applied.
 */
const RESOLVED_FLAG = "elkan5eScrollResolved";

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

	if (!game.settings.get("elkan5e", "scrollRules")) return;

	// Scrolls are always +5 / DC 13 unless the caster can use their own values.
	CONFIG.DND5E.spellScrollValues = { 0: { ...OFF_LIST_VALUES } };

	// Scrolls made from a compendium spell use a Cast activity, which skips preUseActivity.
	Hooks.on("dnd5e.preUseLinkedSpell", (activity, usage, dialog, message) =>
		interceptScrollUse(activity, usage, dialog, message),
	);
	// Scrolls made from an owned spell carry the spell's activities directly.
	Hooks.on("dnd5e.preUseActivity", (activity, usage, dialog, message) => {
		if (activity?.type === "cast") return;
		return interceptScrollUse(activity, usage, dialog, message);
	});
}

/**
 * Stops a scroll use so the Elkan scroll rules can run first, then re-uses the scroll.
 *
 * @param {*} activity - Activity being used.
 * @param {object} usage - Usage configuration.
 * @param {object} dialog - Dialog configuration.
 * @param {object} message - Message configuration.
 * @returns {boolean|void} False to stop the original use.
 */
function interceptScrollUse(activity, usage, dialog, message) {
	const item = activity?.item;
	const actor = activity?.actor;
	if (item?.type !== "consumable" || item.system?.type?.value !== "scroll") return;
	if (actor?.type !== "character" || usage?.[RESOLVED_FLAG]) return;

	resolveScroll(activity, usage, dialog, message).catch((error) =>
		console.error("Elkan 5e | Error applying spell scroll rules:", error),
	);
	return false;
}

/**
 * Applies the Elkan scroll rules and, if the spell can be cast, uses the scroll.
 *
 * @param {*} activity - Activity being used (may be a clone of the scroll's activity).
 * @param {object} usage - Usage configuration.
 * @param {object} dialog - Dialog configuration.
 * @param {object} message - Message configuration.
 * @returns {Promise<void>}
 */
async function resolveScroll(activity, usage, dialog, message) {
	const actor = activity.actor;
	const item = actor.items.get(activity.item.id);
	if (!item) return;

	const classes = actor.spellcastingClasses ?? {};
	if (!Object.keys(classes).length) {
		ui.notifications.warn(t("elkan5e.scrolls.notSpellcaster", { name: actor.name }));
		return;
	}

	const { uuid, spell, level } = await getScrollSpell(activity, item);
	const lists = new Set(
		Array.from(dnd5e.registry.spellLists.forSpell(uuid ?? "")).map(
			({ metadata }) => `${metadata.type}:${metadata.identifier}`,
		),
	);

	const castingClass = findCastingClass(actor, classes, lists, spell);
	let values;
	if (castingClass) {
		values = {
			bonus: castingClass.spellcasting.attack,
			dc: castingClass.spellcasting.save,
		};
	} else {
		const passed = await rollScrollCheck(actor, lists, level, spell?.name ?? item.name);
		if (!passed) return;
		values = { ...OFF_LIST_VALUES };
	}

	await applyScrollValues(item, activity.id, values);
	const updated = item.system.activities.get(activity.id);
	await updated?.use({ ...usage, [RESOLVED_FLAG]: true }, dialog, message);
}

/**
 * Finds the spell stored on a scroll.
 *
 * @param {*} activity - Scroll activity.
 * @param {*} item - Scroll item.
 * @returns {Promise<{uuid: string|null, spell: *, level: number}>} Spell UUID, document, and level.
 */
async function getScrollSpell(activity, item) {
	if (activity.type === "cast") {
		const uuid = activity.spell?.uuid ?? null;
		const spell = uuid ? await fromUuid(uuid) : null;
		const level = activity.spell?.level ?? spell?.system?.level ?? 0;
		return { uuid, spell, level };
	}

	// Scrolls made from an owned spell keep only its name: "Spell Scroll: Fireball".
	const prefix = `${game.i18n.localize("DND5E.SpellScroll")}: `;
	const name = item.name.startsWith(prefix) ? item.name.slice(prefix.length) : item.name;
	const pack = game.packs.get("elkan5e.elkan5e-spells");
	const entry = pack?.index.find((i) => i.name === name);
	const spell = entry ? await fromUuid(entry.uuid) : null;
	const level = item.getFlag("dnd5e", "spellLevel")?.value ?? spell?.system?.level ?? 0;
	return { uuid: entry?.uuid ?? null, spell, level };
}

/**
 * Finds a class that lets the actor cast the scroll's spell without a check.
 *
 * @param {*} actor - Actor using the scroll.
 * @param {Record<string, *>} classes - Actor's spellcasting classes.
 * @param {Set<string>} lists - Typed spell lists the spell is on (e.g. "class:wizard").
 * @param {*} spell - Spell on the scroll.
 * @returns {*|null} Class whose spellcasting values are used, or null if a check is needed.
 */
function findCastingClass(actor, classes, lists, spell) {
	for (const [identifier, cls] of Object.entries(classes)) {
		if (lists.has(`class:${identifier}`)) return cls;
		const subclass = cls.subclass?.identifier;
		if (subclass && lists.has(`subclass:${subclass}`)) return cls;
	}

	// A spell the caster can otherwise cast (known, prepared, or granted by a feature).
	const identifier = spell?.identifier;
	if (!identifier) return null;
	const known = actor.items.find(
		(i) =>
			i.type === "spell" && i.identifier === identifier && !i.getFlag("dnd5e", "cachedFor"),
	);
	if (!known) return null;
	return classes[known.system.classIdentifier] ?? Object.values(classes)[0];
}

/**
 * Rolls the check to cast a scroll spell that isn't on the actor's list.
 *
 * @param {*} actor - Actor using the scroll.
 * @param {Set<string>} lists - Typed spell lists the spell is on.
 * @param {number} level - Spell level.
 * @param {string} spellName - Name shown in messages.
 * @returns {Promise<boolean>} True if the spell is cast.
 */
async function rollScrollCheck(actor, lists, level, spellName) {
	const dc = 10 + (Number(level) || 0);
	const skills = ["arc"];
	if (lists.has("class:cleric")) skills.push("rel");
	if (lists.has("class:druid")) skills.push("nat");

	let skill = skills[0];
	if (skills.length > 1) {
		skill = await DialogV2.wait({
			window: { title: t("elkan5e.scrolls.checkTitle") },
			content: `<p>${t("elkan5e.scrolls.checkPrompt", { spell: spellName, dc })}</p>`,
			buttons: skills.map((key, index) => ({
				action: key,
				label: CONFIG.DND5E.skills[key]?.label ?? key,
				default: index === 0,
			})),
			rejectClose: false,
		});
		if (!skill) return false;
	}

	const rolls = await actor.rollSkill({ skill, target: dc });
	const roll = rolls?.[0];
	if (!roll) return false;
	if (roll.total >= dc) return true;

	ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ actor }),
		content: `<p>${t("elkan5e.scrolls.checkFailed", { name: actor.name, spell: spellName })}</p>`,
	});
	return false;
}

/**
 * Writes the attack bonus and save DC onto the scroll before it is used.
 *
 * @param {*} item - Scroll item.
 * @param {string} activityId - Activity being used.
 * @param {{bonus: number, dc: number}} values - Attack bonus and save DC.
 * @returns {Promise<void>}
 */
async function applyScrollValues(item, activityId, values) {
	const bonus = String(values.bonus);
	const dc = String(values.dc);
	const activity = item.system.activities.get(activityId);

	if (activity?.type === "cast") {
		const challenge = activity.spell.challenge;
		if (
			challenge.override &&
			String(challenge.attack) === bonus &&
			String(challenge.save) === dc
		)
			return;
		await item.update({
			[`system.activities.${activityId}.spell.challenge`]: {
				attack: bonus,
				save: dc,
				override: true,
			},
		});
		// dnd5e refreshes the cached spell after the update without waiting, so do it here.
		const updated = item.system.activities.get(activityId);
		const enchantment = updated?.cachedSpell?.effects.get(updated.constructor.ENCHANTMENT_ID);
		await enchantment?.update({ "system.changes": updated.getSpellChanges() });
		return;
	}

	const changes = {};
	for (const a of item.system.activities) {
		if (a.type === "attack" && (!a.attack.flat || String(a.attack.bonus) !== bonus)) {
			changes[`system.activities.${a.id}.attack.flat`] = true;
			changes[`system.activities.${a.id}.attack.bonus`] = bonus;
		} else if (a.type === "save" && String(a.save.dc.formula) !== dc) {
			changes[`system.activities.${a.id}.save.dc.calculation`] = "";
			changes[`system.activities.${a.id}.save.dc.formula`] = dc;
		}
	}
	if (Object.keys(changes).length) await item.update(changes);
}
