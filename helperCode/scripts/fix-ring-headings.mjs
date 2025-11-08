import fs from "node:fs";
import path from "node:path";

const ringDir = path.join(process.cwd(), "packs/_source/elkan5e-magic-items/srd-items-not-finished-converting");
const headingSet = new Set(["Buff", "Activation", "Action", "Bonus Action", "Reaction", "Attack"]);

const entries = fs.readdirSync(ringDir, { withFileTypes: true });
let updatedFiles = 0;

for (const entry of entries) {
	if (!entry.isFile() || !entry.name.startsWith("ring-") || !entry.name.endsWith(".json")) continue;
	const filePath = path.join(ringDir, entry.name);
	const raw = fs.readFileSync(filePath, "utf8");
	let data;
	try {
		data = JSON.parse(raw);
	} catch (error) {
		console.warn(`Skipping ${entry.name}: invalid JSON`);
		continue;
	}
	const original = data?.system?.description?.value;
	if (typeof original !== "string" || original.length === 0) continue;
	const fixed = splitHeadingParagraphs(original);
	if (fixed === original) continue;
	data.system.description.value = fixed;
	fs.writeFileSync(filePath, JSON.stringify(data, null, "\t") + "\n");
	updatedFiles++;
}

console.log(`Updated heading paragraphs in ${updatedFiles} ring descriptions.`);

function splitHeadingParagraphs(html) {
	return html.replace(/<p><strong>(.*?)<\/strong>([\s\S]*?)<\/p>/g, (match, headingRaw, bodyRaw) => {
		const heading = headingRaw.trim().replace(/\s+/g, " ");
		if (!headingSet.has(heading)) return match;
		const trimmed = bodyRaw.trim();
		if (!trimmed) return `<p><strong>${heading}</strong></p>`;
		const body = trimmed.replace(/^-+\s*/, "");
		return `<p><strong>${heading}</strong></p><p>${body}</p>`;
	});
}
