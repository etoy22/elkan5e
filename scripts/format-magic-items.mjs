import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve("packs/_source/elkan5e-magic-items/srd-items-not-finished-converting");

function buildHeader(raw) {
	let cleaned = raw
		.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, "$1")
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();
	if (!cleaned) return "";
	const parts = cleaned.split(/,\s*/);
	if (parts.length > 1) {
		const first = parts.shift();
		cleaned = `${first} - ${parts.join(", ")}`;
	}
	return `<p><em>${cleaned}</em></p>`;
}

function parseParagraphs(html) {
	const sanitized = html.replace(/<\/?.*?section>/gi, "");
	const regex = /<p>(.*?)<\/p>/gis;
	const flavors = [];
	const mechanics = [];
	const embeds = [];
	let match;
	while ((match = regex.exec(sanitized)) !== null) {
		const content = match[1].trim();
		if (!content) continue;
		if (/^<br\s*\/?\s*>$/i.test(content)) continue;
		if (content.startsWith("@Embed[")) {
			embeds.push(`<p>${content}</p>`);
			continue;
		}
		const lower = content.toLowerCase();
		if (lower.startsWith("<em>") && lower.endsWith("</em>")) {
			flavors.push(`<p>${content}</p>`);
			continue;
		}
		mechanics.push(content);
	}
	return { flavors, mechanics, embeds };
}

function detectLabel(text, system) {
	const lower = text.toLowerCase();
	if (lower.includes("bonus action")) return "Bonus Action";
	if (lower.includes("reaction")) return "Reaction";
	if (lower.includes("once per turn") || lower.includes("per turn")) return "Once Per Turn";
	if (lower.includes("legendary action")) return "Legendary Action";
	if (lower.includes("lair action")) return "Lair Action";
	if (lower.includes("as an action") || lower.includes("use your action") || lower.includes("use an action") || lower.includes("takes an action") || lower.includes("spend your action")) return "Action";
	if (lower.includes("command word") || lower.includes("activate") || lower.includes("expends") || lower.includes("expend")) {
		if (lower.includes("charge")) return "Action";
	}
	if (lower.includes("drink") || lower.includes("drinking") || lower.includes("apply the oil")) return "Action";
	if (system?.type?.value === "consumable") return "Action";
	if (lower.includes("attack")) return "Attack";
	return "Buff";
}

function unwrapListMarkup(text) {
	const trimmed = text.trim();
	if (/^<ul[\s>]/i.test(trimmed)) {
		return trimmed
			.replace(/^<ul[^>]*>/i, "")
			.replace(/<\/ul>$/i, "");
	}
	if (/^<ol[\s>]/i.test(trimmed)) {
		return trimmed
			.replace(/^<ol[^>]*>/i, "")
			.replace(/<\/ol>$/i, "");
	}
	if (/^<li[\s>]/i.test(trimmed)) {
		return trimmed;
	}
	return `<li><p>${trimmed}</p></li>`;
}

function buildSections(paragraphs, system) {
	if (!paragraphs.length) return [];
	const groups = [];
	for (const para of paragraphs) {
		const trimmedPara = para.trim();
		if (!trimmedPara) continue;
		if (/^<strong>[^<]+<\/strong>$/i.test(trimmedPara)) continue;
		const label = detectLabel(para, system);
		const previous = groups[groups.length - 1];
		if (previous && previous.label === label) {
			previous.items.push(para);
		} else {
			groups.push({ label, items: [para] });
		}
	}
	return groups
		.filter((group) => group.items.length)
		.map((group, index) => {
			const items = group.items.map(unwrapListMarkup).join("");
			const spacer = index > 0 ? "<p><br /></p>" : "";
			return `${spacer}<p><strong>${group.label}</strong></p><ul>${items}</ul>`;
		});
}

function buildDescription(desc, system) {
	const sanitizedDesc = desc.replace(/<\/?.*?section>/gi, "");
	const headerMatch = sanitizedDesc.match(/^<p>(?:<em>)?(.*?)(?:<\/em>)?<\/p>/is);
	if (!headerMatch) return null;
	const header = buildHeader(headerMatch[1]);
	const tail = sanitizedDesc.slice(headerMatch[0].length);
	const { flavors, mechanics, embeds } = parseParagraphs(tail);
	const sections = buildSections(mechanics, system);
	const parts = [header, ...flavors, ...sections, ...embeds];
	return parts.join("");
}

async function processFile(filePath) {
	let raw;
	try {
		raw = await fs.readFile(filePath, "utf8");
	} catch (error) {
		console.error(`Failed to read ${filePath}: ${error.message}`);
		return false;
	}
	let data;
	try {
		data = JSON.parse(raw);
	} catch (error) {
		console.error(`Failed to parse ${filePath}: ${error.message}`);
		return false;
	}
	const desc = data?.system?.description?.value;
	if (typeof desc !== "string" || !desc.includes("<em>")) return false;
	const built = buildDescription(desc, data.system);
	if (!built || built === desc) return false;
	data.system.description.value = built;
	const serialized = JSON.stringify(data, null, "\t") + "\n";
	await fs.writeFile(filePath, serialized, "utf8");
	return true;
}

async function main() {
	const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
	let updated = 0;
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
		const filePath = path.join(ROOT_DIR, entry.name);
		const changed = await processFile(filePath);
		if (changed) {
			updated += 1;
			console.log(`Formatted ${entry.name}`);
		}
	}
	console.log(`Formatting complete. Updated ${updated} files.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
