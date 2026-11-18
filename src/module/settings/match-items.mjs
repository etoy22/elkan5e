/**
 * Pure helpers for matching an actor's items to their compendium versions.
 * Nothing here touches Foundry globals, so it can be unit tested with plain objects.
 */

import { RENAMED_IDENTIFIERS } from "./renames.mjs";

/** Keys that never count when deciding whether two items differ. */
const IGNORED_KEYS = new Set(["_stats", "ownership", "id", "_id", "identifier"]);
/** Extra keys ignored on effects: an actor's effect origin points at the actor's own item. */
const IGNORED_EFFECT_KEYS = new Set(["origin"]);

/**
 * Turns an item name into the identifier dnd5e would generate for it.
 *
 * @param {string} name - Item name.
 * @returns {string} Slug identifier.
 */
export function slugify(name) {
	return String(name ?? "")
		.toLowerCase()
		.replace(/\s+/g, "-");
}

/**
 * Returns an item's identifier, or one generated from its name when it has none.
 * Works on documents and plain data. Never writes to the item.
 *
 * @param {{name: string, system?: {identifier?: string}}} item - Item or item data.
 * @returns {string} Identifier.
 */
export function identifierOf(item) {
	const id = item?.system?.identifier;
	return typeof id === "string" && id.trim().length > 0 ? id.trim() : slugify(item?.name);
}

/**
 * Builds lookup tables for a list of compendium documents.
 *
 * @param {{pack: string, docs: object[], weak?: boolean}[]} sources - Packs in priority order, best first.
 * @returns {{byId: Map<string, object[]>, byName: Map<string, object[]>}} Lookup tables.
 */
export function buildIndex(sources) {
	const byId = new Map();
	const byName = new Map();
	sources.forEach(({ pack, docs, weak = false }, rank) => {
		for (const doc of docs) {
			// Weak sources are only used when the name matches, never by identifier alone.
			const entry = { doc, pack, rank, weak };
			const id = identifierOf(doc);
			if (!byId.has(id)) byId.set(id, []);
			byId.get(id).push(entry);
			if (!byName.has(doc.name)) byName.set(doc.name, []);
			byName.get(doc.name).push(entry);
		}
	});
	return { byId, byName };
}

/**
 * Narrows candidates to one using item type, then pack priority.
 *
 * @param {{doc: object, rank: number}[]} entries - Candidate entries.
 * @param {string} type - Item type to prefer.
 * @param {string} [requirements] - The actor item's requirements text, used as a last tie-break.
 * @returns {{doc: object, rank: number}[]} Narrowed candidates (one when it resolves).
 */
function narrow(entries, type, requirements = "") {
	let out = entries;
	if (out.length > 1) {
		const sameType = out.filter((e) => e.doc.type === type);
		if (sameType.length > 0) out = sameType;
	}
	if (out.length > 1) {
		const best = Math.min(...out.map((e) => e.rank));
		out = out.filter((e) => e.rank === best);
	}
	if (out.length > 1 && requirements) {
		// Same-named features for different subclasses differ by their requirements ("Fire Savant 6").
		const sameRequirements = out.filter((e) => e.doc.system?.requirements === requirements);
		if (sameRequirements.length > 0) out = sameRequirements;
	}
	return out;
}

/**
 * Finds the compendium document that corresponds to an actor item.
 * Order: Elkan's recorded renames, then same identifier and name, then same name, then same
 * identifier (renamed items).
 *
 * @param {{name: string, type: string, system?: object}} item - Actor item.
 * @param {{byId: Map, byName: Map}} index - From {@link buildIndex}.
 * @returns {{status: "match", doc: object, by: string}|{status: "ambiguous"|"none", identifier: string, count: number}} Result.
 */
export function resolveMatch(item, index, { renames = RENAMED_IDENTIFIERS } = {}) {
	const identifier = identifierOf(item);

	// Content Elkan renamed or replaced comes first, so an old item that still exists in the
	// compendium (an orphan) is not matched to itself.
	const renamedTo = renames[identifier] ?? renames[slugify(item.name)];
	if (renamedTo && renamedTo !== identifier) {
		const narrowedRename = narrow(
			index.byId.get(renamedTo) ?? [],
			item.type,
			item.system?.requirements,
		);
		if (narrowedRename.length === 1)
			return { status: "match", doc: narrowedRename[0].doc, by: "renamed" };
	}

	const idEntries = (index.byId.get(identifier) ?? []).filter((e) => !e.weak);
	const nameEntries = index.byName.get(item.name) ?? [];

	const both = nameEntries.filter((e) => identifierOf(e.doc) === identifier);
	const tiers = [
		["identifier+name", both],
		["name", nameEntries],
		["identifier", idEntries],
	];
	for (const [by, entries] of tiers) {
		if (entries.length === 0) continue;
		const narrowed = narrow(entries, item.type, item.system?.requirements);
		if (narrowed.length === 1) return { status: "match", doc: narrowed[0].doc, by };
	}

	const count = Math.max(idEntries.length, nameEntries.length);
	return { status: count > 1 ? "ambiguous" : "none", identifier, count };
}

/**
 * Suggests the base compendium item for a name with a variant suffix, such as "Dart (10)" or
 * "Barkskin (Short Rest)". It is only a hint: variants usually carry their own limits or uses,
 * so they are never matched automatically.
 *
 * @param {{name: string, type: string}} item - Actor item.
 * @param {{byName: Map<string, object[]>}} index - From {@link buildIndex}.
 * @returns {string[]} Names of compendium items the base name matches (empty when none).
 */
export function suggestVariantOf(item, index) {
	const base = String(item?.name ?? "")
		.replace(/\s*\([^)]*\)\s*$/, "")
		.trim();
	if (!base || base === item.name) return [];
	const found = (index.byName.get(base) ?? []).filter((e) => e.doc.type === item.type);
	return [...new Set(found.map((e) => e.doc.name))];
}

const isPlain = (v) => v === null || typeof v !== "object";

/**
 * Compares two values ignoring ids, ownership, stats, and effect origins.
 *
 * @param {*} a - First value.
 * @param {*} b - Second value.
 * @param {boolean} [inEffect] - True while comparing an effect's own fields.
 * @returns {boolean} True when equal for migration purposes.
 */
export function deepEqualIgnoringMeta(a, b, inEffect = false) {
	if (a === b) return true;
	if (a === null || b === null || typeof a !== typeof b) return false;

	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
		// Lists of plain values (item properties, tags) are sets; their stored order varies.
		if (a.every(isPlain) && b.every(isPlain)) {
			const sortedB = [...b].sort();
			return [...a].sort().every((value, i) => value === sortedB[i]);
		}
		return a.every((value, i) => deepEqualIgnoringMeta(value, b[i], inEffect));
	}

	if (typeof a === "object") {
		// A key that is null or undefined counts as missing: Foundry does not store them, so a
		// compendium copy with empty speeds matches an actor copy without them.
		const keep = (o) => (k) =>
			!IGNORED_KEYS.has(k) &&
			!(inEffect && IGNORED_EFFECT_KEYS.has(k)) &&
			o[k] !== null &&
			o[k] !== undefined;
		const aKeys = Object.keys(a).filter(keep(a));
		const bKeys = Object.keys(b).filter(keep(b));
		if (aKeys.length !== bKeys.length) return false;
		return aKeys.every(
			(key) =>
				Object.prototype.hasOwnProperty.call(b, key) &&
				deepEqualIgnoringMeta(a[key], b[key], inEffect || key === "effects"),
		);
	}

	return false;
}

/**
 * Strips placement and actor-relationship fields so an actor's copy and a compendium copy
 * compare equal when their content matches.
 *
 * @param {object} data - Item source data. A copy is returned.
 * @returns {object} Comparable data.
 */
export function toComparable(data) {
	const obj = structuredClone(data);
	delete obj.sort;
	delete obj.folder;
	// Foundry saves "<br />" as "<br>", so the two must not count as a difference.
	if (typeof obj.system?.description?.value === "string")
		// Foundry also escapes a bare "&" to "&amp;" when it saves a description.
		obj.system.description.value = obj.system.description.value
			.replace(/<br\s*\/>/g, "<br>")
			.replace(/&amp;/g, "&");
	// dnd5e derives an effect's duration from the item's activity, so an actor's copy keeps none.
	for (const effect of obj.effects ?? []) if (effect?.duration) delete effect.duration.value;
	if (obj.flags) delete obj.flags["tidy5e-sheet"];
	if (obj.flags?.dnd5e) {
		delete obj.flags.dnd5e.riders;
		delete obj.flags.dnd5e.sourceId;
		delete obj.flags.dnd5e.advancementOrigin;
		delete obj.flags.dnd5e.advancementRoot;
		delete obj.flags.dnd5e.cachedFor;
		if (Object.keys(obj.flags.dnd5e).length === 0) delete obj.flags.dnd5e;
	}
	return obj;
}

/**
 * Lists the top-level fields (and first level of `system`) that differ between two items.
 *
 * @param {object} oldData - Actor item data.
 * @param {object} newData - Replacement data.
 * @returns {string[]} Field paths, for example `["img", "system.description", "effects"]`.
 */
export function differingFields(oldData, newData) {
	const a = toComparable(oldData);
	const b = toComparable(newData);
	const fields = [];
	for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
		if (IGNORED_KEYS.has(key)) continue;
		if (key === "system") {
			const sa = a.system ?? {};
			const sb = b.system ?? {};
			for (const sub of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
				if (IGNORED_KEYS.has(sub)) continue;
				if (!deepEqualIgnoringMeta(sa[sub], sb[sub])) fields.push(`system.${sub}`);
			}
		} else if (!deepEqualIgnoringMeta(a[key], b[key], key === "effects")) {
			fields.push(key);
		}
	}
	return fields;
}

/**
 * Pairs each replacement effect with an existing effect of the same name, so effects that
 * still exist keep their ids. Leftovers are returned for deletion or creation.
 *
 * @param {{_id: string, name: string}[]} oldEffects - Effects currently on the item.
 * @param {{name: string}[]} newEffects - Effects from the compendium copy.
 * @returns {{updates: {id: string, data: object}[], creates: object[], deletes: string[]}} Plan.
 */
export function planEffectSync(oldEffects, newEffects) {
	const unused = [...oldEffects];
	const updates = [];
	const creates = [];
	for (const data of newEffects) {
		const at = unused.findIndex((e) => e.name === data.name);
		if (at === -1) {
			creates.push(data);
			continue;
		}
		const [old] = unused.splice(at, 1);
		updates.push({ id: old._id, data });
	}
	return { updates, creates, deletes: unused.map((e) => e._id) };
}

/**
 * Chooses which old activity each new activity corresponds to, for carrying over consumption
 * settings. Matches by unique non-empty name, then by position when the lists line up by type.
 *
 * @param {object[]} oldActivities - Old activities in order.
 * @param {object[]} newActivities - New activities in order.
 * @returns {Map<number, number>} Index in newActivities -> index in oldActivities.
 */
export function pairActivities(oldActivities, newActivities) {
	const pairs = new Map();
	const sameShape =
		oldActivities.length === newActivities.length &&
		oldActivities.every((a, i) => a.type === newActivities[i].type);
	newActivities.forEach((activity, i) => {
		const named = activity.name
			? oldActivities
					.map((a, j) => [a, j])
					.filter(([a]) => a.name === activity.name && a.type === activity.type)
			: [];
		if (named.length === 1) pairs.set(i, named[0][1]);
		else if (sameShape) pairs.set(i, i);
	});
	return pairs;
}

const hasValue = (adv) => adv?.value && Object.keys(adv.value).length > 0;
const levelOf = (adv) => adv?.level ?? adv?.configuration?.level ?? null;

/**
 * Copies the choices recorded on an old item's advancements (ability score picks, chosen
 * skills, granted items, hit point rolls) onto the matching advancements of the new data.
 * Matches by id first. When the compendium re-created an advancement with a new id, it falls
 * back to the same type, title and level, then to the only advancement of that type and level.
 *
 * @param {object[]} oldList - Advancements on the actor's item.
 * @param {object[]} newList - Advancements of the replacement data. Modified in place.
 * @returns {{carried: number, lost: {type: string, title: string, level: number|null}[]}} Result.
 */
export function carryAdvancementValues(oldList, newList) {
	const taken = new Set();
	let carried = 0;
	const lost = [];
	const give = (target, old) => {
		target.value = structuredClone(old.value);
		taken.add(target);
		carried++;
	};

	const valued = oldList.filter(hasValue);
	const pending = [];
	for (const old of valued) {
		const byId = newList.find((n) => n._id === old._id && !taken.has(n));
		if (byId) give(byId, old);
		else pending.push(old);
	}

	const stillPending = [];
	for (const old of pending) {
		const free = newList.filter((n) => !taken.has(n) && n.type === old.type);
		const exact = free.filter(
			(n) => (n.title ?? "") === (old.title ?? "") && levelOf(n) === levelOf(old),
		);
		if (exact.length === 1) give(exact[0], old);
		else stillPending.push(old);
	}

	for (const old of stillPending) {
		const free = newList.filter(
			(n) => !taken.has(n) && n.type === old.type && levelOf(n) === levelOf(old),
		);
		const competing = stillPending.filter(
			(o) => o.type === old.type && levelOf(o) === levelOf(old),
		);
		if (free.length === 1 && competing.length === 1) give(free[0], old);
		else lost.push({ type: old.type, title: old.title ?? "", level: levelOf(old) });
	}
	return { carried, lost };
}

const grantedUuids = (adv) =>
	(adv?.configuration?.items ?? adv?.configuration?.pool ?? [])
		.map((entry) => (typeof entry === "string" ? entry : entry?.uuid))
		.filter(Boolean);

/**
 * Compares the advancements of an actor's class, subclass, ancestry or background with the new
 * compendium version and describes what changes in plain language: features granted at a level
 * that are replaced, added or dropped, other advancements whose settings changed, and the hit die.
 *
 * @param {{advancement: object[], hitDie?: string}} oldSide - The item on the actor.
 * @param {{advancement: object[], hitDie?: string}} newSide - The compendium version.
 * @param {(uuid: string) => string|undefined} nameOf - Looks up a feature's name from its uuid.
 * @returns {{lines: string[], unchanged: number}} Changes, and how many granted features stay as they are.
 */
export function describeBuildChanges(oldSide, newSide, nameOf) {
	const lines = [];
	let unchanged = 0;
	// nameOf returns a feature name, or nothing for items that are not features
	// (equipment, tools, unresolved links); those are left out of the report.
	const levelOf = (adv) => adv?.level ?? adv?.configuration?.level ?? 0;
	const grants = (list) => {
		const byLevel = new Map();
		for (const adv of list) {
			if (!["ItemGrant", "ItemChoice"].includes(adv.type)) continue;
			const level = levelOf(adv);
			const set = byLevel.get(level) ?? new Set();
			for (const uuid of grantedUuids(adv)) {
				const label = nameOf(uuid);
				if (label) set.add(label);
			}
			byLevel.set(level, set);
		}
		return byLevel;
	};

	if (oldSide.hitDie && newSide.hitDie && oldSide.hitDie !== newSide.hitDie)
		lines.push(`Hit die ${oldSide.hitDie} -> ${newSide.hitDie}`);

	const before = grants(oldSide.advancement);
	const after = grants(newSide.advancement);
	for (const level of [...new Set([...before.keys(), ...after.keys()])].sort((a, b) => a - b)) {
		const o = before.get(level) ?? new Set();
		const n = after.get(level) ?? new Set();
		const gone = [...o].filter((x) => !n.has(x));
		const added = [...n].filter((x) => !o.has(x));
		unchanged += [...o].filter((x) => n.has(x)).length;
		const label = level > 0 ? `Level ${level}` : "Start";
		if (gone.length === 1 && added.length === 1) {
			lines.push(`${label}: ${gone[0]} replaced by ${added[0]}`);
			continue;
		}
		if (gone.length === 1 && !added.length) {
			lines.push(`${label}: ${gone[0]} no longer granted`);
			continue;
		}
		if (added.length === 1 && !gone.length) {
			lines.push(`${label}: ${added[0]} added`);
			continue;
		}
		// Several at once: do not guess which replaced which.
		const short = (list) =>
			list.length > 5
				? `${list.slice(0, 5).join(", ")} and ${list.length - 5} more`
				: list.join(", ");
		if (gone.length) lines.push(`${label}: no longer granted: ${short(gone)}`);
		if (added.length) lines.push(`${label}: now granted: ${short(added)}`);
	}

	const other = (list) =>
		new Map(
			list
				.filter((a) => !["ItemGrant", "ItemChoice"].includes(a.type))
				.map((a) => [
					`${a.type}|${a.title ?? ""}|${levelOf(a)}`,
					JSON.stringify(a.configuration ?? {}),
				]),
		);
	const oo = other(oldSide.advancement);
	const nn = other(newSide.advancement);
	const changedLevels = new Map();
	for (const [key, config] of nn) {
		const [type, title, level] = key.split("|");
		const where = `${level > 0 ? `level ${level}` : "start"}`;
		const label = `${type}${title ? ` '${title}'` : ""} (${where})`;
		if (!oo.has(key)) lines.push(`${label} added`);
		else if (oo.get(key) !== config) {
			const group = `${type}${title ? ` '${title}'` : ""}`;
			changedLevels.set(group, [
				...(changedLevels.get(group) ?? []),
				level > 0 ? level : "start",
			]);
		}
	}
	for (const [group, levels] of changedLevels)
		lines.push(
			`${group} settings changed (${levels.length > 1 ? "levels" : "level"} ${levels.join(", ")})`,
		);
	for (const key of oo.keys()) {
		if (nn.has(key)) continue;
		const [type, title, level] = key.split("|");
		lines.push(
			`${type}${title ? ` '${title}'` : ""} (${level > 0 ? `level ${level}` : "start"}) removed`,
		);
	}
	return { lines, unchanged };
}
