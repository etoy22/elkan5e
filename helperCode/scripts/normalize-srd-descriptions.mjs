import fs from "node:fs";
import path from "node:path";

const targetDir = path.join(process.cwd(), "packs/_source/elkan5e-magic-items/srd-items-not-finished-converting");
const entries = fs.readdirSync(targetDir, { withFileTypes: true });
let updatedCount = 0;

for (const entry of entries) {
	if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
	if (entry.name === "_folder.json") continue;
	const filePath = path.join(targetDir, entry.name);
	const raw = fs.readFileSync(filePath, "utf8");
	let data;
	try {
		data = JSON.parse(raw);
	} catch (error) {
		console.warn(`Skipping ${entry.name}: invalid JSON`);
		continue;
	}
	const original = data?.system?.description?.value;
	if (typeof original !== "string") continue;
	const normalized = normalizeDescription(original);
	if (normalized === original) continue;
	data.system.description.value = normalized;
	fs.writeFileSync(filePath, JSON.stringify(data, null, "\t") + "\n");
	updatedCount++;
}

console.log(`Normalized descriptions in ${updatedCount} files.`);

function normalizeDescription(html) {
	let result = html.replace(/<p><br\s*\/?><\/p>/gi, "");
	const sectionRegex = /<p><strong>([^<]+)<\/strong>(.*?)<\/p>\s*(<ul>[\s\S]*?<\/ul>)/gi;
	result = result.replace(sectionRegex, (_, section, tail, listHtml) => {
		const items = extractListItems(listHtml);
		const listText = items.length ? items.join(" ") : cleanInline(listHtml);
		if (!listText && !tail.trim()) return _;
		const normalizedTail = tail.replace(/\s+/g, " ").trim();
		const bodyParts = [];
		if (normalizedTail) bodyParts.push(normalizedTail);
		if (listText) bodyParts.push(listText);
		const body = bodyParts.join(" ");
		return `<p><strong>${section}</strong>${body ? ` ${body}` : ""}</p>`;
	});
	result = result.replace(/\s+<\/p>/g, "</p>");
	result = result.replace(/<p>\s+/g, "<p>");
	return result;
}

function extractListItems(listHtml) {
	const items = [];
	listHtml.replace(/<li>([\s\S]*?)<\/li>/gi, (_, itemHtml) => {
		const cleaned = cleanInline(itemHtml);
		if (cleaned) items.push(cleaned);
		return "";
	});
	return items;
}

function cleanInline(text) {
	return text
		.replace(/<\/?p>/gi, " ")
		.replace(/<\/?ul>/gi, " ")
		.replace(/<\/?li>/gi, " ")
		.replace(/&nbsp;/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}
