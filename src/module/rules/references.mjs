// Centralized DND5E reference assignments for Elkan 5e

export function setupCombatReferences() {
    const COMBAT_REFS = {
        initiative: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1Qw8n6k2v3r5t7yZ",
        action: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.2Wq9m7l3x5s8u0aB",
        bonus: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.3Er4t6y8u1i2o3pQ",
        reaction: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4Tg5h7j9k2l3z4xC"
    };
    Object.entries(COMBAT_REFS).forEach(([key, ref]) => {
        if (CONFIG.DND5E?.[key]) {
            CONFIG.DND5E[key].reference = ref;
        }
    });
}

export function setupDamageReferences() {
    const DAMAGE_REFS = {
        acid: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_ACID",
        bludgeoning: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_BLUDGEONING",
        cold: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_COLD",
        fire: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_FIRE",
        force: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_FORCE",
        lightning: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_LIGHTNING",
        necrotic: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_NECROTIC",
        piercing: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_PIERCING",
        poison: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_POISON",
        psychic: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_PSYCHIC",
        radiant: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_RADIANT",
        slashing: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_SLASHING",
        thunder: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.DAMAGE_THUNDER"
    };
    Object.entries(DAMAGE_REFS).forEach(([key, ref]) => {
        if (CONFIG.DND5E?.damageTypes?.[key]) {
            CONFIG.DND5E.damageTypes[key].reference = ref;
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
        if (CONFIG.DND5E?.[key]) {
            CONFIG.DND5E[key].reference = ref;
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
    Object.entries(CREATURE_TYPE_REFS).forEach(([key, ref]) => {
        if (CONFIG.DND5E?.creatureTypes?.[key]) {
            CONFIG.DND5E.creatureTypes[key].reference = ref;
        }
    });
}