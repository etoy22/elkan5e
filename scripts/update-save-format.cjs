const fs = require("fs");
const path = require("path");

const MAGIC_ROOT = path.resolve("packs/_source/elkan5e-magic-items");
const EQUIPMENT_ROOT = path.resolve("packs/_source/elkan5e-equipment");
const abilityMap = {
    strength: { abbr: "STR", proper: "Strength" },
    dexterity: { abbr: "DEX", proper: "Dexterity" },
    constitution: { abbr: "CON", proper: "Constitution" },
    intelligence: { abbr: "INT", proper: "Intelligence" },
    wisdom: { abbr: "WIS", proper: "Wisdom" },
    charisma: { abbr: "CHA", proper: "Charisma" }
};

const plainPattern = /DC\s+(\d+)\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/gi;
const macroToPlainPattern = /\[\[\/save\s+(STR|DEX|CON|INT|WIS|CHA)\s+(\d+)\]\]\{\s*DC\s+(\d+)\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw\s*\}+/gi;
const nestedMacroPattern = /\[\[\/save\s+(STR|DEX|CON|INT|WIS|CHA)\s+(\d+)\]\]\{\s*\[\[\/save\s+\1\s+\2\]\]{/gi;

function collapseNestedMacros(desc) {
    let prev;
    let current = desc;
    do {
        prev = current;
        current = current.replace(nestedMacroPattern, (_, abbr, dc) => `[[/save ${abbr} ${dc}]]{`);
    } while (current !== prev);
    return current;
}

function macrosToPlain(desc) {
    return collapseNestedMacros(desc).replace(macroToPlainPattern, (_, abbr, _outerDc, innerDc, ability) => `DC ${innerDc} ${ability} saving throw`);
}

function convertPlain(desc) {
    return desc.replace(plainPattern, (match, dc, ability, offset) => {
        const key = ability.toLowerCase();
        const info = abilityMap[key];
        if (!info) return match;
        const prefix = desc.slice(Math.max(0, offset - 10), offset);
        if (prefix.includes('[[/save')) return match;
        return `[[/save ${info.abbr} ${dc}]]{DC ${dc} ${info.proper} saving throw}`;
    });
}

function collectBaseDescriptions(root) {
    const map = new Map();
    const stack = [root];
    while (stack.length) {
        const current = stack.pop();
        let entries;
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch (error) {
            console.error(`Failed to read directory ${current}: ${error.message}`);
            continue;
        }
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }
            if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
            try {
                const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
                const baseItem = data?.system?.type?.baseItem;
                const desc = data?.system?.description?.value;
                const name = data?.name;
                if (typeof baseItem === "string" && typeof desc === "string" && typeof name === "string" && !map.has(baseItem)) {
                    map.set(baseItem, { desc, name });
                }
            } catch (error) {
                console.error(`Failed to parse equipment file ${fullPath}: ${error.message}`);
            }
        }
    }
    return map;
}

function htmlToText(html) {
    if (typeof html !== "string") return "";
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/&[a-z]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function appendHtml(existing, addition) {
    if (!existing) return addition;
    if (!addition) return existing;
    const trimmedExisting = existing.trim();
    const spacer = trimmedExisting.endsWith(">") ? "" : "\n";
    return `${trimmedExisting}${spacer}${addition.trim()}`;
}

function traverseMagicFiles(root, handler) {
    const stack = [root];
    while (stack.length) {
        const current = stack.pop();
        let entries;
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch (error) {
            console.error(`Failed to read directory ${current}: ${error.message}`);
            continue;
        }
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }
            if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
            handler(fullPath);
        }
    }
}

const baseDescriptions = collectBaseDescriptions(EQUIPMENT_ROOT);

traverseMagicFiles(MAGIC_ROOT, (filePath) => {
    let raw;
    try {
        raw = fs.readFileSync(filePath, "utf8");
    } catch (error) {
        console.error(`Failed to read ${filePath}: ${error.message}`);
        return;
    }

    let data;
    try {
        data = JSON.parse(raw);
    } catch (error) {
        console.error(`Failed to parse ${filePath}: ${error.message}`);
        return;
    }

    let changed = false;

    const desc = data?.system?.description?.value;
    if (typeof desc === "string") {
        const plainDesc = macrosToPlain(desc);
        const updatedDesc = convertPlain(plainDesc);
        if (updatedDesc !== desc) {
            data.system.description.value = updatedDesc;
            changed = true;
        }
    }

    const baseItemKey = data?.system?.type?.baseItem;
    const baseInfo = baseItemKey ? baseDescriptions.get(baseItemKey) : null;
    const baseDesc = baseInfo?.desc;
    if (baseDesc) {
        if (!data.system.unidentified) {
            data.system.unidentified = {};
        }
        const existingUnidentified = data.system.unidentified.description ?? "";
        const baseText = htmlToText(baseDesc);
        const unidentifiedText = htmlToText(existingUnidentified);
        if (baseText && !unidentifiedText.includes(baseText)) {
            data.system.unidentified.description = appendHtml(existingUnidentified, baseDesc);
            changed = true;
        }
        if (baseItemKey === "leather" && baseInfo?.name) {
            const targetName = `Unidentified ${baseInfo.name}`;
            if (data.system.unidentified.name !== targetName) {
                data.system.unidentified.name = targetName;
                changed = true;
            }
        }
    }

    if (!changed) return;

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, "\t") + "\n", "utf8");
        console.log(`Updated ${path.relative(MAGIC_ROOT, filePath)}`);
    } catch (error) {
        console.error(`Failed to write ${filePath}: ${error.message}`);
    }
});
