import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACK_SOURCE_ROOT = path.resolve(__dirname, "..", "..", "packs", "_source");

function walk(dir) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(entryPath));
		else if (path.extname(entry.name) === ".json") out.push(entryPath);
	}
	return out;
}

function logParseError(filePath, err, consoleImpl) {
	consoleImpl.error("PARSE ERROR:", filePath);
	consoleImpl.error(err?.message ?? String(err));
	try {
		const content = fs.readFileSync(filePath, "utf8");
		const posMatch = /position (\d+)|line (\d+) column (\d+)/i.exec(err?.message ?? "");
		if (posMatch?.[1]) {
			const pos = Number(posMatch[1]);
			const start = Math.max(0, pos - 80);
			const end = Math.min(content.length, pos + 80);
			consoleImpl.error(`\n--- context ---\n${content.slice(start, end)}\n--- end ---\n`);
		} else {
			consoleImpl.error(`\n--- file start ---\n${content.slice(0, 400)}\n--- end ---\n`);
		}

		consoleImpl.error("\n--- file with line numbers ---");
		content.split(/\r?\n/).forEach((line, idx) => {
			const n = String(idx + 1).padStart(4, " ");
			consoleImpl.error(`${n}: ${line}`);
		});
		consoleImpl.error("--- end file ---\n");
	} catch (e) {
		consoleImpl.error("Failed to read file for context:", e?.message ?? String(e));
	}
}

export function validatePacksJson({ root = PACK_SOURCE_ROOT, consoleImpl = console } = {}) {
	const files = walk(root);
	let errorCount = 0;

	for (const filePath of files) {
		try {
			const content = fs.readFileSync(filePath, "utf8");
			JSON.parse(content);
		} catch (err) {
			logParseError(filePath, err, consoleImpl);
			errorCount++;
		}
	}

	if (errorCount === 0) consoleImpl.log("All pack JSON files parsed OK");
	else consoleImpl.error(`${errorCount} file(s) failed to parse`);

	return { filesChecked: files.length, errorCount };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (invokedDirectly) {
	const { errorCount } = validatePacksJson();
	process.exit(errorCount === 0 ? 0 : 1);
}
