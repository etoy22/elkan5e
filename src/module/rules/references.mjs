// Centralized DND5E reference assignments for Elkan 5e

export function setupCombatReferences() {
    const COMBAT_REFS = {
        initiative: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1Qw8n6k2v3r5t7yZ",
        action: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.2Wq9m7l3x5s8u0aB",
        bonus: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.3Er4t6y8u1i2o3pQ",
        reaction: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4Tg5h7j9k2l3z4xC"
    };
    if (!CONFIG.DND5E.rules) CONFIG.DND5E.rules = {};
    Object.entries(COMBAT_REFS).forEach(([key, ref]) => {
        try {
            CONFIG.DND5E.rules[key] = { reference: ref };
        } catch (e) {
            console.warn(`Elkan 5e | Failed to assign combat reference for key '${key}':`, e);
        }
    });
}

export function setupDamageReferences() {
    const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.";
    const DAMAGE_REFS = {
        acid: base + "VKYjrEO909FEbScG",
        bludgeoning: base + "DLkhjyAJK6R1lPrA",
        cold: base + "qnctn4Gcve0px0wU",
        lightning: base + "inNJv5hIxFOb0atF",
        fire: base + "8ZmYsUdejP3wal1K",
        force: base + "hnbcchv13gA0ev8j",
        necrotic: base + "3WAI4TbrSC8FS637",
        piercing: base + "cEnkMbQascSe6lKU",
        poison: base + "Mh0WKYgypPl7hKSo",
        psychic: base + "DiUkrQVun34pAK4Z",
        radiant: base + "1iv5sIBnKoFJrhMH",
        slashing: base + "yxrHRnhVdSzKtzyZ",
        thunder: base + "kPmCUWoSWv3lEW3t",
    };
    if (!CONFIG.DND5E.damageTypes) CONFIG.DND5E.damageTypes = {};
    Object.entries(DAMAGE_REFS).forEach(([key, ref]) => {
        try {
            if (!CONFIG.DND5E.damageTypes[key]) CONFIG.DND5E.damageTypes[key] = {};
            CONFIG.DND5E.damageTypes[key].reference = ref;
        } catch (e) {
            console.warn(`Elkan 5e | Failed to assign damage reference for key '${key}':`, e);
        }
    });
}

export function setupSpellcastingReferences() {
    const SPELLCASTING_REFS = {
        spellcasting: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SPELLCASTING",
        spellAttack: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SPELL_ATTACK",
        spellSave: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SPELL_SAVE"
    };
    Object.entries(SPELLCASTING_REFS).forEach(([key, ref]) => {
        try {
            if (!CONFIG.DND5E.rules[key]) CONFIG.DND5E.rules[key] = {};
            CONFIG.DND5E.rules[key].reference = ref;
        } catch (e) {
            console.warn(`Elkan 5e | Failed to assign spellcasting reference for key '${key}':`, e);
        }
    });
}

export function setupCreatureTypeReferences() {
    const CREATURE_TYPE_REFS = {
        aberration: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_ABERRATION",
        beast: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_BEAST",
        celestial: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_CELESTIAL",
        construct: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_CONSTRUCT",
        dragon: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_DRAGON",
        elemental: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_ELEMENTAL",
        fey: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_FEY",
        fiend: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_FIEND",
        giant: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_GIANT",
        humanoid: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_HUMANOID",
        monstrosity: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_MONSTROSITY",
        ooze: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_OOZE",
        plant: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_PLANT",
        undead: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.CREATURE_UNDEAD"
    };
    if (!CONFIG.DND5E.creatureTypes) CONFIG.DND5E.creatureTypes = {};
    Object.entries(CREATURE_TYPE_REFS).forEach(([key, ref]) => {
        try {
            if (!CONFIG.DND5E.creatureTypes[key]) CONFIG.DND5E.creatureTypes[key] = {};
            CONFIG.DND5E.creatureTypes[key].reference = ref;
        } catch (e) {
            console.warn(`Elkan 5e | Failed to assign creature type reference for key '${key}':`, e);
        }
    });
}