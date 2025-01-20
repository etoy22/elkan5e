export function references() {
    try {
        skillsRef();
        combatRef();
        conditionsRef();
        damageRef();
        spellCasting();
        // TODO: Put it back in after merging with the main version
        // spellSchools();
    } catch (error) {
        console.error("Error initializing references:", error);
    }
}

export function skillsRef() {
    try {
        console.log("Elkan 5e  |  Initializing Skills References");

        const SKILLS = [
            { key: "acr", id: "nJvKshCeUsYho87K" },
            { key: "ani", id: "JR9h0nL97GegQ9Vz" },
            { key: "arc", id: "Cc49eyAgMrF1GIjH" },
            { key: "ath", id: "1lTpjCIaINKzvmKI" },
            { key: "dec", id: "UDcxonEumLH5vEQu" },
            { key: "his", id: "o9V0Z91HWH84JHda" },
            { key: "ins", id: "HAKuuUMWW3pRCMoL" },
            { key: "inv", id: "1VOLgBW7kkGwaPbH" },
            { key: "itm", id: "3WqeQryCXL1gtaEo" },
            { key: "med", id: "bEEOxmai3Q08nTfT" },
            { key: "nat", id: "0v0AbmZaL3N0zeO2" },
            { key: "per", id: "X3dKHNVduLjYxR1x" },
            { key: "prc", id: "pIFI2y2qLS9ovm0C" },
            { key: "prf", id: "9bVttJ5qNpwiOpzL" },
            { key: "rel", id: "KGv0Bkb9thO9K4xJ" },
            { key: "slt", id: "ynZa3sl1E681sRlP" },
            { key: "ste", id: "LnS51AK4Yi0P53QT" },
            { key: "sur", id: "6KIdxNMhOuvZUMxc" }
        ];

        SKILLS.forEach(({ key, id }) => {
            const reference = `Compendium.elkan5e.elkan5e-rules.JournalEntry.rv19GFzEa0nMTuAF.JournalEntryPage.${id}`;
            CONFIG.DND5E.skills[key].reference = reference;
            CONFIG.DND5E.enrichmentLookup.skills[key].reference = reference;
        });
    } catch (error) {
        console.error("Error initializing skills references:", error);
    }
}

export function combatRef() {
    try {
        console.log("Elkan 5e  |  Initializing Combat References");

        const COMBAT_REFS = {
            attack: "IauYsEM9MxyZCIdc",
            opportunityattacks: "5zEWVU1yw2Sv3hSI",
            dodge: "2Fxm6ATuDUyDIrt7",
            dash: "6UWCRY83phLnc7cF",
            disengage: "bYoY0gZQArDraXRs",
            help: "ZdoIWQgcoqcHlZSf",
            hide: "57VIppmrOewNVKF5",
            ready: "Uo0qriXzk4YInJrl",
            search: "bRo3ci56JJiuxYk8",
            surprise: "QOZeW0m8RCdVg6UE",
            unarmedstrike: "pRDNsHpNLLk1Qq58",
            twoweaponfighting: "XLZbNEhoayCw5bk8"
        };

        Object.entries(COMBAT_REFS).forEach(([key, id]) => {
            CONFIG.DND5E.rules[key] = `Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.${id}`;
        });
    } catch (error) {
        console.error("Error initializing combat references:", error);
    }
}

export function conditionsRef() {
    try {
        console.log("Elkan 5e  |  Initializing Condition References");

        const CONDITIONS = [
            { key: "blinded", id: "SXTqmewRrCwPS8yW" },
            { key: "charmed", id: "ieDILSkRbu9r8pmZ" },
            { key: "deafened", id: "AHgIwuNdpp0wKF2y" },
            { key: "frightened", id: "ruwpm6lorwoPJsmt" },
            { key: "grappled", id: "zaI1nuc41wANKoFX" },
            { key: "incapacitated", id: "PXI4uoXj7x6IsDXt" },
            { key: "invisible", id: "GfTD899cLRZxGG1H" },
            { key: "paralyzed", id: "w5RoCYZIujGYuiYt" },
            { key: "petrified", id: "n0BX8pLecgm7E3uH" },
            { key: "poisoned", id: "fzEf89TZ1WN90bFv" },
            { key: "prone", id: "y8L5Uq1jMVDsQjaS" },
            { key: "restrained", id: "DiWd3u4HCD7JEw8V" },
            { key: "stunned", id: "JV8kbMo0p5S1YXUR" },
            { key: "unconscious", id: "ZwhWWUPJvpFCz8sK" },
            { key: "exhaustion", id: "mPzXN6MW8L6ePFmq" }
        ];

        const COVER_REFS = {
            cover: "d2hBqe6EYHX2mxKD",
            halfcover: "1BmTbnT3xDPqv9dq",
            threequarterscover: "82ph4sMqvhxjLbiw",
            totalcover: "hY5s70xMeG5ISFUA"
        };

        CONDITIONS.forEach(({ key, id }) => {
            const reference = `Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.${id}`;
            CONFIG.DND5E.conditionTypes[key].reference = reference;
            CONFIG.statusEffects.find(effect => effect.id === key).reference = reference;
        });

        Object.entries(COVER_REFS).forEach(([key, id]) => {
            CONFIG.DND5E.rules[key] = `Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.${id}`;
        });

        // Concentration and surprise references
        CONFIG.DND5E.rules.concentrating = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv";
        CONFIG.DND5E.rules.surprise = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE";
    } catch (error) {
        console.error("Error initializing condition references:", error);
    }
}

export function damageRef() {
    try {
        console.log("Elkan 5e  |  Initializing New Damage References");

        const DAMAGE_TYPES = [
            { key: "acid", id: "VKYjrEO909FEbScG" },
            { key: "bludgeoning", id: "DLkhjyAJK6R1lPrA" },
            { key: "cold", id: "qnctn4Gcve0px0wU" },
            { key: "lightning", id: "inNJv5hIxFOb0atF" }, // Renamed to Electric
            { key: "fire", id: "8ZmYsUdejP3wal1K" },
            { key: "force", id: "hnbcchv13gA0ev8j" },
            { key: "necrotic", id: "3WAI4TbrSC8FS637" },
            { key: "piercing", id: "cEnkMbQascSe6lKU" },
            { key: "poison", id: "Mh0WKYgypPl7hKSo" },
            { key: "psychic", id: "DiUkrQVun34pAK4Z" },
            { key: "radiant", id: "1iv5sIBnKoFJrhMH" },
            { key: "slashing", id: "yxrHRnhVdSzKtzyZ" },
            { key: "thunder", id: "kPmCUWoSWv3lEW3t" } //Renamed to Sonic
        ];

        DAMAGE_TYPES.forEach(({ key, id }) => {
            CONFIG.DND5E.damageTypes[key].reference = `Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.${id}`;
        });
    } catch (error) {
        console.error("Error initializing damage references:", error);
    }
}

export function spellCasting() {
    try {
        console.log("Elkan 5e  |  Initializing Spell Casting References");

        const SPELL_REFS = {
            spellslots: "RAatADW6Izlm9yu6",
            spelllevel: "RAatADW6Izlm9yu6",
            cantrips: "UnQ8KUMYK3a6BWwu",
            upcasting: "wvECxDLurbCDec4h",
            castingatahigherlevel: "wvECxDLurbCDec4h",
            multiplespellsinaturn: "Rxjj26a4VyVnZYk9",
            duplicatemagicaleffects: "uWa3L8lGJKgICYHt",
            lineofsight: "5V7gVZ9fe5AWawwb",
            coverandwalls: "2QBRvP0XH1PBboSs",
            castinginarmor: "kwjLwbgZuqdcj17X",
            castingtime: "1H5OBLq2k7EmNowe",
            spelltargets: "HHfnotH75EXQ9zsP",
            spellrange: "rM1U1uAq2GD0ls8a",
            verbal: "wvyS2GRHioSYrMW0",
            spellduration: "KywepPZfytUpWKql",
            illusoryimages: "GtUH7c2Spk6XpU3B",
            knownspells: "qUZNQFDTomNDA9bv",
            preparedspells: "tvQAz6EC8cGVKRYi",
            abilityspells: "arD4KLvgCPbi1Pl7",
            focusspells: "R25K8TvAPK3c4ywr",
            spellscroll: "R25K8TvAPK3c4ywr",
            cursed: "Vpwu9GQC6HVNZFze"
        };

        const ITEM_PROPERTIES = {
            material: "gdVkgCiREuukVhLb",
            ritual: "CMI1OFzBkvjEmlj7",
            vocal: "wvyS2GRHioSYrMW0",
            somatic: "ooFAPmKTS7Cd6YXp"
        };

        Object.entries(SPELL_REFS).forEach(([key, id]) => {
            CONFIG.DND5E.rules[key] = `Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.${id}`;
        });

        Object.entries(ITEM_PROPERTIES).forEach(([key, id]) => {
            CONFIG.DND5E.itemProperties[key].reference = `Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.${id}`;
        });
        CONFIG.DND5E.itemProperties.concentration = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv";
    
    } catch (error) {
        console.error("Error initializing spell casting references:", error);
    }
}