import fs from "node:fs";
import path from "node:path";

const base = path.join(process.cwd(), "packs/_source/elkan5e-magic-items/srd-items-not-finished-converting/rings");
const configs = {
    "ring-of-acid-resistance.json": { damage: "Acid" },
    "ring-of-cold-resistance.json": { damage: "Cold" },
    "ring-of-electric-resistance.json": { damage: "Lightning" },
    "ring-of-fire-resistance.json": { damage: "Fire" },
    "ring-of-force-resistance.json": { damage: "Force" },
    "ring-of-necrotic-resistance.json": { damage: "Necrotic" },
    "ring-of-poison-resistance.json": { damage: "Poison" },
    "ring-of-psychic-resistance.json": { damage: "Psychic" },
    "ring-of-radiant-resistance.json": { damage: "Radiant" },
    "ring-of-sonic-resistance.json": { damage: "Thunder" }
};

const tableLine = "<p>For other rings of resistance, roll on the @UUID[Compendium.dnd5e.tables.RollTable.MdTxWyYVhTIgtNcG]{Ring of Resistance} table.</p>";
const header = "<p><em>Ring - Rare (Requires Attunement)</em></p>";
let updated = 0;

for (const [file, { damage }] of Object.entries(configs)) {
    const filePath = path.join(base, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    const original = data?.system?.description?.value ?? "";
    const loreMatch = original.match(/<p><em>(?!\(Requires attunement\))(.*?)<\/em><\/p>/i);
    const lore = loreMatch ? `<p><em>${loreMatch[1]}</em></p>` : "";
    const buff = `<p><strong>Buff</strong></p><ul><li><p>You have &Reference[Resistance] to &Reference[${damage}] damage while wearing this ring.</p></li></ul>`;
    const nextValue = `${header}${lore}${buff}${tableLine}`;
    if (nextValue === original) continue;
    data.system.description.value = nextValue;
    fs.writeFileSync(filePath, JSON.stringify(data, null, "\t") + "\n");
    updated++;
}

console.log(`Formatted ${updated} ring descriptions.`);
