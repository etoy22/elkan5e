import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { readdir, readFile, unlink, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import logger from "fancy-log";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

const PACK_DEST = "packs";
const PACK_SRC = "packs/_source";
const PACK_SOURCE_NAME_OVERRIDES = {
	"elkan5e-ancestry-background": "elkan5e-ancestry-background",
};

// Ensure base folders exist
mkdirSync(PACK_SRC, { recursive: true });
mkdirSync(PACK_DEST, { recursive: true });

const argv = yargs(hideBin(process.argv)).command(packageCommand()).help().alias("help", "h").argv;

function packageCommand() {
	return {
		command: "package [action] [pack] [entry]",
		describe: "Manage packages",
		builder: (yargs) => {
			yargs.positional("action", {
				describe: "The action to perform.",
				type: "string",
				choices: ["unpack", "pack", "clean", "remove"],
			});
			yargs.positional("pack", {
				describe: "Name of the pack upon which to work.",
				type: "string",
			});
			yargs.positional("entry", {
				describe:
					"Name of any entry within a pack upon which to work. Only applicable to extract & clean commands.",
				type: "string",
			});
		},
		handler: async (argv) => {
			const { action, pack, entry } = argv;
			switch (action) {
				case "clean":
					return await cleanPacks(pack, entry);
				case "pack":
					return await compilePacks(pack);
				case "unpack":
					return await extractPacks(pack, entry);
				case "remove":
					return await removePacks(pack);
			}
		},
	};
}

// --- HTML cleanup helpers ---

function cleanHtml(html) {
	if (!html || typeof html !== "string") return html;
	let out = html;
	// Strip noisy attributes (id, class, style, dir, role, tabindex, contenteditable, aria-*, data-*)
	out = out.replace(
		/\s+(id|class|style|dir|role|tabindex|contenteditable|aria-[^=\s]+|data-[^=\s]+)=("[^"]*"|'[^']*'|[^\s>]+)/gi,
		(match, attr, value) => {
			const lowerAttr = String(attr).toLowerCase();
			const lowerValue = String(value).toLowerCase();
			// Preserve explicit secret markers
			if (lowerAttr === "class" && /\bsecret\b/.test(lowerValue.replace(/['"]/g, "")))
				return ` ${attr}=${value}`;
			if (lowerAttr === "id" && /\bsecret\b/.test(lowerValue.replace(/['"]/g, "")))
				return ` ${attr}=${value}`;
			return "";
		},
	);
	// Remove boolean aria/data attributes without explicit values
	out = out.replace(/\s+(aria-[^\s=>]+|data-[^\s=>]+)(?!\s*=)/gi, "");
	// Drop div wrappers
	out = out.replace(/<\/?div>/g, "");
	// Remove empty paragraphs
	out = out.replace(/<p>\s*<\/p>/g, "");
	// Collapse redundant whitespace
	out = out.replace(/\s+/g, " ");
	out = collapseRedundantSections(out);
	return out.trim();
}

function replaceSpellRefsInHtml(html) {
	if (!html || typeof html !== "string") return html;
	let out = html;
	// Unwrap existing emphasis around macros to avoid double wrapping
	out = out.replace(/<em>\s*(@UUID\[[^\]]+\]\{[\s\S]*?\})\s*<\/em>/g, "$1");
	// Italicize all spell @UUID macros (any pack containing "spells")
	out = out.replace(/@UUID\[(Compendium\.[^\]]+)\]\{([\s\S]*?)\}/g, (m, pack, label) => {
		if (!/spells/i.test(pack)) return m;
		const plainLabel = String(label).replace(/<\/?em>/g, "");
		return `<em>@UUID[${pack}]{${plainLabel}}</em>`;
	});
	// Italicize anchor labels and keep UUID
	out = out.replace(
		/<a([^>]*?)\sdata-uuid=\"(Compendium\.[^\"]+)\"([^>]*)>([\s\S]*?)<\/a>/g,
		(m, pre, uuid, post, inner) => {
			if (!/spells/i.test(uuid)) return m;
			const innerItal = /<\/?em>/.test(inner) ? inner : `<em>${inner}</em>`;
			return `<a${pre} data-uuid="${uuid}"${post}>${innerItal}</a>`;
		},
	);
	return out;
}

function collapseRedundantSections(html) {
	if (!html || typeof html !== "string") return html;
	let out = html;
	let prev;
	do {
		prev = out;
		out = out.replace(/<section>\s*<section>/gi, "<section>");
		out = out.replace(/<\/section>\s*<\/section>/gi, "</section>");
	} while (out !== prev);
	return out;
}

/** Sanitize description and effects fields on a single entry or embedded item. */
function sanitizeHtmlFields(entry) {
	if (entry?.system?.description) {
		if (typeof entry.system.description.value === "string") {
			entry.system.description.value = cleanHtml(
				replaceSpellRefsInHtml(entry.system.description.value),
			);
		}
		if (typeof entry.system.description.chat === "string" && entry.system.description.chat) {
			entry.system.description.chat = cleanHtml(
				replaceSpellRefsInHtml(entry.system.description.chat),
			);
		}
	}
	if (Array.isArray(entry?.effects)) {
		for (const eff of entry.effects) {
			if (eff && typeof eff.description === "string" && eff.description) {
				eff.description = cleanHtml(replaceSpellRefsInHtml(eff.description));
			}
		}
	}
}

function sanitizeDescriptions(entry) {
	sanitizeHtmlFields(entry);

	// Nested embedded items (e.g., actor.items[])
	if (Array.isArray(entry?.items)) {
		for (const item of entry.items) {
			sanitizeHtmlFields(item);
		}
	}

	// Journal pages (Foundry JournalEntryV10+)
	if (Array.isArray(entry?.pages)) {
		for (const page of entry.pages) {
			if (page?.text && typeof page.text.content === "string" && page.text.content) {
				page.text.content = cleanHtml(replaceSpellRefsInHtml(page.text.content));
			}
			if (page?.system && typeof page.system.tooltip === "string" && page.system.tooltip) {
				page.system.tooltip = cleanHtml(replaceSpellRefsInHtml(page.system.tooltip));
			}
		}
	}
}

function cleanPackEntry(data, { clearSourceId = true, ownership = 0 } = {}) {
	if (clearSourceId && data.flags?.core?.sourceId) delete data.flags.core.sourceId;
	if (data.ownership) data.ownership = { default: ownership };

	const preservedFolder = Object.prototype.hasOwnProperty.call(data, "folder")
		? data.folder
		: undefined;

	function isEmptyDeep(v) {
		if (v == null) return true;
		if (typeof v === "boolean") return v === false;
		if (typeof v === "string") return v.trim() === "";
		if (Array.isArray(v)) return v.every(isEmptyDeep);
		if (typeof v === "object") {
			const keys = Object.keys(v);
			return keys.length === 0 || keys.every((k) => isEmptyDeep(v[k]));
		}
		return false;
	}

	function pruneUnusedFlags(obj) {
		if (!obj?.flags) return;
		for (const k of Object.keys(obj.flags)) {
			if (isEmptyDeep(obj.flags[k])) delete obj.flags[k];
		}
		if (Object.keys(obj.flags).length === 0) delete obj.flags;
	}

	function recursiveClean(obj) {
		if (!obj || typeof obj !== "object") return;
		delete obj._stats;
		delete obj.sort;
		delete obj.ownership;
		pruneUnusedFlags(obj);
		for (const key of Object.keys(obj)) {
			const val = obj[key];
			if (Array.isArray(val)) val.forEach(recursiveClean);
			else if (val && typeof val === "object") recursiveClean(val);
		}
	}
	recursiveClean(data);

	sanitizeDescriptions(data);

	// Assign a slug-based identifier if one doesn't exist yet
	try {
		if (data.system && data.type !== "folder" && data.type !== "script") {
			const hasId =
				typeof data.system.identifier === "string" && data.system.identifier.trim().length > 0;
			if (!hasId) {
				const slug = slugify(String(data.name ?? ""));
				if (slug) data.system.identifier = slug;
			}
		}
	} catch (err) {
		logger.warn(
			`Failed to set identifier for ${data?.name ?? "unknown entry"}: ${err.message}`,
		);
	}

	if (preservedFolder !== undefined) data.folder = preservedFolder;
}

// --- Utility: async generator that yields all .json file paths under a directory ---

async function* walkDir(directoryPath) {
	for (const entry of await readdir(directoryPath, { withFileTypes: true })) {
		const entryPath = path.join(directoryPath, entry.name);
		if (entry.isDirectory()) yield* walkDir(entryPath);
		else if (path.extname(entry.name) === ".json") yield entryPath;
	}
}

async function cleanPacks(packName, entryName) {
	entryName = entryName?.toLowerCase();
	const folders = readdirSync(PACK_SRC, { withFileTypes: true }).filter(
		(file) => file.isDirectory() && (!packName || packName === file.name),
	);

	for (const folder of folders) {
		logger.info(`Cleaning pack ${folder.name}`);
		for await (const src of walkDir(path.join(PACK_SRC, folder.name))) {
			// Skip folder metadata files
			if (path.basename(src) === "_folder.json") continue;

			let data;
			try {
				let content = await readFile(src, { encoding: "utf8" });
				if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // strip BOM
				data = JSON.parse(content);
			} catch (err) {
				logger.error(`Failed to parse JSON in file: ${src}`);
				logger.error(err.message);
				throw err;
			}

			if (entryName && entryName !== data.name.toLowerCase()) continue;
			if (!data._id || !data._key) {
				console.log(`Failed to clean \x1b[31m${src}\x1b[0m, must have _id and _key.`);
				continue;
			}

			cleanPackEntry(data);

			// Rename _container.json -> <slug>.json if needed
			let outPath = src;
			if (path.basename(src) === "_container.json") {
				outPath = path.join(path.dirname(src), `${slugify(data.name)}.json`);
			}

			await writeFile(outPath, JSON.stringify(data, null, "\t"), { mode: 0o664 });

			if (outPath !== src) {
				try {
					await unlink(src);
				} catch {}
			}
		}
	}
}

async function compilePacks(packName) {
	const folders = readdirSync(PACK_SRC, { withFileTypes: true }).filter(
		(file) => file.isDirectory() && (!packName || packName === file.name),
	);

	for (const folder of folders) {
		const folderName = PACK_SOURCE_NAME_OVERRIDES[folder.name] ?? folder.name;
		const src = path.join(PACK_SRC, folderName);
		const dest = path.join(PACK_DEST, folder.name);

		mkdirSync(dest, { recursive: true });
		logger.info(`Compiling pack ${folder.name}`);
		await compilePack(src, dest, {
			recursive: true,
			log: true,
			transformEntry: cleanPackEntry,
			yaml: false,
		});
	}
}

async function extractPacks(packName, entryName) {
	entryName = entryName?.toLowerCase();
	const module = JSON.parse(readFileSync("./module.json", { encoding: "utf8" }));
	const packs = module.packs.filter((p) => !packName || p.name === packName);

	for (const packInfo of packs) {
		const folderName = PACK_SOURCE_NAME_OVERRIDES[packInfo.name] ?? packInfo.name;
		const dest = path.join(PACK_SRC, folderName);

		mkdirSync(dest, { recursive: true });
		logger.info(`Extracting pack ${packInfo.name}`);

		const folders = {};
		const containers = {};

		// First pass: collect folder and container metadata for path resolution
		await extractPack(packInfo.path, dest, {
			log: false,
			transformEntry: (e) => {
				delete e._stats;
				delete e.sort;
				delete e.ownership;
				if (Array.isArray(e.effects)) {
					for (const effect of e.effects) delete effect._stats;
				}
				if (e.system?.source?.sourceClass) delete e.system.source.sourceClass;
				if (e.flags?.core?.sourceId) delete e.flags.core.sourceId;

				if (e._key?.startsWith("!folders"))
					folders[e._id] = { name: slugify(e.name), folder: e.folder };
				else if (e.type === "container")
					containers[e._id] = {
						name: slugify(e.name),
						container: e.system?.container,
						folder: e.folder,
					};

				return false;
			},
		});

		const buildPath = (collection, entry, parentKey) => {
			entry.path = slugify(entry.name);
			let parent = collection[entry[parentKey]];
			while (parent) {
				entry.path = path.join(parent.name, entry.path);
				parent = collection[parent[parentKey]];
			}
		};

		Object.values(folders).forEach((f) => buildPath(folders, f, "folder"));
		Object.values(containers).forEach((c) => {
			buildPath(containers, c, "container");
			const folder = folders[c.folder];
			if (folder) c.path = path.join(folder.path, c.path);
		});

		// Snapshot existing files before extraction
		let existingFiles = [];
		try {
			for await (const f of walkDir(dest)) existingFiles.push(f);
		} catch {}
		const existingFilesSet = new Set(existingFiles.map((f) => path.normalize(f)));
		const writtenFiles = new Set();

		// Second pass: extract, clean, and write entries
		await extractPack(packInfo.path, dest, {
			log: true,
			transformEntry: async (entry) => {
				if (entryName && entry.name?.toLowerCase() !== entryName) return false;

				cleanPackEntry(entry);
				if (entry.system?.source?.sourceClass) delete entry.system.source.sourceClass;
				if (entry.system?.materials?.value) entry.system.materials.value = "";

				let filename;
				if (entry._id in folders) {
					if (Object.prototype.hasOwnProperty.call(entry, "system")) delete entry.system;
					filename = path.join(folders[entry._id].path, "_folder.json");
				} else if (entry._id in containers) {
					filename = path.join(
						containers[entry._id].path,
						`${slugify(entry.name)}.json`,
					);
				} else {
					const outputName = slugify(entry.name);
					const parent = containers[entry.system?.container] ?? folders[entry.folder];
					filename = path.join(parent?.path ?? "", `${outputName}.json`);
				}

				const filePath = path.join(dest, filename);
				mkdirSync(path.dirname(filePath), { recursive: true });
				await writeFile(filePath, JSON.stringify(entry, null, "\t"), "utf8");
				writtenFiles.add(path.normalize(filePath));

				return false;
			},
			yaml: false,
		});

		if (writtenFiles.size === 0) {
			logger.info(
				`No entries extracted for ${packInfo.name}; skipping stale cleanup to preserve existing files.`,
			);
			continue;
		}

		// Remove stale files not written in this extraction
		for (const file of existingFilesSet) {
			if (!writtenFiles.has(file)) {
				try {
					await unlink(file);
					logger.info(`Deleted stale file ${file}`);
				} catch (e) {
					logger.warn(`Failed to delete file ${file}: ${e.message}`);
				}
			}
		}
	}
}

async function removePacks(packName) {
	const entries = await readdir(PACK_DEST, { withFileTypes: true });
	const targets = entries.filter(
		(e) => e.isDirectory() && e.name !== "_source" && (!packName || e.name === packName),
	);

	if (targets.length === 0) {
		logger.info("No matching folders to remove.");
		return;
	}

	for (const entry of targets) {
		const fullPath = path.join(PACK_DEST, entry.name);
		try {
			await rm(fullPath, { recursive: true, force: true });
			logger.info(`Removed folder: ${fullPath}`);
		} catch (err) {
			logger.warn(`Failed to remove folder ${fullPath}: ${err.message}`);
		}
	}
}

/**
 * Convert a name to a URL/file-safe slug.
 * Slashes (e.g. "Enlarge/Reduce") become dashes, not nested dirs.
 *
 * @param {string} name - Name to slugify.
 * @returns {string} The slugified name.
 */
function slugify(name) {
	return name
		.toLowerCase()
		.replace(/'/g, "")
		.replace(/[^a-z0-9]+/gi, " ")
		.trim()
		.replace(/\s+/g, "-");
}
