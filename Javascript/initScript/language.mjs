

export function language(){
    console.log("Elkan 5e  |  Initializing Languages")
    CONFIG.DND5E.languages.standard.label = "Trade Language"
    delete CONFIG.DND5E.languages.standard.children.giant
    delete CONFIG.DND5E.languages.standard.children.gnomish 
    delete CONFIG.DND5E.languages.standard.children.orc
    CONFIG.DND5E.languages.standard.children.under = "Undercommon"
    delete CONFIG.DND5E.languages.exotic
    delete CONFIG.DND5E.languages.druidic;
    delete CONFIG.DND5E.languages.cant;
    CONFIG.DND5E.languages.rare = {
        label: "Rare Languages",
        children: {
            draconic:"Draconic",
            giant:"Giant",
            gnomish:"Gnomish",
            orc:"Orc",
            cant:"Thieves' Cant"
        }
    };
    CONFIG.DND5E.languages.magic = {
        label: "Magical Languages",
        children: {
            abyssal:"Abyssal",
            celestial:"Celestial",
            deep:"Deep Speech",
            druidic:"Druidic",
            infernal:"Infernal",
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
    }
    CONFIG.DND5E.languages.other = {
        label: "Other Languages",
        children: {
            aarakocra:"Aarakocra",
            gith:"Gith",
            gnoll:"Gnoll"
        }
    }

}