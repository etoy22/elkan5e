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

const DEFAULT_FLAG_CANDIDATES = {
	midiProperties: [
		{
			confirmTargets: "default",
			autoFailFriendly: false,
			autoSaveFriendly: false,
			critOther: false,
			offHandWeapon: false,
			magicdam: false,
			magiceffect: false,
			noConcentrationCheck: false,
			toggleEffect: false,
			ignoreTotalCover: false,
			saveDamage: "default",
			bonusSaveDamage: "default",
			otherSaveDamage: "default",
			idr: false,
			idi: false,
			idv: false,
			ida: false,
			concentration: false,
			fulldam: false,
			halfdam: false,
			nodam: false,
			rollOther: false,
		},
	],
	"midi-qol": [
		{
			rollAttackPerTarget: "default",
			itemCondition: "",
			effectCondition: "",
			removeAttackDamageButtons: "default",
			reactionCondition: "",
			AoETargetType: "any",
			autoTarget: "default",
			otherCondition: "",
		},
	],
	"tidy5e-sheet": [
		{
			section: "",
			actionSection: "",
		},
	],
	"times-up": [{}, { isPassive: false }],
	dae: [
		{
			disableCondition: "",
			disableIncapacitated: false,
			dontApply: false,
			durationExpression: "",
			enableCondition: "",
			macroRepeat: "none",
			selfTarget: false,
			selfTargetAlways: false,
			showIcon: false,
			specialDuration: [],
			stackable: "noneName",
			activeEquipped: false,
			alwaysActive: false,
			transfer: false,
			macro: {},
		},
		{
			disableCondition: "",
			disableIncapacitated: false,
			dontApply: false,
			durationExpression: "",
			enableCondition: "",
			macroRepeat: "none",
			selfTarget: false,
			selfTargetAlways: false,
			showIcon: false,
			specialDuration: [],
			stackable: "none",
		},
		{ activeEquipped: false, alwaysActive: false },
		{ macro: {} },
	],
	core: [{}, { overlay: false }, { statusId: "" }, { overlay: false, statusId: "" }],
};

function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepEqual(a, b) {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((value, index) => deepEqual(value, b[index]));
	}
	if (isPlainObject(a) && isPlainObject(b)) {
		const aKeys = Object.keys(a);
		const bKeys = Object.keys(b);
		if (aKeys.length !== bKeys.length) return false;
		return aKeys.every((key) => deepEqual(a[key], b[key]));
	}
	return false;
}

function matchesDefaultVariant(value, variant) {
	if (!isPlainObject(value) || !isPlainObject(variant)) return false;
	for (const key of Object.keys(value)) {
		if (!Object.prototype.hasOwnProperty.call(variant, key)) return false;
		if (!deepEqual(value[key], variant[key])) return false;
	}
	return true;
}

function isDefaultFlagValue(value, variants = []) {
	if (!isPlainObject(value)) return false;
	return variants.some((variant) => matchesDefaultVariant(value, variant));
}

function removeDefaultModuleFlags(data) {
	if (!isPlainObject(data)) return;

	const maybeRemove = (container, key, defaults) => {
		if (!isPlainObject(container)) return;
		const current = container[key];
		if (!isPlainObject(current)) return;
		if (isDefaultFlagValue(current, defaults)) {
			delete container[key];
		}
	};

	// Flags container cleanup
	if (isPlainObject(data.flags)) {
		const activeAuras = data.flags.ActiveAuras;
		if (isPlainObject(activeAuras) && activeAuras.isAura === false) {
			delete data.flags.ActiveAuras;
		}

		for (const [moduleName, defaults] of Object.entries(DEFAULT_FLAG_CANDIDATES)) {
			maybeRemove(data.flags, moduleName, defaults);
		}
		if (Object.keys(data.flags).length === 0) {
			delete data.flags;
		}
	}

	// Direct module flag properties that aren't under flags
	for (const [moduleName, defaults] of Object.entries(DEFAULT_FLAG_CANDIDATES)) {
		maybeRemove(data, moduleName, defaults);
	}
}

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

function cleanPackEntry(data, { clearSourceId = true, ownership = 0 } = {}) {
	const preservedIdentifier = data?.system?.identifier ?? null;
	// Your existing top-level cleanup
	if (clearSourceId && data.flags?.core?.sourceId) delete data.flags.core.sourceId;
	if (data.ownership) data.ownership = { default: ownership };

	// Recursive deep cleaner for _stats and other keys
	function recursiveClean(obj) {
		if (!obj || typeof obj !== "object") return;

		// Delete these keys if present
		if ("_stats" in obj) delete obj._stats;
		if ("sort" in obj) delete obj.sort;
		if ("ownership" in obj) delete obj.ownership;

		// Recursively clean nested objects/arrays
		for (const key of Object.keys(obj)) {
			const val = obj[key];
			if (Array.isArray(val)) {
				val.forEach(recursiveClean);
			} else if (val && typeof val === "object") {
				recursiveClean(val);
			}
		}

		removeDefaultModuleFlags(obj);
	}
	recursiveClean(data);

	removeDefaultModuleFlags(data);

	if (data.system && preservedIdentifier !== null && preservedIdentifier !== undefined) {
		data.system.identifier = preservedIdentifier;
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
			cleanPackEntry(data);
			// Write back JSON with tab indentation and overwrite original
			await writeFile(src, JSON.stringify(data, null, "\t"), { mode: 0o664 });
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
		} catch {}

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
				if (entry._id in folders)
					filename = path.join(folders[entry._id].path, "_folder.json");
				else if (entry._id in containers)
					filename = path.join(containers[entry._id].path, "_container.json");
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

	// Exit early if there’s nothing to remove
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
