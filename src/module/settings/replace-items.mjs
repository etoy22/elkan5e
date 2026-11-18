import {
	buildIndex,
	carryAdvancementValues,
	describeBuildChanges,
	deepEqualIgnoringMeta,
	differingFields,
	identifierOf,
	pairActivities,
	planEffectSync,
	resolveMatch,
	suggestVariantOf,
	toComparable,
} from "./match-items.mjs";
import { RENAMED_IDENTIFIERS, RETIRED_IDENTIFIERS } from "./renames.mjs";
import { MigrationProgress, showMigrationReport } from "./migration-ui.mjs";

const { getProperty, setProperty } = foundry.utils;

const ELKAN_BOOK = "Elkan 5e";

/** "elkan" updates Elkan 5e content; "modules" updates content from the selected other modules only. */
let scope = "elkan";
/** Ids of the other modules whose compendium content a "modules" run updates from. */
let extraModuleIds = new Set();
/** When set, only these actors (by id) are processed. Used by the single-character tool. */
let actorFilter = null;
/** Packs already loaded during the current run, so each is read once. */
const packDocCache = new Map();

/**
 * Whether a source book value marks Elkan 5e content ("Elkan 5e", or the website pages that
 * ancestries and backgrounds list as their source).
 *
 * @param {string} [book] - `system.source.book`.
 * @returns {boolean} True for Elkan content.
 */
function isElkanBook(book) {
	return book === ELKAN_BOOK || String(book ?? "").startsWith("elkan5e.com");
}

/**
 * Returns the module id a compendium pack or UUID belongs to, or null for system and world packs.
 *
 * @param {string} [ref] - Pack collection ("module.pack") or compendium UUID.
 * @returns {string|null} Module id.
 */
function moduleOfPack(ref) {
	const text = String(ref ?? "").replace(/^Compendium\./, "");
	const id = text.split(".")[0];
	return id && (game.modules.has(id) || id === game.system.id) ? id : null;
}

/**
 * Lists active modules (other than Elkan 5e) that ship Item compendiums.
 *
 * @returns {{id: string, title: string, packs: number}[]} Modules sorted by title.
 */
export function getModulesWithItemPacks() {
	const out = [];
	// The game system's own compendiums (the regular D&D rules) are offered like a module.
	const systemPacks = game.packs.filter(
		(p) => p.metadata.packageName === game.system.id && p.documentName === "Item",
	);
	const systemEntry = systemPacks.length
		? [
				{
					id: game.system.id,
					title: `${game.system.title} (core rules)`,
					packs: systemPacks.length,
				},
			]
		: [];
	for (const mod of game.modules) {
		if (!mod.active || mod.id === "elkan5e") continue;
		const packs = game.packs.filter(
			(p) => p.metadata.packageName === mod.id && p.documentName === "Item",
		);
		if (packs.length) out.push({ id: mod.id, title: mod.title, packs: packs.length });
	}
	return [...systemEntry, ...out.sort((a, b) => a.title.localeCompare(b.title))];
}

/** Whether this run updates from Elkan 5e ("elkan" or "both"). */
const usesElkan = () => scope !== "modules";
/** Whether this run updates from ticked other modules ("modules" or "both"). */
const usesModules = () => scope !== "elkan";

/**
 * Whether a compendium document counts as content this run should update from.
 *
 * @param {object} doc - Compendium document.
 * @returns {boolean} True for Elkan content (Elkan run) or content from a selected module (modules run).
 */
function isManagedDoc(doc) {
	if (usesElkan() && isElkanBook(doc.system?.source?.book)) return true;
	return usesModules() && extraModuleIds.has(moduleOfPack(doc.pack ?? doc.uuid));
}

/**
 * Whether an actor's item came from Elkan or a selected module (by book or compendium origin).
 *
 * @param {Item} item - Actor item.
 * @returns {boolean} True when it should be reported if no match is found (Elkan content, or content from a selected module in a modules run).
 */
function isManagedItem(item) {
	if (usesElkan() && isElkanBook(item.system?.source?.book)) return true;
	if (!usesModules()) return false;
	const origin = item._stats?.compendiumSource ?? item.flags?.core?.sourceId;
	return extraModuleIds.has(moduleOfPack(origin));
}

/**
 * Features Elkan moved to a different item type, by identifier. Only these may be replaced by a
 * different type. Any other item that shares a name with something of another type is left alone,
 * because NPCs often use a weapon item to stand in for a spell or feature of the same name.
 */
const KNOWN_TYPE_CHANGES = new Set(["ki-empowered-strikes"]);

/** Prefix dnd5e gives a spell scroll's name. */
const SCROLL_PREFIX = "Spell Scroll: ";

/** Phases that update ancestry, background, class or subclass items. */
const BUILD_PHASES = new Set(["ancestry", "background", "class", "subclass"]);

/**
 * Returns an item's advancements as an array whether stored as an array or an object.
 *
 * @param {object[]|object} [value] - `system.advancement`.
 * @returns {object[]} The advancements.
 */
const advancementList = (value) => (Array.isArray(value) ? value : Object.values(value ?? {}));

/** Item types each migration phase looks at. */
const ITEM_TYPES = ["consumable", "equipment", "loot", "tool", "weapon"];

/**
 * Actor-specific state carried over from the old item. `uses.spent` keeps limited-use features
 * from refreshing; the item's max uses and recovery come from the new version.
 */
const PRESERVE = {
	items: ["name", "quantity", "attunement", "attuned", "equipped", "uses.spent"],
	// dnd5e 5.0+ replaced system.preparation with system.method / system.prepared.
	// sourceItem records which class or item a spell belongs to (for example "class:wizard").
	spells: ["name", "method", "prepared", "sourceItem", "uses.spent"],
	features: ["name", "uses.spent"],
	// Class levels and spent hit dice belong to the character, not the compendium class.
	build: ["name", "levels", "hd.spent"],
};

/** Preserved fields where an empty string is a real value that must not be replaced. */
const KEEP_BLANK = new Set(["method", "sourceItem"]);

/** Item properties dnd5e adds when an item is created on an actor, so they are never in the compendium. */
const ACTOR_ADDED_PROPERTIES = ["gear"];

/**
 * Creates an empty report for a run.
 *
 * @param {boolean} dryRun - True when nothing is written.
 * @returns {object} Report.
 */
export function createReport(dryRun = false) {
	return { dryRun, startedAt: Date.now(), finishedAt: null, cancelled: false, phases: [] };
}

/**
 * Creates the counters for one phase of a run.
 *
 * @param {string} key - Phase key.
 * @param {string} label - Phase label.
 * @returns {object} Phase record.
 */
function createPhase(key, label) {
	return {
		key,
		label,
		actors: 0,
		updatedInPlace: 0,
		replaced: 0,
		identical: 0,
		ignored: 0,
		custom: 0,
		noMatch: 0,
		ambiguous: 0,
		errors: 0,
		removed: 0,
		details: [],
	};
}

/**
 * Lets the browser repaint between actors so the progress window stays responsive.
 *
 * @returns {Promise<void>} Resolves on the next task.
 */
function yieldToUi() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Handles filter Docs By Mode for module settings.
 *
 * @param {*} docs - Docs.
 * @param {*} mode - Mode.
 * @returns Operation result.
 */
export function filterDocsByMode(docs, mode) {
	if (mode === "update-All") return docs;
	if (mode === "update-Elkan") return docs.filter((d) => d.system.source?.book === ELKAN_BOOK);
	return [];
}

/**
 * Returns the actors a run will touch.
 *
 * @param {{players: string, npcs: string}} updateMode - Mode per actor kind.
 * @returns {Promise<Actor[]>} Actors.
 */
export async function getActorsToProcess(updateMode) {
	return game.actors.filter((actor) => {
		if (!actor.isOwner) return false;
		if (actorFilter && !actorFilter.has(actor.id)) return false;
		if (actor.type === "character" && updateMode.players !== "none") return true;
		if (actor.type === "npc" && updateMode.npcs !== "none") return true;
		return false;
	});
}

/**
 * Records the actor-specific values that must survive an update.
 *
 * @param {Item[]} items - Items to read.
 * @param {string} _mode - Update mode (unused, kept for callers).
 * @param {string[]} propKeys - Paths under `system` to keep.
 * @returns {Promise<object>} Saved values keyed by identifier.
 */
export async function savePropertiesForTransfer(items, _mode, propKeys) {
	const saved = {};
	for (const item of items) {
		const id = identifierOf(item);
		saved[id] = captureProps(item, propKeys);
	}
	return saved;
}

/**
 * Reads the preserved values off one item.
 *
 * @param {Item} item - Item to read.
 * @param {string[]} propKeys - Paths under `system` to keep.
 * @returns {object} Saved values.
 */
function captureProps(item, propKeys) {
	const saved = {
		sourceBook: item.system.source?.book ?? null,
		img: item.img,
		identifier: identifierOf(item),
		// Preserve dnd5e relationship flags (advancementOrigin, cachedFor, ...) so the
		// advancement system keeps tracking this item after it is updated.
		dnd5eFlags: foundry.utils.deepClone(item.flags?.dnd5e ?? {}),
	};
	for (const key of propKeys) {
		saved[key] = key === "name" ? item.name : getProperty(item.system, key);
	}
	return saved;
}

/**
 * Writes preserved values onto the replacement data.
 *
 * @param {object} newData - Replacement item data. Modified in place.
 * @param {object} savedProps - From {@link captureProps}.
 * @param {string} _mode - Update mode (unused, kept for callers).
 * @param {string[]} preserveProperties - Paths under `system` to keep.
 * @returns {Promise<void>} Resolves when applied.
 */
export async function restorePropertiesToData(newData, savedProps, _mode, preserveProperties = []) {
	applyPreserved(newData, savedProps, preserveProperties);
}

/**
 * Synchronous worker for {@link restorePropertiesToData}.
 *
 * @param {object} newData - Replacement item data. Modified in place.
 * @param {object} savedProps - Saved values.
 * @param {string[]} preserveProperties - Paths under `system` to keep.
 * @param {boolean} [crossType] - True when the new item is a different type; only keep paths it has.
 * @param {boolean} [renamed] - True when Elkan renamed the item, so the new name and identifier win.
 */
function applyPreserved(
	newData,
	savedProps,
	preserveProperties,
	crossType = false,
	renamed = false,
) {
	if (!savedProps) return;

	newData.img = savedProps.img ?? newData.img;
	if (!renamed) newData.system.identifier = savedProps.identifier ?? newData.system?.identifier;

	if (savedProps.dnd5eFlags && Object.keys(savedProps.dnd5eFlags).length > 0) {
		newData.flags ??= {};
		newData.flags.dnd5e = foundry.utils.mergeObject(
			newData.flags.dnd5e ?? {},
			savedProps.dnd5eFlags,
			{ inplace: false },
		);
	}

	// Preserve actor-specific state regardless of the old item's source, so "Update All"
	// doesn't reset non-Elkan items to compendium defaults.
	for (const key of preserveProperties) {
		if (key === "img" || key === "sourceBook" || !(key in savedProps)) continue;
		const value = savedProps[key];
		if (value === undefined || value === null) continue;
		// A blank name or count is "unset"; a blank method or source item is a real setting.
		if (value === "" && !KEEP_BLANK.has(key)) continue;
		if (crossType && key !== "name" && getProperty(newData.system, key) === undefined) continue;
		if (key === "name") {
			if (!renamed) newData.name = value;
		} else setProperty(newData.system, key, value);
	}
}

/**
 * Copies per-activity spent uses and advancement choices from the old item to the new data,
 * matching by id, so updating never refreshes a limited-use ability or forgets a choice.
 *
 * @param {Item} oldItem - Item on the actor.
 * @param {object} newData - Replacement data. Modified in place.
 */
function carryOverActorState(oldItem, newData) {
	const oldProperties = oldItem._source?.system?.properties;
	if (Array.isArray(oldProperties) && Array.isArray(newData.system?.properties)) {
		for (const property of ACTOR_ADDED_PROPERTIES) {
			if (oldProperties.includes(property) && !newData.system.properties.includes(property)) {
				newData.system.properties.push(property);
			}
		}
	}

	const newActivities = newData.system?.activities ?? {};
	for (const [id, activity] of Object.entries(newActivities)) {
		const spent = oldItem.system?.activities?.get?.(id)?.uses?.spent;
		if (spent && activity?.uses) activity.uses.spent = spent;
	}

	const oldAdvancement = oldItem._source?.system?.advancement;
	const newAdvancement = newData.system?.advancement;
	if (!oldAdvancement || !newAdvancement) return { lost: [] };
	const oldList = Array.isArray(oldAdvancement) ? oldAdvancement : Object.values(oldAdvancement);
	const newList = Array.isArray(newAdvancement) ? newAdvancement : Object.values(newAdvancement);
	const result = carryAdvancementValues(oldList, newList);

	// Elkan moved ability score improvements from feats to the class. A feat that had granted one
	// keeps that improvement on the item, so the character's scores and the record of where the
	// bonus came from stay as they were.
	// Work out which lost choices have a counterpart in the new version that now needs filling in,
	// and which are simply gone from it.
	const hasValue = (adv) => adv?.value && Object.keys(adv.value).length > 0;
	const levelOf = (adv) => adv?.level ?? adv?.configuration?.level ?? null;
	result.pendingIds = [];
	for (const l of result.lost) {
		const counterpart = newList.find(
			(n) =>
				!hasValue(n) &&
				!result.pendingIds.includes(n._id) &&
				n.type === l.type &&
				l.type !== "ItemGrant" &&
				levelOf(n) === l.level,
		);
		l.needsChoice = Boolean(counterpart);
		if (counterpart) result.pendingIds.push(counterpart._id);
	}

	result.keptAsi = 0;
	if (oldItem.type === "feat") {
		const kept = result.lost.filter((l) => l.type === "AbilityScoreImprovement");
		for (const old of oldList) {
			const isLost = kept.some(
				(l) =>
					l.title === (old.title ?? "") &&
					l.level === (old.level ?? old.configuration?.level ?? null),
			);
			if (
				old.type === "AbilityScoreImprovement" &&
				isLost &&
				Object.keys(old.value ?? {}).length
			) {
				const copy = structuredClone(old);
				if (Array.isArray(newAdvancement)) newAdvancement.push(copy);
				else newAdvancement[copy._id] = copy;
				result.keptAsi++;
			}
		}
		result.lost = result.lost.filter((l) => l.type !== "AbilityScoreImprovement");
	}
	return result;
}

/**
 * Keeps an old activity's consumption settings when they differ from the new version.
 *
 * @param {Item} oldItem - Item on the actor.
 * @param {object} newData - Replacement data. Modified in place.
 */
function carryOverConsumption(oldItem, newData) {
	const oldActivities = [...(oldItem.system?.activities?.values?.() ?? [])].map(
		(a) => a.toObject?.() ?? a,
	);
	const newEntries = Object.entries(newData.system?.activities ?? {});
	if (oldActivities.length === 0 || newEntries.length === 0) return;

	const pairs = pairActivities(
		oldActivities,
		newEntries.map(([, data]) => data),
	);
	for (const [newIndex, oldIndex] of pairs) {
		const oldC = oldActivities[oldIndex]?.consumption;
		const newActivity = newEntries[newIndex][1];
		const newC = newActivity?.consumption;
		if (!oldC || !newC) continue;
		const same =
			oldC.targets?.length === newC.targets?.length &&
			oldC.scaling?.allowed === newC.scaling?.allowed &&
			oldC.scaling?.max === newC.scaling?.max &&
			oldC.spellSlot === newC.spellSlot;
		if (!same) newActivity.consumption = foundry.utils.deepClone(oldC);
	}
}

/**
 * Builds the data an actor's item should have after the update.
 *
 * @param {Item} oldItem - Item on the actor.
 * @param {Item} doc - Matching compendium document.
 * @param {string} mode - Update mode.
 * @param {object} options - Phase options.
 * @param {string[]} options.preserveProperties - Paths under `system` to keep.
 * @param {boolean} options.preserveConsumption - Keep old activity consumption settings.
 * @returns {{newData: object, lost: {type: string, title: string, level: number|null}[]}}
 *   Replacement item data and the advancement choices that could not be carried over.
 */
function buildReplacementData(
	oldItem,
	doc,
	mode,
	{ preserveProperties, preserveConsumption, renamed = false },
) {
	const newData = structuredClone(doc.toObject());
	delete newData._id;
	applyPreserved(
		newData,
		captureProps(oldItem, preserveProperties),
		preserveProperties,
		oldItem.type !== newData.type,
		renamed,
	);
	const { lost, keptAsi, pendingIds } = carryOverActorState(oldItem, newData);
	if (preserveConsumption) carryOverConsumption(oldItem, newData);
	return { newData, lost, keptAsi, pendingIds };
}

/**
 * Updates an item without deleting it, so its id, sheet order, favorites, hotbar links and
 * advancement tracking stay intact. Effects are matched by name and updated where they exist.
 *
 * @param {Item} item - Item on the actor.
 * @param {object} newData - Replacement data.
 * @returns {Promise<void>} Resolves when written.
 */
async function updateInPlace(item, newData) {
	const flags = { ...newData.flags };
	// Flags other modules or sheets keep on the item (a sheet's favorites, say) stay unless the
	// compendium version defines that namespace itself.
	for (const [namespace, value] of Object.entries(item.flags ?? {})) {
		if (!(namespace in flags) && namespace !== "core")
			flags[namespace] = foundry.utils.deepClone(value);
	}
	if (item.flags?.core)
		flags.core = foundry.utils.mergeObject(newData.flags?.core ?? {}, item.flags.core, {
			inplace: false,
		});

	await item.update(
		{ name: newData.name, img: newData.img, system: newData.system, flags },
		{ diff: false, recursive: false, elkanMigration: true },
	);

	const plan = planEffectSync(
		item.effects.map((e) => ({ _id: e.id, name: e.name })),
		newData.effects ?? [],
	);

	if (plan.updates.length) {
		const updates = plan.updates.map(({ id, data }) => {
			const existing = item.effects.get(id);
			const { _id, ...rest } = data;
			return { ...rest, _id: id, disabled: existing.disabled, origin: existing.origin };
		});
		await item.updateEmbeddedDocuments("ActiveEffect", updates, {
			diff: false,
			recursive: false,
			elkanMigration: true,
		});
	}
	if (plan.deletes.length) await item.deleteEmbeddedDocuments("ActiveEffect", plan.deletes);
	if (plan.creates.length) {
		await item.createEmbeddedDocuments(
			"ActiveEffect",
			plan.creates.map(({ _id, ...rest }) => rest),
		);
	}
}

/**
 * Replaces an item whose type changed (a type can't be edited in place). The new item is
 * created before the old one is deleted, so a failure never loses the item.
 *
 * @param {Actor} actor - Owning actor.
 * @param {Item} item - Item on the actor.
 * @param {object} newData - Replacement data.
 * @returns {Promise<void>} Resolves when swapped.
 */
async function replaceItem(actor, item, newData) {
	await actor.createEmbeddedDocuments("Item", [newData]);
	await actor.deleteEmbeddedDocuments("Item", [item.id]);
}

/**
 * Describes why an item has no compendium match.
 *
 * @param {object} match - Result from resolveMatch.
 * @param {string[]} [variants] - Base items the name looks like a variant of.
 * @returns {string} Message.
 */
function describeUnmatched(match, variants = []) {
	const base =
		match.status === "ambiguous"
			? `Shares identifier '${match.identifier}' with ${match.count} compendium items and none match by name`
			: `No compendium item with identifier '${match.identifier}' or the same name`;
	return variants.length
		? `${base}. Looks like a variant of ${variants.map((v) => `'${v}'`).join(" or ")}; left unchanged`
		: base;
}

/**
 * Loads the compendium lookups for one phase and creates its report record.
 *
 * @param {object} options1 - Options object (see migrateActorByType).
 * @returns {Promise<object>} Phase context used by processActorForPhase.
 */
async function preparePhase({
	compendiums,
	types,
	updateMode,
	preserveProperties,
	preserveConsumption = false,
	filterDocByType = (docs, wanted) => docs.filter((d) => wanted.includes(d.type)),
	progressLabel = "Migration",
	phaseKey = progressLabel.toLowerCase(),
	report = createReport(),
	dryRun = false,
}) {
	const phase = createPhase(phaseKey, progressLabel);
	report.phases.push(phase);

	const lists = Array.isArray(compendiums)
		? { character: compendiums, npc: compendiums }
		: compendiums;
	const indexes = {};
	for (const kind of ["character", "npc"]) {
		const sources = [];
		// Elkan packs come first, so Elkan wins when a module has an item of the same name.
		const packs = usesElkan() ? [...(lists[kind] ?? [])] : [];
		for (const id of extraModuleIds) {
			packs.push(
				...game.packs.filter(
					(p) => p.metadata.packageName === id && p.documentName === "Item",
				),
			);
		}
		const primary = new Set();
		for (const pack of packs) {
			if (!pack) continue;
			primary.add(pack.collection);
			if (!packDocCache.has(pack.collection))
				packDocCache.set(pack.collection, await pack.getDocuments());
			const docs = filterDocByType(packDocCache.get(pack.collection), types);
			sources.push({ pack: pack.collection, docs });
		}
		// Lower priority: the class features pack again, for items of the same type that it stores
		// next to the features (the monk's Unarmed Strike is a weapon) and the few features whose
		// type changed. Other packs are left out on purpose: creature features such as Claws or
		// Slam are templates, and NPCs keep their own damage on them.
		const fallbackDocs = [];
		const classPack = usesElkan() ? game.packs.get("elkan5e.elkan5e-class-features") : null;
		if (classPack) {
			if (!packDocCache.has(classPack.collection))
				packDocCache.set(classPack.collection, await classPack.getDocuments());
			fallbackDocs.push(
				...packDocCache
					.get(classPack.collection)
					.filter(
						(d) =>
							(types.includes(d.type) && !primary.has(classPack.collection)) ||
							(!types.includes(d.type) && KNOWN_TYPE_CHANGES.has(identifierOf(d))),
					),
			);
		}
		sources.push({ pack: "elkan5e.other-packs", docs: fallbackDocs, weak: true });
		indexes[kind] = buildIndex(sources);
	}

	// Spell scrolls are rebuilt from their spell, so the items phase also needs the spells by name.
	let spells = null;
	if (types.includes("consumable")) {
		spells = new Map();
		const spellPacks = [
			...(usesElkan()
				? ["elkan5e.elkan5e-spells", "elkan5e.elkan5e-class-features"]
						.map((id) => game.packs.get(id))
						.filter(Boolean)
				: []),
			...game.packs.filter(
				(p) => extraModuleIds.has(p.metadata.packageName) && p.documentName === "Item",
			),
		];
		for (const pack of spellPacks) {
			if (!packDocCache.has(pack.collection))
				packDocCache.set(pack.collection, await pack.getDocuments());
			for (const d of packDocCache.get(pack.collection))
				if (d.type === "spell" && !spells.has(d.name)) spells.set(d.name, d);
		}
	}

	return {
		phase,
		spells,
		indexes,
		types,
		updateMode,
		preserveProperties,
		preserveConsumption,
		dryRun,
	};
}

/**
 * Updates the matching items of one actor for one phase.
 *
 * @param {object} ctx - Phase context from preparePhase.
 * @param {Actor} actor - Actor to process.
 * @returns {Promise<void>} Resolves when the actor is done.
 */
async function processActorForPhase(ctx, actor) {
	const { phase, indexes, types, updateMode } = ctx;
	const isChar = actor.type === "character";
	const mode = isChar ? updateMode.players : updateMode.npcs;
	if (mode === "none") return;
	const index = indexes[isChar ? "character" : "npc"];

	for (const item of actor.items.filter((i) => types.includes(i.type))) {
		// dnd5e keeps a hidden copy of each scroll's spell on the actor; it manages those itself.
		if (item.flags?.dnd5e?.cachedFor) continue;
		const entry = { actor: actor.name, actorType: actor.type, item: item.name };

		if (ctx.spells && isSpellScroll(item)) {
			await processScroll(ctx, actor, item, entry, mode);
			continue;
		}

		// Elkan's recorded renames only apply to Elkan items, never to a same-named SRD item.
		const match = resolveMatch(item, index, {
			renames:
				usesElkan() && isElkanBook(item.system?.source?.book) ? RENAMED_IDENTIFIERS : {},
		});

		if (
			match.status === "none" &&
			ctx.types.includes("feat") &&
			item.type === "feat" &&
			usesElkan() &&
			isElkanBook(item.system?.source?.book) &&
			RETIRED_IDENTIFIERS.has(item.system?.identifier ?? "")
		) {
			try {
				if (!ctx.dryRun) await item.delete();
				phase.removed++;
				phase.details.push({
					...entry,
					kind: "removed",
					message: "Retired: standard actions are built into dnd5e now",
				});
			} catch (err) {
				recordError(phase, item, actor, entry, err);
			}
			continue;
		}

		if (match.status !== "match") {
			if (isManagedItem(item)) {
				const kind = match.status === "ambiguous" ? "ambiguous" : "noMatch";
				phase[kind]++;
				phase.details.push({
					...entry,
					kind,
					message: describeUnmatched(match, suggestVariantOf(item, index)),
				});
			} else {
				phase.custom++;
			}
			continue;
		}

		if (mode === "update-Elkan" && !isManagedDoc(match.doc)) {
			phase.ignored++;
			continue;
		}

		try {
			const renamed = match.by === "renamed";
			const { newData, lost, keptAsi, pendingIds } = buildReplacementData(
				item,
				match.doc,
				mode,
				{
					preserveProperties: ctx.preserveProperties,
					preserveConsumption: ctx.preserveConsumption,
					renamed,
				},
			);
			const buildChanges = BUILD_PHASES.has(phase.key)
				? describeBuildChanges(
						{
							advancement: advancementList(item._source.system.advancement),
							hitDie: item.system.hd?.denomination,
						},
						{
							advancement: advancementList(newData.system.advancement),
							hitDie: newData.system.hd?.denomination,
						},
						(uuid) => {
							const doc = fromUuidSync(uuid);
							return doc?.type === "feat" ? doc.name : "";
						},
					)
				: null;
			await commitUpdate(ctx, actor, item, newData, entry, {
				buildChanges,
				lost,
				keptAsi,
				pendingIds,
				note: renamed ? `Renamed in Elkan 5e: ${item.name} -> ${newData.name}` : "",
			});
		} catch (err) {
			recordError(phase, item, actor, entry, err);
		}
	}
}

/**
 * Whether an actor item is a spell scroll made from a spell.
 *
 * @param {Item} item - Actor item.
 * @returns {boolean} True for dnd5e spell scrolls.
 */
function isSpellScroll(item) {
	return (
		item.type === "consumable" &&
		item.system?.type?.value === "scroll" &&
		item.name.startsWith(SCROLL_PREFIX)
	);
}

/**
 * Rebuilds a spell scroll from the current version of its spell, keeping its quantity, level
 * and how its description was written (full spell text or a reference).
 *
 * @param {object} ctx - Phase context.
 * @param {Actor} actor - Owner.
 * @param {Item} item - The scroll.
 * @param {object} entry - Report entry for the item.
 * @param {string} mode - Update mode for this actor kind.
 * @returns {Promise<void>} Resolves when handled.
 */
async function processScroll(ctx, actor, item, entry, mode) {
	const { phase } = ctx;
	const spellName = item.name.slice(SCROLL_PREFIX.length).trim();
	const spell = ctx.spells.get(spellName);
	if (!spell) {
		if (isManagedItem(item)) {
			phase.noMatch++;
			phase.details.push({
				...entry,
				kind: "noMatch",
				message: `No spell named '${spellName}' in the compendiums to rebuild this scroll from`,
			});
		} else phase.custom++;
		return;
	}
	if (mode === "update-Elkan" && !isManagedDoc(spell)) {
		phase.ignored++;
		return;
	}

	try {
		const level = item.flags?.dnd5e?.spellLevel?.value ?? spell.system.level;
		const explanation =
			(item.system.description?.value ?? "").length > 600 ? "full" : "reference";
		const scroll = await CONFIG.Item.documentClass.createScrollFromSpell(
			spell,
			{},
			{ dialog: false, level, explanation },
		);
		if (!scroll) throw new Error(`dnd5e could not build a scroll for ${spellName}`);

		const newData = scroll.toObject();
		delete newData._id;
		applyPreserved(newData, captureProps(item, PRESERVE.items), PRESERVE.items);
		const { lost } = carryOverActorState(item, newData);
		await commitUpdate(ctx, actor, item, newData, entry, {
			lost,
			note: "Scroll rebuilt from the current spell",
			scroll: true,
		});
	} catch (err) {
		recordError(phase, item, actor, entry, err);
	}
}

/**
 * Writes (or, in a preview, just counts) one item's update and records it in the phase.
 *
 * @param {object} ctx - Phase context.
 * @param {Actor} actor - Owner.
 * @param {Item} item - Current item.
 * @param {object} newData - Replacement data.
 * @param {object} entry - Report entry for the item.
 * @param {{lost: object[], note: string}} extra - Advancement choices not carried, and a note.
 * @returns {Promise<void>} Resolves when handled.
 */
async function commitUpdate(
	ctx,
	actor,
	item,
	newData,
	entry,
	{
		lost: lostIn = [],
		note = "",
		scroll = false,
		keptAsi = 0,
		pendingIds = [],
		buildChanges = null,
	},
) {
	const { phase, dryRun } = ctx;
	let lost = lostIn;
	const oldData = item.toObject();
	keepActorFlags(oldData, newData);
	if (deepEqualIgnoringMeta(toComparable(oldData), toComparable(newData))) {
		phase.identical++;
		return;
	}

	const fields = differingFields(oldData, newData);
	const typeChanged = item.type !== newData.type;
	if (!dryRun) {
		// dnd5e creates the scroll's hidden spell copy whenever the scroll's activities change, so the
		// old copy goes first; otherwise every rebuild would leave another one behind.
		if (scroll) await removeCachedSpells(actor, item);
		if (typeChanged) await replaceItem(actor, item, newData);
		else await updateInPlace(item, newData);
	}
	if (typeChanged) phase.replaced++;
	else phase.updatedInPlace++;

	const parts = [];
	if (keptAsi)
		parts.push(
			"Ability score improvement kept on this feat (Elkan 5e now gives it through the class), so the character's scores stay the same",
		);
	if (typeChanged) parts.push(`Type changed ${item.type} -> ${newData.type}`);
	else if (note) parts.push(note);
	const gone = lost.filter((l) => !l.needsChoice);
	lost = lost.filter((l) => l.needsChoice);
	if (gone.length)
		parts.push(
			`No longer in Elkan 5e (nothing to choose): ${gone
				.map(
					(l) =>
						`${l.type}${l.title ? ` '${l.title}'` : ""}${l.level != null ? ` level ${l.level}` : ""}`,
				)
				.join(", ")}`,
		);
	if (lost.length) {
		parts.push(
			`Choices to make again (the advancement changed): ${lost
				.map(
					(l) =>
						`${l.type}${l.title ? ` '${l.title}'` : ""}${l.level != null ? ` level ${l.level}` : ""}`,
				)
				.join(", ")}`,
		);
		phase.attention = (phase.attention ?? 0) + 1;
	}
	phase.details.push({
		...entry,
		kind: typeChanged ? "replaced" : "updated",
		fields,
		message: parts.join(". "),
		// Lets the single-character tool offer the player the choices that could not be carried over.
		actorId: actor.id,
		itemId: item.id,
		lost,
		pendingIds,
		// For ancestry, background, class and subclass: what changes in the features they grant.
		changes: buildChanges?.lines,
		unchangedFeatures: buildChanges?.unchanged,
	});
}

/**
 * Copies flags the actor's item has and the compendium version does not (a sheet's own settings,
 * level-up tracking) onto the replacement data, so they survive the update and do not count as a
 * difference.
 *
 * @param {object} oldData - The actor item's data.
 * @param {object} newData - Replacement data. Modified in place.
 */
function keepActorFlags(oldData, newData) {
	newData.flags = { ...(newData.flags ?? {}) };
	for (const [namespace, value] of Object.entries(oldData.flags ?? {})) {
		if (!(namespace in newData.flags))
			newData.flags[namespace] = foundry.utils.deepClone(value);
	}
	for (const key of ["advancementOrigin", "advancementRoot"]) {
		const value = oldData.flags?.dnd5e?.[key];
		if (value !== undefined && newData.flags.dnd5e?.[key] === undefined) {
			newData.flags.dnd5e = { ...(newData.flags.dnd5e ?? {}), [key]: value };
		}
	}
}

/**
 * Deletes the hidden spell copies dnd5e keeps on the actor for a spell scroll.
 *
 * @param {Actor} actor - Owner.
 * @param {Item} scroll - The scroll.
 * @returns {Promise<void>} Resolves when deleted.
 */
async function removeCachedSpells(actor, scroll) {
	const ids = actor.items
		.filter((i) => String(i.flags?.dnd5e?.cachedFor ?? "").includes(`.Item.${scroll.id}.`))
		.map((i) => i.id);
	if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids);
}

/**
 * Records an error for one item.
 *
 * @param {object} phase - Phase record.
 * @param {Item} item - Item that failed.
 * @param {Actor} actor - Its owner.
 * @param {object} entry - Report entry.
 * @param {Error} err - The error.
 */
function recordError(phase, item, actor, entry, err) {
	console.error(`Elkan 5e | Failed to update ${item.name} on ${actor.name}`, err);
	phase.errors++;
	phase.details.push({ ...entry, kind: "error", message: err?.message ?? String(err) });
}

/**
 * Updates every matching item on every selected actor for one phase.
 *
 * @param {object} options1 - Options object.
 * @param {Collection[]|{character: Collection[], npc: Collection[]}} options1.compendiums - Packs in priority order, or one list per actor kind.
 * @param {string[]} options1.types - Item types to process.
 * @param {{players: string, npcs: string}} options1.updateMode - Mode per actor kind.
 * @param {string[]} options1.preserveProperties - Paths under `system` to keep.
 * @param {boolean} [options1.preserveConsumption] - Keep old activity consumption settings.
 * @param {string} [options1.progressLabel] - Phase label.
 * @param {string} [options1.phaseKey] - Phase key.
 * @param {object} [options1.report] - Report to add this phase to.
 * @param {boolean} [options1.dryRun] - Only report what would change.
 * @param {MigrationProgress} [options1.progress] - Progress window.
 * @returns {Promise<object>} The phase record.
 */
export async function migrateActorByType(options) {
	const {
		progress = null,
		report = createReport(),
		updateMode,
		progressLabel = "Migration",
	} = options;
	const ctx = await preparePhase({ ...options, report });
	const actors = await getActorsToProcess(updateMode);
	ctx.phase.actors = actors.length;
	progress?.startPhase(progressLabel, actors.length, ctx.dryRun);

	for (const actor of actors) {
		if (progress?.cancelled) {
			report.cancelled = true;
			break;
		}
		await processActorForPhase(ctx, actor);
		progress?.tick(actor.name);
		await yieldToUi();
	}

	return ctx.phase;
}

/**
 * Runs several phases (items, spells, features) in one pass, so each actor is opened once and
 * every selected kind of its content is updated together.
 *
 * @param {object[]} phaseOptions - Options for each phase, as for migrateActorByType.
 * @param {{report: object, dryRun: boolean, progress: MigrationProgress}} extra - Shared run state.
 * @returns {Promise<object[]>} The phase records.
 */
export async function migrateActorsTogether(phaseOptions, { report, dryRun, progress }) {
	const contexts = [];
	const actors = new Map();
	for (const options of phaseOptions) {
		const ctx = await preparePhase({ ...options, report, dryRun });
		const list = await getActorsToProcess(options.updateMode);
		ctx.phase.actors = list.length;
		for (const actor of list) actors.set(actor.id, actor);
		contexts.push(ctx);
	}
	const labels = contexts.map((c) => c.phase.label.toLowerCase()).join(", ");
	progress?.startPhase(`Updating ${labels}`, actors.size, dryRun);

	for (const actor of actors.values()) {
		if (progress?.cancelled) {
			report.cancelled = true;
			break;
		}
		const isChar = actor.type === "character";
		for (const ctx of contexts) {
			const mode = isChar ? ctx.updateMode.players : ctx.updateMode.npcs;
			if (mode !== "none") await processActorForPhase(ctx, actor);
		}
		progress?.tick(actor.name);
		await yieldToUi();
	}
	return contexts.map((c) => c.phase);
}

/**
 * Removes spells and features that are exact duplicates of another item on the same actor.
 *
 * @param {object} options - Which actor types to process.
 * @param {boolean} options.actor - Process player characters.
 * @param {boolean} options.npc - Process NPCs.
 * @param {object} [options.report] - Report to add this phase to.
 * @param {boolean} [options.dryRun] - Only report what would be removed.
 * @param {MigrationProgress} [options.progress] - Progress window.
 * @returns {Promise<object|null>} The phase record, or null when nothing was selected.
 */
async function removeDuplicateItems({
	actor = false,
	npc = false,
	report = createReport(),
	dryRun = false,
	progress = null,
}) {
	if (!actor && !npc) return null;

	const phase = createPhase("duplicates", "Duplicate Items");
	report.phases.push(phase);

	const actors = await getActorsToProcess({
		players: actor ? "update-All" : "none",
		npcs: npc ? "update-All" : "none",
	});
	phase.actors = actors.length;
	progress?.startPhase(phase.label, actors.length, dryRun);

	for (const actorDoc of actors) {
		if (progress?.cancelled) {
			report.cancelled = true;
			break;
		}

		const grouped = new Map();
		for (const item of actorDoc.items.filter((i) => ["spell", "feat"].includes(i.type))) {
			const identifier = item.system?.identifier?.trim();
			const key = identifier
				? `id:${identifier.toLowerCase()}`
				: `name:${item.name.trim().toLowerCase()}`;
			if (!grouped.has(key)) grouped.set(key, []);
			grouped.get(key).push(item);
		}

		const toDelete = [];
		for (const items of grouped.values()) {
			if (items.length <= 1) continue;
			const kept = [];
			for (const item of items) {
				// Ignore sheet order; advancement flags still count so a tracked copy isn't removed.
				const { sort: _sort, ...itemObj } = item.toObject();
				const twin = kept.find((other) => {
					const { sort: _otherSort, ...otherObj } = other.toObject();
					return deepEqualIgnoringMeta(otherObj, itemObj);
				});
				if (twin) {
					toDelete.push(item.id);
					phase.details.push({
						actor: actorDoc.name,
						actorType: actorDoc.type,
						item: item.name,
						kind: "removed",
						message: `Duplicate of ${twin.id}`,
					});
				} else {
					kept.push(item);
				}
			}
		}

		if (toDelete.length > 0) {
			try {
				if (!dryRun) await actorDoc.deleteEmbeddedDocuments("Item", toDelete);
				phase.removed += toDelete.length;
			} catch (err) {
				console.error(`Elkan 5e | Failed to remove duplicates on ${actorDoc.name}`, err);
				phase.errors++;
				phase.details.push({
					actor: actorDoc.name,
					actorType: actorDoc.type,
					item: "(duplicates)",
					kind: "error",
					message: err?.message ?? String(err),
				});
			}
		}

		progress?.tick(actorDoc.name);
		await yieldToUi();
	}
	return phase;
}

/**
 * Builds the options for the spells phase.
 *
 * @param {{players: string, npcs: string}} updateMode - Mode per actor kind.
 * @returns {object|null} Phase options, or null when nothing is selected or a pack is missing.
 */
function spellsPhaseOptions(updateMode) {
	if (updateMode.players === "none" && updateMode.npcs === "none") return null;
	const compFeatures = game.packs.get("elkan5e.elkan5e-class-features");
	const compSpells = game.packs.get("elkan5e.elkan5e-spells");
	if (scope === "elkan" && (!compFeatures || !compSpells)) return null;
	return {
		compendiums: [compFeatures, compSpells],
		types: ["spell"],
		updateMode,
		preserveProperties: PRESERVE.spells,
		preserveConsumption: true,
		progressLabel: "Spells",
		phaseKey: "spells",
	};
}

/**
 * Builds the options for the items phase.
 *
 * @param {{players: string, npcs: string}} updateMode - Mode per actor kind.
 * @returns {object|null} Phase options, or null when nothing is selected or the pack is missing.
 */
function itemsPhaseOptions(updateMode) {
	if (updateMode.players === "none" && updateMode.npcs === "none") return null;
	const compEquip = game.packs.get("elkan5e.elkan5e-equipment");
	if (scope === "elkan" && !compEquip) return null;
	// Spell components such as the Bag of Diamond Dust are loot items stored in the spells pack.
	return {
		compendiums: [compEquip, game.packs.get("elkan5e.elkan5e-spells")],
		types: ITEM_TYPES,
		updateMode,
		preserveProperties: PRESERVE.items,
		progressLabel: "Items",
		phaseKey: "items",
	};
}

/**
 * Builds the options for the features phase. Characters match against class features, then
 * feats. NPCs match creature features first.
 *
 * @param {{players: string, npcs: string}} updateMode - Mode per actor kind.
 * @returns {object|null} Phase options, or null when nothing is selected or the pack is missing.
 */
function featuresPhaseOptions(updateMode) {
	if (updateMode.players === "none" && updateMode.npcs === "none") return null;
	const pack = (name) => game.packs.get(`elkan5e.${name}`);
	const classFeatures = pack("elkan5e-class-features");
	if (scope === "elkan" && !classFeatures) return null;
	return {
		compendiums: {
			character: [classFeatures, pack("elkan5e-feats")],
			npc: [pack("elkan5e-creature-features"), classFeatures, pack("elkan5e-feats")],
		},
		types: ["feat"],
		updateMode,
		preserveProperties: PRESERVE.features,
		progressLabel: "Features",
		phaseKey: "features",
	};
}

/**
 * Updates spells on the selected actors.
 *
 * @param {*} updateMode - Update Mode.
 * @param {object} [extra] - Report, dry run and progress.
 * @returns {Promise<object|undefined>} The phase record.
 */
export async function migrateActorSpells(
	updateMode = { players: "update-Elkan", npcs: "update-Elkan" },
	extra = {},
) {
	const options = spellsPhaseOptions(updateMode);
	if (options) return migrateActorByType({ ...options, ...extra });
}

/**
 * Updates inventory items on the selected actors.
 *
 * @param {*} updateMode - Update Mode.
 * @param {object} [extra] - Report, dry run and progress.
 * @returns {Promise<object|undefined>} The phase record.
 */
export async function migrateActorItems(
	updateMode = { players: "update-All", npcs: "update-Elkan" },
	extra = {},
) {
	const options = itemsPhaseOptions(updateMode);
	if (options) return migrateActorByType({ ...options, ...extra });
}

/**
 * Updates features on the selected actors.
 *
 * @param {*} updateMode - Update Mode.
 * @param {object} [extra] - Report, dry run and progress.
 * @returns {Promise<object|undefined>} The phase record.
 */
export async function migrateActorFeatures(
	updateMode = { players: "update-Elkan", npcs: "none" },
	extra = {},
) {
	const options = featuresPhaseOptions(updateMode);
	if (options) return migrateActorByType({ ...options, ...extra });
}

/**
 * Builds the options for the three character-build phases (ancestry, background, class and
 * subclass). Each takes one mode that applies to characters and NPCs alike.
 *
 * @param {{ancestry: string, background: string, class: string}} modes - Mode per phase.
 * @returns {object[]} Phase options for the selected phases.
 */
function buildPhasesOptions(modes) {
	const ancestryPack = game.packs.get("elkan5e.elkan5e-ancestry-background");
	const classPack = game.packs.get("elkan5e.elkan5e-class");
	const make = (key, label, types, pack, mode) =>
		(mode.players !== "none" || mode.npcs !== "none") && (scope !== "elkan" || pack)
			? {
					compendiums: [pack],
					types,
					updateMode: { players: mode.players, npcs: mode.npcs },
					preserveProperties: PRESERVE.build,
					progressLabel: label,
					phaseKey: key,
				}
			: null;
	return [
		make("ancestry", "Ancestries", ["race"], ancestryPack, modes.ancestry),
		make("background", "Backgrounds", ["background"], ancestryPack, modes.background),
		make("class", "Classes", ["class"], classPack, modes.class),
		make("subclass", "Subclasses", ["subclass"], classPack, modes.subclass),
	].filter(Boolean);
}

/**
 * Logs a short summary of a report to the browser console.
 *
 * @param {object} report - Finished report.
 */
function logReport(report) {
	console.groupCollapsed(`[Elkan 5e] ${report.dryRun ? "Preview" : "Update"} summary`);
	for (const p of report.phases) {
		console.log(
			`${p.label}: ${p.updatedInPlace} updated, ${p.replaced} replaced, ${p.removed} removed, ` +
				`${p.identical} already current, ${p.noMatch + p.ambiguous} unmatched, ${p.errors} errors`,
		);
	}
	console.groupEnd();
}

/**
 * Runs the selected update phases, one after another so they never edit the same actor at the
 * same time, then shows the report.
 *
 * @param {object} updates - Selections from the update dialog.
 * @param {{dryRun?: boolean}} [options] - Set dryRun to preview without changing anything.
 * @returns {Promise<object>} The finished report.
 */
export async function processElkanUpdateForm(updates, { dryRun = false } = {}) {
	const report = createReport(dryRun);
	scope = ["modules", "both"].includes(updates.scope) ? updates.scope : "elkan";
	actorFilter = Array.isArray(updates.actorIds) ? new Set(updates.actorIds) : null;
	extraModuleIds = new Set(
		scope !== "elkan"
			? (updates.extraModules ?? []).filter(
					(id) => id === game.system.id || game.modules.get(id)?.active,
				)
			: [],
	);
	packDocCache.clear();
	report.scope = scope;
	report.extraModules = [...extraModuleIds];
	const progress = new MigrationProgress();
	await progress.open();
	const extra = { report, dryRun, progress };

	try {
		// Build updates (ancestry, background, class) run on their own: they rewrite the advancement
		// data that features, spells and items depend on.
		const kind = (name) => ({
			players: updates[`actor${name}`] ?? "none",
			npcs: updates[`npc${name}`] ?? "none",
		});
		const hasBuildRows = ["Ancestry", "Background", "Class", "Subclass"].some(
			(n) =>
				(updates[`actor${n}`] ?? "none") !== "none" ||
				(updates[`npc${n}`] ?? "none") !== "none",
		);
		if (hasBuildRows) {
			scope = "elkan";
			extraModuleIds = new Set();
		}
		const buildPhases = buildPhasesOptions({
			ancestry: kind("Ancestry"),
			background: kind("Background"),
			class: kind("Class"),
			subclass: kind("Subclass"),
		});

		if (buildPhases.length) {
			// Ancestry, background and class updates only ever use the Elkan 5e versions.
			scope = "elkan";
			extraModuleIds = new Set();
			report.scope = scope;
			report.extraModules = [];
			await migrateActorsTogether(buildPhases, extra);
		} else {
			if (scope === "elkan")
				await removeDuplicateItems({
					actor: updates.actorDuplicate,
					npc: updates.npcDuplicate,
					...extra,
				});
			if (!progress.cancelled) {
				// Items, spells and features run in one pass, so every actor is opened once.
				const phases = [
					itemsPhaseOptions({ players: updates.actorItems, npcs: updates.npcItems }),
					spellsPhaseOptions({ players: updates.actorSpells, npcs: updates.npcSpells }),
					featuresPhaseOptions({
						players: updates.actorFeatures,
						npcs: updates.npcFeatures ?? "none",
					}),
				].filter(Boolean);
				if (phases.length) await migrateActorsTogether(phases, extra);
			}
		}
	} catch (err) {
		console.error("Elkan 5e | Update stopped by an error", err);
		report.fatal = err?.message ?? String(err);
	} finally {
		report.cancelled ||= progress.cancelled;
		report.finishedAt = Date.now();
		scope = "elkan";
		extraModuleIds = new Set();
		actorFilter = null;
		packDocCache.clear();
		await progress.close();
	}

	logReport(report);
	await showMigrationReport(report);
	return report;
}

/**
 * Lists the advancement choices a build update could not carry over, grouped by actor and item,
 * so the player can make them.
 *
 * @param {object} report - Report from processElkanUpdateForm.
 * @returns {{actorId: string, itemId: string, label: string, levels: number[]}[]} Items needing choices.
 */
export function collectPendingChoices(report) {
	const found = new Map();
	for (const phase of report.phases ?? []) {
		for (const d of phase.details ?? []) {
			if (!d.pendingIds?.length || !d.actorId) continue;
			found.set(`${d.actorId}.${d.itemId}`, {
				actorId: d.actorId,
				itemId: d.itemId,
				label: `${d.actor}: ${d.item}`,
				advancementIds: d.pendingIds,
			});
		}
	}
	return [...found.values()];
}

/**
 * Opens the item's own sheet on its Advancement tab, where the player makes the choices that the
 * update could not keep using dnd5e's normal controls.
 *
 * @param {string} actorId - Actor id.
 * @param {string} itemId - Class, subclass, ancestry or background item id.
 * @returns {Promise<boolean>} True when the sheet opened.
 */
export async function openChoicesFor(actorId, itemId) {
	const item = game.actors.get(actorId)?.items.get(itemId);
	if (!item) return false;
	await item.sheet.render({ force: true });
	try {
		item.sheet.changeTab?.("advancement", "primary");
	} catch (err) {
		console.warn("Elkan 5e | Could not switch to the Advancement tab", err);
	}
	return true;
}
