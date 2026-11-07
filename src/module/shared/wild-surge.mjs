import { createEffectsAsGM, removeStatuses, t } from "./helpers.mjs";

/**
 * Wild Surge table IDs in the elkan5e-roll-tables compendium, indexed by surge table level.
 * Index 0 is empty because there's no surge table for cantrips.
 */
export const WILD_SURGE_TABLE_IDS = [
	null,
	"GDE5tgmRfX1GiOQs",
	"mxwqgbo7xnNXSnIm",
	"Fwl1JxM19LzeYxjJ",
	"0TDp89O9iGt4zovG",
	"V4BRRp6vWntQNVwa",
	"4TsMG2a2EtcLdgkc",
	"wt2VfjYQyuvwftih",
	"xkUpS2XBuSdyVEah",
	"LV2skOm8hCwM1JRH",
	"O7JYPPoDS7gLGkNj",
];

export const WILD_SURGE_MAX_TABLE_LEVEL = WILD_SURGE_TABLE_IDS.length - 1;

/**
 * Surge sources. A sorcerer gets the full result; a Bloodrager (Wild Blood) regains a use of
 * Rage instead of any result flagged as sorcerer-only.
 */
export const SURGE_SOURCE = Object.freeze({ sorcerer: "sorcerer", bloodrager: "bloodrager" });

/**
 * Reads a table result's automation data from `flags.elkan5e.wildSurge`.
 *
 * Supported keys:
 * - `sorcererOnly` (boolean): the result needs sorcery points, metamagic, or the sorcerer class.
 * - `effects` (string[]): UUIDs of effects (elkan5e-effects compendium) applied to the surging
 *   creature.
 * - `special` (object): handlers for results effects can't express (see runSpecials).
 * - `onEffectEnd` (object): specials (same keys as `special`) applied when the first of `effects`
 *   ends, for results like "you return with all hit points restored".
 * - `subTables` (number[]): surge table levels to also roll on (e.g. "roll on the 1st, 2nd, and
 *   3rd level tables").
 *
 * @param {TableResult} result - Drawn table result.
 * @returns {object} Automation data, or an empty object.
 */
const surgeData = (result) => result?.flags?.elkan5e?.wildSurge ?? {};

/**
 * Text shown for a drawn result, used in the Delayed Wild Surge item description.
 *
 * @param {TableResult} result - Drawn table result.
 * @returns {string} Result description or name.
 */
export const surgeResultText = (result) => result?.description || result?.name || "";

/**
 * Draws from a Wild Surge table and posts the result to chat. Doesn't apply anything; call
 * {@link resolveWildSurge} once the result is final (after Avert Disaster / Delayed Surge).
 *
 * @param {number} tableLevel - Surge table level (1-10). Clamped to the highest table.
 * @param {object} [budget] - Shared remaining draw budget for this resolution.
 * @returns {Promise<{table: RollTable, result: TableResult, budget: object}|null>} Drawn result, or null if no table.
 */
export async function drawWildSurge(tableLevel, budget = { remaining: 100 }) {
	const id = WILD_SURGE_TABLE_IDS[Math.min(tableLevel, WILD_SURGE_MAX_TABLE_LEVEL)];
	if (!id) return null;
	try {
		const table = await fromUuid(`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${id}`);
		if (!table) return null;
		return await drawSurgeTable(table, budget);
	} catch (error) {
		console.error("Elkan 5e | Error drawing from Wild Surge table:", error);
		return null;
	}
}

/** Draws linked tables without allowing Foundry to recurse outside our shared budget. */
async function drawSurgeTable(table, budget) {
	if (budget.remaining <= 0) return null;
	budget.remaining--;
	const draw = await table.draw({ displayChat: true, recursive: false });
	const result = draw?.results?.[0];
	if (result?.documentUuid) {
		const linked = await fromUuid(result.documentUuid);
		if (linked?.documentName === "RollTable") return drawSurgeTable(linked, budget);
	}
	return result ? { table, result, budget } : null;
}

/**
 * Applies a final Wild Surge result to the creature that surged.
 *
 * @param {Actor} actor - Creature that triggered the surge.
 * @param {TableResult|string} resultOrUuid - Drawn result, or its UUID (from a Delayed Wild Surge).
 * @param {object} [options]
 * @param {string} [options.source] - One of {@link SURGE_SOURCE}.
 * @param {string} [options.slot] - Spell slot key used for the triggering spell (e.g. "spell3").
 * @param {object} [options.budget] - Shared remaining draw budget, including sibling subtables.
 * @returns {Promise<void>}
 */
export async function resolveWildSurge(
	actor,
	resultOrUuid,
	{ source = SURGE_SOURCE.sorcerer, slot = null, budget = { remaining: 100 } } = {},
) {
	if (!actor || !resultOrUuid) return;
	const result = typeof resultOrUuid === "string" ? await fromUuid(resultOrUuid) : resultOrUuid;
	if (!result) return;
	const data = surgeData(result);

	try {
		if (data.sorcererOnly && source === SURGE_SOURCE.bloodrager) {
			await refundRage(actor);
			return;
		}

		if (Array.isArray(data.subTables)) {
			for (const level of data.subTables) {
				if (budget.remaining <= 0) break;
				const drawn = await drawWildSurge(level, budget);
				if (drawn) await resolveWildSurge(actor, drawn.result, { source, slot, budget });
			}
		}

		const special = specialsFor(data.special, source);
		const onEffectEnd = specialsFor(data.onEffectEnd, source);
		if (special) await runSpecials(actor, special, { slot });
		const applied = Array.isArray(data.effects)
			? await applySurgeEffects(actor, data.effects, onEffectEnd)
			: false;
		// Nothing to wait for: apply the "when it ends" part now.
		if (onEffectEnd && !applied) await runSpecials(actor, onEffectEnd, { slot });
	} catch (error) {
		console.error("Elkan 5e | Error resolving Wild Surge result:", error);
	}
}

/**
 * Applies Wild Surge effects from the effects compendium to the surging creature.
 *
 * @param {Actor} actor - Creature that triggered the surge.
 * @param {string[]} uuids - Effect UUIDs.
 * @returns {Promise<void>}
 */
async function applySurgeEffects(actor, uuids, onEffectEnd = null) {
	const effects = [];
	for (const uuid of uuids) {
		const effect = await fromUuid(uuid);
		if (!effect) {
			console.warn(`Elkan 5e | Wild Surge effect not found: ${uuid}`);
			continue;
		}
		const data = effect.toObject();
		delete data._id;
		delete data.folder;
		data.origin = actor.uuid;
		data.transfer = false;
		effects.push(data);
	}
	if (!effects.length) return false;
	// The first effect carries the specials to run when it ends (e.g. "you return with...").
	if (onEffectEnd)
		foundry.utils.setProperty(effects[0], `flags.elkan5e.${ON_END_FLAG}`, onEffectEnd);
	await createEffectsAsGM(actor, effects);
	return true;
}

const ON_END_FLAG = "wildSurgeOnEnd";

// Specials that need a sorcerer. A Bloodrager (Wild Blood) regains a use of Rage instead.
const SORCERER_SPECIALS = ["sorceryPoints", "restoreSorceryPoints"];

/**
 * Adjusts a result's specials for the surge source: a Bloodrager gets `refundRage` in place of
 * any sorcery point specials, and keeps the rest of the result.
 *
 * @param {object} [special] - Specials from the result.
 * @param {string} source - One of {@link SURGE_SOURCE}.
 * @returns {object|null} Specials to run, or null for none.
 */
function specialsFor(special, source) {
	if (!special || typeof special !== "object") return null;
	if (source !== SURGE_SOURCE.bloodrager) return special;
	const adjusted = { ...special };
	let needsSorcerer = false;
	for (const key of SORCERER_SPECIALS) {
		if (key in adjusted) {
			needsSorcerer ||= Boolean(adjusted[key]);
			delete adjusted[key];
		}
	}
	if (needsSorcerer) adjusted.refundRage = true;
	return Object.keys(adjusted).length ? adjusted : null;
}

/**
 * deleteActiveEffect handler: when a Wild Surge effect with an end trigger ends (expires or is
 * removed), applies the rest of its result, such as the Daydream's return with full hit points.
 * Runs only on the client that deleted the effect.
 *
 * @param {ActiveEffect} effect - Deleted effect.
 * @param {string} userId - User who deleted it.
 * @returns {Promise<void>}
 */
export async function wildSurgeEffectEnded(effect, userId) {
	const special = effect?.flags?.elkan5e?.[ON_END_FLAG];
	if (!special || userId !== game.user.id) return;
	const actor = effect.parent;
	if (actor?.documentName !== "Actor") return;
	try {
		await runSpecials(actor, special);
	} catch (error) {
		console.error("Elkan 5e | Error applying Wild Surge end effect:", error);
	}
}

/**
 * Handles results an effect can't express.
 *
 * @param {Actor} actor - Creature that triggered the surge.
 * @param {object} special - `flags.elkan5e.wildSurge.special` of the result:
 *   `sorceryPoints` (number) regain that many sorcery points; `restoreSorceryPoints` regain all;
 *   `inspiration` gain inspiration; `healFull` regain all hit points; `removeStatuses` (string[])
 *   end those conditions; `endConcentration` end concentration; `dispelMagic` end every temporary
 *   magical effect; `learnSpell` (uuid) learn the spell, or lose it if a surge taught it before;
 *   `refundSlot` regain the spell slot used for the triggering spell; `refundRage` regain a use of
 *   Rage (Wild Blood, in place of sorcery points); `die` drop to 0 hit points
 *   and die.
 * @param {object} [options]
 * @param {string} [options.slot] - Spell slot key used for the triggering spell.
 * @returns {Promise<void>}
 */
async function runSpecials(actor, special, { slot = null } = {}) {
	if (special.dispelMagic) {
		const magical = [...actor.allApplicableEffects()].filter(
			(e) => e.isTemporary && e.system?.magical,
		);
		for (const effect of magical) await effect.delete();
	}
	if (special.endConcentration) await actor.endConcentration?.();
	if (special.removeStatuses?.length) await removeStatuses(actor, special.removeStatuses);
	if (special.sorceryPoints) await regainSorceryPoints(actor, special.sorceryPoints);
	if (special.restoreSorceryPoints) await regainSorceryPoints(actor, Infinity);
	if (special.inspiration) await actor.update({ "system.attributes.inspiration": true });
	if (special.healFull) {
		const hp = actor.system.attributes.hp;
		await actor.update({ "system.attributes.hp.value": hp.effectiveMax ?? hp.max });
	}
	if (special.learnSpell) await toggleLearnedSpell(actor, special.learnSpell);
	if (special.refundSlot && slot) {
		const spellSlot = actor.system.spells?.[slot];
		if (spellSlot && spellSlot.value < spellSlot.max) {
			await actor.update({ [`system.spells.${slot}.value`]: spellSlot.value + 1 });
		}
	}
	if (special.refundRage) await refundRage(actor);
	if (special.die) {
		await actor.update({ "system.attributes.hp.value": 0 });
		await actor.toggleStatusEffect("dead", { active: true, overlay: true });
	}
}

/**
 * Regains sorcery points. Points above the maximum aren't tracked (the player handles those);
 * a chat message says how many went over.
 *
 * @param {Actor} actor - Sorcerer.
 * @param {number} amount - Points to regain (Infinity for all).
 * @returns {Promise<void>}
 */
async function regainSorceryPoints(actor, amount) {
	const points = actor.items.find((i) => i.system?.identifier === "sorcery-points");
	if (!points) return;
	const spent = points.system.uses?.spent ?? 0;
	const regained = Math.min(spent, amount);
	if (regained > 0) await points.update({ "system.uses.spent": spent - regained });
	const excess = Number.isFinite(amount) ? amount - regained : 0;
	if (excess > 0) {
		await ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ actor }),
			content: `<p>${t("elkan5e.wildSurge.sorceryPointsExcess", { name: actor.name, excess })}</p>`,
		});
	}
}

/**
 * Learns a spell from a surge, or forgets it if a surge taught it before. Sorcerers learn it as
 * an always-prepared sorcerer spell; anyone else can cast it once per long rest.
 *
 * @param {Actor} actor - Creature that triggered the surge.
 * @param {string} uuid - Spell UUID.
 * @returns {Promise<void>}
 */
async function toggleLearnedSpell(actor, uuid) {
	const learned = actor.items.find((i) => i.flags?.elkan5e?.wildSurgeSpell === uuid);
	if (learned) {
		await learned.delete();
		await ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ actor }),
			content: `<p>${t("elkan5e.wildSurge.spellForgotten", { name: actor.name, spell: learned.name })}</p>`,
		});
		return;
	}

	const spell = await fromUuid(uuid);
	if (!spell) return;
	const data = spell.toObject();
	delete data._id;
	foundry.utils.setProperty(data, "flags.elkan5e.wildSurgeSpell", uuid);
	data.system.prepared = 2;
	if (actor.classes?.sorcerer) {
		data.system.method = "spell";
		data.system.sourceItem = "class:sorcerer";
	} else {
		data.system.method = "innate";
		data.system.uses = { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] };
		for (const activity of Object.values(data.system.activities ?? {})) {
			activity.consumption ??= {};
			activity.consumption.spellSlot = false;
			activity.consumption.targets = [{ type: "itemUses", value: "1", target: "" }];
		}
	}
	await actor.createEmbeddedDocuments("Item", [data]);
	await ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ actor }),
		content: `<p>${t("elkan5e.wildSurge.spellLearned", { name: actor.name, spell: data.name })}</p>`,
	});
}

/**
 * Wild Blood: a surge that needs a sorcerer restores one use of Rage instead.
 *
 * @param {Actor} actor - Bloodrager that surged.
 * @returns {Promise<void>}
 */
async function refundRage(actor) {
	const rage = actor.items.find((i) => i.system?.identifier === "rage");
	const spent = rage?.system?.uses?.spent ?? 0;
	const regained = spent > 0;
	if (regained) await rage.update({ "system.uses.spent": spent - 1 });

	await ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ actor }),
		content: `<p>${t(
			regained ? "elkan5e.wildSurge.rageRefund" : "elkan5e.wildSurge.rageRefundFull",
			{ name: actor.name },
		)}</p>`,
	});
}
