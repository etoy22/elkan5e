import fs from "fs";
import path from "path";
import crypto from "node:crypto";

const CREATURES_ROOT = "packs/_source/elkan5e-creatures";
const SUMMONED_ROOT = "packs/_source/elkan5e-summoned-creatures";

function randomId() {
	return crypto.randomBytes(9).toString("base64url").slice(0, 16);
}

function loadJson(file) {
	const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
	return JSON.parse(text);
}

function saveJson(file, data) {
	fs.writeFileSync(file, JSON.stringify(data, null, "\t"));
}

function walkJsonFiles(dir, list = []) {
	return fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walkJsonFiles(full, acc);
		if (entry.isFile() && entry.name.endsWith(".json")) acc.push(full);
		return acc;
	}, list);
}

function syncSummonedCreatures() {
	const baseFiles = walkJsonFiles(CREATURES_ROOT);
	const summonedFiles = walkJsonFiles(SUMMONED_ROOT);

	// Map base creature by filename (case-insensitive)
	const baseByName = new Map(
		baseFiles.map((file) => [path.basename(file, ".json").toLowerCase(), file]),
	);

	let synced = 0;
	for (const file of summonedFiles) {
		const name = path.basename(file, ".json").toLowerCase();
		const basePath = baseByName.get(name);
		if (!basePath || name === "_folder") continue;

		const base = loadJson(basePath);
		const summoned = loadJson(file);

		// Actor identity: keep summoned ID/key if present, otherwise generate short Foundry-safe values.
		const actorId = summoned._id || randomId();
		const actorKey = summoned._key || `!actors!${actorId}`;
		const folder = summoned.folder ?? base.folder ?? null;

		const merged = JSON.parse(JSON.stringify(base));
		merged._id = actorId;
		merged._key = actorKey;
		merged.folder = folder;

		// Preserve summoned item identities (match by identifier or name), but keep base item data.
		const summonedItems = summoned.items || [];
		const itemsByIdent = new Map();
		for (const it of summonedItems) {
			const ident = (it?.system?.identifier || it?.name || "").toLowerCase();
			if (ident) itemsByIdent.set(ident, it);
		}
		if (Array.isArray(base.items)) {
			merged.items = base.items.map((baseItem) => {
				const ident = (baseItem?.system?.identifier || baseItem?.name || "").toLowerCase();
				const match = ident ? itemsByIdent.get(ident) : null;
				const itemId = match?._id || randomId();
				const clone = JSON.parse(JSON.stringify(baseItem));
				clone._id = itemId;
				clone._key = `!actors.items!${actorId}.${itemId}`;
				clone.folder = match?.folder ?? clone.folder ?? null;
				// Normalize embedded effects on the item
				if (Array.isArray(clone.effects)) {
					clone.effects = clone.effects.map((ef) => {
						const effectId = ef?._id || randomId();
						const eff = JSON.parse(JSON.stringify(ef));
						eff._id = effectId;
						eff._key = `!actors.items.effects!${actorId}.${itemId}.${effectId}`;
						return eff;
					});
				}
				return clone;
			});
		}

		// Preserve summoned effect identities (match by label), keep base effect data.
		const summonedEffects = summoned.effects || [];
		const effectsByLabel = new Map();
		for (const ef of summonedEffects) {
			const label = (ef?.label || "").toLowerCase();
			if (label) effectsByLabel.set(label, ef);
		}
		if (Array.isArray(base.effects)) {
			merged.effects = base.effects.map((baseEffect) => {
				const label = (baseEffect?.label || "").toLowerCase();
				const match = label ? effectsByLabel.get(label) : null;
				const effectId = match?._id || randomId();
				const clone = JSON.parse(JSON.stringify(baseEffect));
				clone._id = effectId;
				clone._key = `!actors.effects!${actorId}.${effectId}`;
				return clone;
			});
		}

		saveJson(file, merged);
		synced++;
	}

	console.log(`Summoned creatures synced: ${synced}`);
}

syncSummonedCreatures();
