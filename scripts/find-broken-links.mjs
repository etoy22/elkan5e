import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACK_SOURCE_ROOT = path.resolve(__dirname, "..", "packs", "_source");

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

// packName -> Set of ids (top-level document ids AND any embedded id found anywhere, e.g. effects/activities/items)
const idsByPack = new Map();
// id -> Set of packNames it appears in (for cross-check when packName in link doesn't match)
const idToPacks = new Map();
// documents parsed, for reference during reporting
const docs = [];

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

	if (!idsByPack.has(packName)) idsByPack.set(packName, new Set());
	const idSet = idsByPack.get(packName);

	// Collect every "_id" found anywhere in the document (top-level + nested items/effects/activities/etc.)
	(function collectIds(value) {
		if (Array.isArray(value)) {
			value.forEach(collectIds);
		} else if (value && typeof value === "object") {
			if (typeof value._id === "string") {
				idSet.add(value._id);
				if (!idToPacks.has(value._id)) idToPacks.set(value._id, new Set());
				idToPacks.get(value._id).add(packName);
			}
			for (const v of Object.values(value)) collectIds(v);
		}
	})(json);
}

console.error(`Indexed ${files.length} files across ${idsByPack.size} packs, ${idToPacks.size} unique ids.`);

// Now scan every string field for @UUID[...] and @Compendium[...] references.
const uuidRe = /@UUID\[([^\]]+)\]/g;
const compendiumRe = /@Compendium\[([^\]]+)\]/g;

const broken = [];

function parseUuidRef(ref) {
	// ref examples:
	// Compendium.elkan5e.elkan5e-spells.Item.AbCdEf123456
	// Compendium.elkan5e.elkan5e-spells.AbCdEf123456 (legacy, no doc type segment)
	// Compendium.elkan5e.elkan5e-rules.JournalEntry.<id>.JournalEntryPage.<id>#anchor-slug
	// Actor.someId / Item.someId (world doc, not checkable here)
	const [withoutAnchor, anchor] = ref.split("#");
	const parts = withoutAnchor.split(".");
	if (parts[0] !== "Compendium") return null;
	// parts: Compendium, scope, packName, [DocType, id]*
	const scope = parts[1];
	const packName = parts[2];
	const id = parts[parts.length - 1];
	return { scope, packName, id, anchor, raw: ref };
}

for (const { rel, packName: sourcePack, json } of docs) {
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
				const info = parseUuidRef(linkTarget);
				if (!info) continue; // skip non-Compendium refs (world Actor/Item direct refs), can't validate
				if (info.scope !== "elkan5e") continue; // external module reference, skip
				const packIds = idsByPack.get(info.packName);
				if (!packIds) {
					broken.push({ file: rel, field: fieldPath, ref: full, reason: `unknown pack "${info.packName}"` });
					continue;
				}
				if (!packIds.has(info.id)) {
					const foundElsewhere = idToPacks.get(info.id);
					const reason = foundElsewhere
						? `id ${info.id} not in pack "${info.packName}" (found in: ${[...foundElsewhere].join(", ")})`
						: `id ${info.id} does not exist in any pack`;
					broken.push({ file: rel, field: fieldPath, ref: full, reason });
				}
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
