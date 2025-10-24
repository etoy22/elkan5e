import fs from "fs";
import fsp from "fs/promises"; // for async writeFile
import { readdir, readFile, writeFile } from "node:fs/promises";
import logger from "fancy-log";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

const PACK_DEST = "packs";
const PACK_SRC = "packs/_source";
const PACK_SOURCE_NAME_OVERRIDES = {
	"elkan5e-background": "elkan5e-backgrounds",
};

// Ensure base folders exist
fs.mkdirSync(PACK_SRC, { recursive: true });
fs.mkdirSync(PACK_DEST, { recursive: true });

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

// --- Wix/Ricos HTML cleanup + spell italics helpers ---
function cleanHtml(html) {
	if (!html || typeof html !== "string") return html;
	let out = html;
	// Strip noisy attributes (id, class, style, dir, role, tabindex, contenteditable, aria-*, data-*)
	out = out.replace(
		/\s+(id|class|style|dir|role|tabindex|contenteditable|aria-[^=\s]+|data-[^=\s]+)=("[^"]*"|'[^']*'|[^\s>]+)/gi,
		"",
	);
	// Remove boolean aria/data attributes without explicit values (e.g., aria-label)
	out = out.replace(/\s+(aria-[^\s=>]+|data-[^\s=>]+)(?!\s*=)/gi, "");
	// Drop div wrappers
	out = out.replace(/<\/?div>/g, "");
	// Remove empty paragraphs
	out = out.replace(/<p>\s*<\/p>/g, "");
	// Collapse redundant whitespace
	out = out.replace(/\s+/g, " ").replace(/\s{2,}/g, " ");
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
		const macro = `@UUID[${pack}]{${plainLabel}}`;
		return `<em>${macro}</em>`;
	});
	// Italicize anchor labels and keep UUID; no remap here
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

function sanitizeDescriptions(entry) {
	// system.description
	if (entry?.system?.description) {
		if (typeof entry.system.description.value === "string") {
			let v = entry.system.description.value;
			v = replaceSpellRefsInHtml(v);
			entry.system.description.value = cleanHtml(v);
		}
		if (typeof entry.system.description.chat === "string" && entry.system.description.chat) {
			entry.system.description.chat = cleanHtml(
				replaceSpellRefsInHtml(entry.system.description.chat),
			);
		}
	}
	// effect descriptions
	if (Array.isArray(entry?.effects)) {
		for (const eff of entry.effects) {
			if (eff && typeof eff.description === "string" && eff.description) {
				eff.description = cleanHtml(replaceSpellRefsInHtml(eff.description));
			}
		}
	}
	// nested embedded items (e.g., actor.items[])
	if (Array.isArray(entry?.items)) {
		for (const it of entry.items) {
			if (it?.system?.description) {
				if (
					typeof it.system.description.value === "string" &&
					it.system.description.value
				) {
					let v = it.system.description.value;
					v = replaceSpellRefsInHtml(v);
					it.system.description.value = cleanHtml(v);
				}
				if (typeof it.system.description.chat === "string" && it.system.description.chat) {
					it.system.description.chat = cleanHtml(
						replaceSpellRefsInHtml(it.system.description.chat),
					);
				}
			}
			if (Array.isArray(it?.effects)) {
				for (const eff of it.effects) {
					if (eff && typeof eff.description === "string" && eff.description) {
						eff.description = cleanHtml(replaceSpellRefsInHtml(eff.description));
					}
				}
			}
		}
	}
	// journal pages (Foundry JournalEntryV10+): sanitize HTML content and tooltips
	if (Array.isArray(entry?.pages)) {
		for (const page of entry.pages) {
			// Page textual content
			if (page?.text && typeof page.text.content === "string" && page.text.content) {
				let v = page.text.content;
				v = replaceSpellRefsInHtml(v);
				page.text.content = cleanHtml(v);
			}

			// Rule/tooltips or similar HTML-bearing fields
			if (page?.system && typeof page.system.tooltip === "string" && page.system.tooltip) {
				let v = page.system.tooltip;
				v = replaceSpellRefsInHtml(v);
				page.system.tooltip = cleanHtml(v);
			}
		}
	}
}

function cleanPackEntry(data, { clearSourceId = true, ownership = 0 } = {}) {
	const preservedIdentifier = data?.system?.identifier ?? null;
	// Your existing top-level cleanup
	if (clearSourceId && data.flags?.core?.sourceId) delete data.flags.core.sourceId;
	if (data.ownership) data.ownership = { default: ownership };

	// Recursive deep cleaner for _stats and other keys
	function isEmptyDeep(v) {
		if (v == null) return true;
		if (typeof v === "boolean") return v === false;
		if (typeof v === "string") return v.trim() === "";
		if (Array.isArray(v)) return v.every(isEmptyDeep);
		if (typeof v === "object") {
			const keys = Object.keys(v);
			if (keys.length === 0) return true;
			return keys.every((k) => isEmptyDeep(v[k]));
		}
		return false;
	}

	function pruneUnusedFlags(obj) {
		if (!obj || typeof obj !== "object" || !obj.flags) return;
		const flags = obj.flags;
		for (const k of Object.keys(flags)) {
			if (isEmptyDeep(flags[k])) delete flags[k];
		}
		if (Object.keys(flags).length === 0) delete obj.flags;
	}

	function recursiveClean(obj) {
		if (!obj || typeof obj !== "object") return;

		// Delete these keys if present
		if ("_stats" in obj) delete obj._stats;
		if ("sort" in obj) delete obj.sort;
		if ("ownership" in obj) delete obj.ownership;
		// Prune unused flags blocks
		pruneUnusedFlags(obj);

		// Recursively clean nested objects/arrays
		for (const key of Object.keys(obj)) {
			const val = obj[key];
			if (Array.isArray(val)) {
				val.forEach(recursiveClean);
			} else if (val && typeof val === "object") {
				recursiveClean(val);
			}
		}
	}
	recursiveClean(data);

	// Apply Wix cleanup + spell italics on descriptions
	sanitizeDescriptions(data);

	// Ensure system.identifier exists for all entry types; preserve if already present.
	// If identifier exists but no longer matches the current name (common after duplicating
	// and renaming an entry), update it ONCE to the slug of the current name and mark
	// a flag so it won't be auto-changed again.
	// Ensure system.identifier exists; preserve existing values without replacement.
	try {
		if (data.system || typeof data.system === "object") {
			const currentSlug = slugify(String(data.name || ""));
			const hasId =
				typeof data.system.identifier === "string" &&
				data.system.identifier.trim().length > 0;

			// Only assign a new identifier if one does not already exist
			if (
				!hasId &&
				currentSlug &&
				(data.type !== "folder" ||
					data.type !== "script" ||
					data.pages !== null ||
					data.results.length() < 0)
			) {
				data.system = data.system ?? {};
				data.system.identifier = currentSlug;
			}
		}
	} catch (err) {
		logger.warn(
			`Failed to set identifier for ${data?.name ?? "unknown entry"}: ${err.message}`,
		);
	}
}

async function cleanPacks(packName, entryName) {
	entryName = entryName?.toLowerCase();
	const folders = fs
		.readdirSync(PACK_SRC, { withFileTypes: true })
		.filter((file) => file.isDirectory() && (!packName || packName === file.name));

	async function* _walkDir(directoryPath) {
		const directory = await readdir(directoryPath, { withFileTypes: true });
		for (const entry of directory) {
			const entryPath = path.join(directoryPath, entry.name);
			if (entry.isDirectory()) yield* _walkDir(entryPath);
			else if (path.extname(entry.name) === ".json") yield entryPath;
		}
	}

	for (const folder of folders) {
		logger.info(`Cleaning pack ${folder.name}`);
		for await (const src of _walkDir(path.join(PACK_SRC, folder.name))) {
			let data;
			try {
				const content = await readFile(src, { encoding: "utf8" });
				data = JSON.parse(content);
			} catch (err) {
				logger.error(`Failed to parse JSON in file: ${src}`);
				logger.error(err.message);
				// Stop execution after logging
				throw err;
			}

			if (entryName && entryName !== data.name.toLowerCase()) continue;
			if (!data._id || !data._key) {
				console.log(`Failed to clean \x1b[31m${src}\x1b[0m, must have _id and _key.`);
				continue;
			}
			// Skip folder metadata files entirely during clean
			if (path.basename(src) === "_folder.json") continue;
			cleanPackEntry(data);
			// Determine output path (rename _container.json -> <slug>.json)
			let outPath = src;
			if (path.basename(src) === "_container.json") {
				const newName = `${slugify(data.name)}.json`;
				const candidate = path.join(path.dirname(src), newName);
				outPath = candidate;
			}
			// Write back JSON with tab indentation
			await writeFile(outPath, JSON.stringify(data, null, "\t"), { mode: 0o664 });
			// If we renamed, remove the old file
			if (outPath !== src) {
				try {
					await fsp.unlink(src);
				} catch { }
			}
		}
	}
}

async function compilePacks(packName) {
	const folders = fs
		.readdirSync(PACK_SRC, { withFileTypes: true })
		.filter((file) => file.isDirectory() && (!packName || packName === file.name));

	for (const folder of folders) {
		const folderName = PACK_SOURCE_NAME_OVERRIDES[folder.name] || folder.name;
		const src = path.join(PACK_SRC, folderName);
		const dest = path.join(PACK_DEST, folder.name);

		// Create destination folder if missing
		fs.mkdirSync(dest, { recursive: true });

		logger.info(`Compiling pack ${folder.name}`);
		await compilePack(src, dest, {
			recursive: true,
			log: true,
			transformEntry: cleanPackEntry,
			yaml: false,
		});
	}
}

async function listAllFiles(dir) {
	let results = [];
	const list = await fsp.readdir(dir, { withFileTypes: true });
	for (const file of list) {
		const fullPath = path.join(dir, file.name);
		if (file.isDirectory()) {
			results = results.concat(await listAllFiles(fullPath));
		} else {
			results.push(fullPath);
		}
	}
	return results;
}

async function extractPacks(packName, entryName) {
	entryName = entryName?.toLowerCase();

	const module = JSON.parse(fs.readFileSync("./module.json", { encoding: "utf8" }));

	const packs = module.packs.filter((p) => !packName || p.name === packName);

	for (const packInfo of packs) {
		const folderName = PACK_SOURCE_NAME_OVERRIDES[packInfo.name] || packInfo.name;
		const dest = path.join(PACK_SRC, folderName);

		fs.mkdirSync(dest, { recursive: true });

		logger.info(`Extracting pack ${packInfo.name}`);

		const folders = {};
		const containers = {};

		await extractPack(packInfo.path, dest, {
			log: false,
			transformEntry: (e) => {
				delete e._stats;
				delete e.sort;
				delete e.ownership;
				if (Array.isArray(e.effects)) {
					for (const effect of e.effects) {
						if (effect._stats) delete effect._stats;
					}
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
			let parent = collection[entry[parentKey]];
			entry.path = slugify(entry.name);
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

		let existingFiles = [];
		try {
			existingFiles = await listAllFiles(dest);
		} catch { }

		const existingFilesSet = new Set(existingFiles.map((f) => path.normalize(f)));
		const writtenFiles = new Set();

		await extractPack(packInfo.path, dest, {
			log: true,
			transformEntry: async (entry) => {
				if (entryName && entry.name?.toLowerCase() !== entryName) return false;

				cleanPackEntry(entry);
				delete entry._stats;
				delete entry.sort;
				delete entry.ownership;

				if (Array.isArray(entry.effects)) {
					for (const effect of entry.effects) {
						delete effect._stats;
					}
				}

				if (entry.system?.source?.sourceClass) delete entry.system.source.sourceClass;
				if (entry.flags?.core?.sourceId) delete entry.flags.core.sourceId;
				if (entry.system?.materials?.value) entry.system.materials.value = "";

				let filename;
				if (entry._id in folders) {
					// For folder metadata files, drop top-level system if present
					if (Object.prototype.hasOwnProperty.call(entry, "system")) delete entry.system;
					filename = path.join(folders[entry._id].path, "_folder.json");
				} else if (entry._id in containers)
					filename = path.join(containers[entry._id].path, `${slugify(entry.name)}.json`);
				else {
					const outputName = slugify(entry.name);
					const parent = containers[entry.system?.container] ?? folders[entry.folder];
					filename = path.join(parent?.path ?? "", `${outputName}.json`);
				}

				const filePath = path.join(dest, filename);

				fs.mkdirSync(path.dirname(filePath), { recursive: true });

				await fsp.writeFile(filePath, JSON.stringify(entry, null, "\t"), "utf8");

				writtenFiles.add(path.normalize(filePath));

				return false;
			},
			yaml: false,
		});

		for (const file of existingFilesSet) {
			if (!writtenFiles.has(file)) {
				try {
					await fsp.unlink(file);
					logger.info(`Deleted stale file ${file}`);
				} catch (e) {
					logger.warn(`Failed to delete file ${file}: ${e.message}`);
				}
			}
		}
	}
}

async function removePacks(packName) {
	const packDir = PACK_DEST;
	const entries = await fsp.readdir(packDir, { withFileTypes: true });

	// Filter out only the folders (excluding _source)
	const targetFolders = entries.filter(
		(entry) =>
			entry.isDirectory() &&
			entry.name !== "_source" &&
			(!packName || entry.name === packName),
	);

	// Exit early if there's nothing to remove
	if (targetFolders.length === 0) {
		logger.info("No matching folders to remove.");
		return;
	}

	// Proceed with deletion
	for (const entry of targetFolders) {
		const fullPath = path.join(packDir, entry.name);
		try {
			await fsp.rm(fullPath, { recursive: true, force: true });
			logger.info(`Removed folder: ${fullPath}`);
		} catch (err) {
			logger.warn(`Failed to remove folder ${fullPath}: ${err.message}`);
		}
	}
}

/**
 * Slugify names for safe file or folder names.
 * Allows folder paths by allowing slashes.
 *
 * @param {string} name - Name to convert to a slug.
 * @returns {string} The slugified name.
 */
function slugify(name) {
	return name
		.toLowerCase()
		.replace(/'/g, "")
		.replace(/[^a-z0-9\/]+/gi, " ")
		.trim()
		.replace(/\s+/g, "-");
}
