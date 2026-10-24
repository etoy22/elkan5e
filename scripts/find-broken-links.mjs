import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACK_SOURCE_ROOT = path.resolve(__dirname, "..", "packs", "_source");

/**
 * Recursively lists JSON file paths under a directory.
 *
 * @param {string} dir - Directory to search.
 * @returns {string[]} Paths of files with a lowercase `.json` extension.
 * @throws {Error} If a directory cannot be read.
 */
function walk(dir) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(entryPath));
		else if (path.extname(entry.name) === ".json") out.push(entryPath);
	}
	return out;
}

// Recursively collect all string values in an object, paired with a JSON-pointer-ish path.
/**
 * Appends nested string values and their dot-separated field paths to `out`.
 *
 * @param {*} value - Value to traverse, including arrays and objects.
 * @param {(string|number)[]} pathParts - Field names and array indices leading to this value.
 * @param {{path: string, value: string}[]} out - Collection to populate in place.
 */
function collectStrings(value, pathParts, out) {
	if (typeof value === "string") {
		out.push({ path: pathParts.join("."), value });
	} else if (Array.isArray(value)) {
		value.forEach((v, i) => collectStrings(v, [...pathParts, i], out));
	} else if (value && typeof value === "object") {
		for (const [k, v] of Object.entries(value)) collectStrings(v, [...pathParts, k], out);
	}
}

const files = walk(PACK_SOURCE_ROOT);

// Embedded collection names used in "_key" (e.g. "!items.effects!<itemId>.<effectId>") -> document type
const COLLECTION_TYPES = {
	actors: "Actor",
	items: "Item",
	effects: "ActiveEffect",
	journal: "JournalEntry",
	pages: "JournalEntryPage",
	tables: "RollTable",
	results: "TableResult",
	macros: "Macro",
	folders: "Folder",
	scenes: "Scene",
	cards: "Cards",
	playlists: "Playlist",
	adventures: "Adventure",
};

// packName -> Set of full document paths, e.g. "Item.<id>", "Item.<id>.ActiveEffect.<id>", "Item.<id>.Activity.<id>"
const pathsByPack = new Map();
// packName -> Set of top-level document ids (legacy links omit the document type)
const topIdsByPack = new Map();
// id -> Set of packNames it appears in (for cross-check when packName in link doesn't match)
const idToPacks = new Map();
// documents parsed, for reference during reporting
const docs = [];

// "!items.effects!abc.def" -> "Item.abc.ActiveEffect.def"
function keyToPath(key) {
	const m = /^!([a-z.]+)!(.+)$/.exec(key);
	if (!m) return null;
	const collections = m[1].split(".");
	const ids = m[2].split(".");
	if (collections.length !== ids.length) return null;
	const types = collections.map((c) => COLLECTION_TYPES[c]);
	if (types.some((t) => !t)) return null;
	return types.flatMap((t, i) => [t, ids[i]]).join(".");
}

for (const filePath of files) {
	const rel = path.relative(PACK_SOURCE_ROOT, filePath);
	const packName = rel.split(path.sep)[0];
	let json;
	try {
		json = JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch {
		continue;
	}
	docs.push({ filePath, rel, packName, json });

	if (!pathsByPack.has(packName)) pathsByPack.set(packName, new Set());
	if (!topIdsByPack.has(packName)) topIdsByPack.set(packName, new Set());
	const pathSet = pathsByPack.get(packName);
	const topIds = topIdsByPack.get(packName);

	const addId = (id) => {
		if (!idToPacks.has(id)) idToPacks.set(id, new Set());
		idToPacks.get(id).add(packName);
	};

	// Index every document (top-level + embedded items/effects/pages/results) by its full path from "_key",
	// plus the activities each one holds.
	/**
	 * Indexes each document's full path in the current pack's path set and the reverse pack lookup.
	 *
	 * @param {*} value - Parsed document or nested value to traverse.
	 */
	(function collectPaths(value) {
		if (Array.isArray(value)) {
			value.forEach(collectPaths);
		} else if (value && typeof value === "object") {
			const docPath = typeof value._key === "string" ? keyToPath(value._key) : null;
			if (docPath) {
				pathSet.add(docPath);
				addId(value._id);
				if (!docPath.includes(".", docPath.indexOf(".") + 1)) topIds.add(value._id);
				for (const activityId of Object.keys(value.system?.activities ?? {})) {
					pathSet.add(`${docPath}.Activity.${activityId}`);
					addId(activityId);
				}
			}
			for (const v of Object.values(value)) collectPaths(v);
		}
	})(json);
}

console.error(
	`Indexed ${files.length} files across ${pathsByPack.size} packs, ${idToPacks.size} unique ids.`,
);

// Now scan every string field for @UUID[...] and @Compendium[...] references.
const uuidRe = /@UUID\[([^\]]+)\]/g;
const compendiumRe = /@Compendium\[([^\]]+)\]/g;

const broken = [];

/**
 * Extracts a compendium reference's scope, pack, final ID, and optional anchor.
 * Accepts typed and legacy references without validating their segments.
 *
 * @param {string} ref - UUID reference without the surrounding enrichment markup.
 * @returns {{scope: string, packName: string, id: string, anchor: string|undefined, raw: string}|null}
 * Compendium reference parts, or null for a world-document or other non-compendium reference.
 */
function parseUuidRef(ref) {
	// ref examples:
	// Compendium.elkan5e.elkan5e-spells.Item.AbCdEf123456
	// Compendium.elkan5e.elkan5e-spells.AbCdEf123456 (legacy, no doc type segment)
	// Compendium.elkan5e.elkan5e-rules.JournalEntry.<id>.JournalEntryPage.<id>#anchor-slug
	// Actor.someId / Item.someId (world doc, not checkable here)
	const [withoutAnchor, anchor] = ref.split("#");
	const parts = withoutAnchor.split(".");
	if (parts[0] !== "Compendium") return null;
	// parts: Compendium, scope, packName, [DocType, id]*  (or a lone id for legacy links)
	const scope = parts[1];
	const packName = parts[2];
	const docParts = parts.slice(3);
	const id = parts[parts.length - 1];
	return { scope, packName, docParts, id, anchor, raw: ref };
}

// Returns null when the reference resolves, otherwise why it doesn't.
function checkDocPath(info) {
	const { packName, docParts } = info;
	if (docParts.length === 1) {
		return topIdsByPack.get(packName).has(docParts[0])
			? null
			: missingIdReason(docParts[0], packName);
	}
	if (docParts.length === 0 || docParts.length % 2 !== 0) return "malformed document path";
	const pathSet = pathsByPack.get(packName);
	// Check each parent-child step so an existing leaf id under the wrong parent is still caught.
	for (let i = 2; i <= docParts.length; i += 2) {
		const prefix = docParts.slice(0, i).join(".");
		if (pathSet.has(prefix)) continue;
		const [type, id] = docParts.slice(i - 2, i);
		if (i === 2) return `${type} ${id}: ${missingIdReason(id, packName)}`;
		const parent = docParts.slice(0, i - 2).join(".");
		return idToPacks.has(id)
			? `${type} ${id} exists, but not under ${parent}`
			: `${type} ${id} not found under ${parent} (id does not exist in any pack)`;
	}
	return null;
}

function missingIdReason(id, packName) {
	const foundElsewhere = idToPacks.get(id);
	if (foundElsewhere?.has(packName))
		return `id ${id} exists in "${packName}" but not at this path`;
	return foundElsewhere
		? `id ${id} not in pack "${packName}" (found in: ${[...foundElsewhere].join(", ")})`
		: `id ${id} does not exist in any pack`;
}

function parseCompendiumRef(ref) {
	// legacy @Compendium[elkan5e.elkan5e-spells.AbCdEf123456] has no "Compendium." prefix
	return parseUuidRef(ref.startsWith("Compendium.") ? ref : `Compendium.${ref}`);
}

for (const { rel, json } of docs) {
	const strings = [];
	collectStrings(json, [], strings);
	for (const { path: fieldPath, value } of strings) {
		for (const re of [uuidRe, compendiumRe]) {
			re.lastIndex = 0;
			let m;
			while ((m = re.exec(value))) {
				const full = m[1];
				// links may have a trailing {Label} outside the brackets, and may include a leaf name after id e.g. ...Item.id]{Label}
				const linkTarget = full.split("]")[0]; // just in case
				const info =
					re === compendiumRe ? parseCompendiumRef(linkTarget) : parseUuidRef(linkTarget);
				if (!info) continue; // skip non-Compendium refs (world Actor/Item direct refs), can't validate
				if (info.scope !== "elkan5e") continue; // external module reference, skip
				if (!pathsByPack.has(info.packName)) {
					broken.push({
						file: rel,
						field: fieldPath,
						ref: full,
						reason: `unknown pack "${info.packName}"`,
					});
					continue;
				}
				const reason = checkDocPath(info);
				if (reason) broken.push({ file: rel, field: fieldPath, ref: full, reason });
			}
		}
	}
}

if (broken.length === 0) {
	console.log("No broken @UUID/@Compendium links found.");
} else {
	console.log(`Found ${broken.length} broken link reference(s):\n`);
	for (const b of broken) {
		console.log(`${b.file}\n  field: ${b.field}\n  ref:   ${b.ref}\n  ${b.reason}\n`);
	}
}
