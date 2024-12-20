/**
 * Changes Foundry's languages to fit that of Elkan 5e.
 */
export function language() {
    console.log("Elkan 5e  |  Initializing Languages");

    // Deleting Languages
    const languagesToDelete = ["giant", "gnomish", "orc", "druidic", "cant"];
    languagesToDelete.forEach(lang => delete CONFIG.DND5E.languages.standard.children[lang]);
    delete CONFIG.DND5E.languages.exotic;

    // Adding Languages
    CONFIG.DND5E.languages.standard.children.under = "Undercommon";

    CONFIG.DND5E.languages.rare = {
        label: "Rare Languages",
        children: {
            draconic: "Draconic",
            giant: "Giant",
            gnomish: "Gnomish",
            orc: "Orc",
            cant: "Thieves' Cant"
        }
    };

    CONFIG.DND5E.languages.magic = {
        label: "Magical Languages",
        children: {
            abyssal: "Abyssal",
            celestial: "Celestial",
            deep: "Deep Speech",
            druidic: "Druidic",
            infernal: "Infernal",
            primordial: {
                label: "Primordial",
                children: {
                    aquan: "Aquan",
                    auran: "Auran",
                    ignan: "Ignan",
                    terran: "Terran"
                }
            },
            sylvan: "Sylvan"
        }
    };

    CONFIG.DND5E.languages.other = {
        label: "Other Languages",
        children: {
            aarakocra: "Aarakocra",
            gith: "Gith",
            gnoll: "Gnoll"
        }
    };
}