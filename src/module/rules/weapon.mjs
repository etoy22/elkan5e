/**
 * All the changes of Elkan 5e in Foundry.
 */
export function weapons() {
    console.log("Elkan 5e  |  Initializing Weapons");
    weaponTypes();
    weaponRules();
}

/**
 * Changes the weapon properties in Foundry to match Elkan 5e.
 */
export function weaponTypes() {
    // Adding new weapon Properties
    const NEW_PROPERTIES = {
        coldIron: { label: "Cold Iron", isPhysical: "true" },
        conc : { label: "Concussive" },
        mou: { label: "Mounted" },
        unw: { label: "Unwieldy" }
    };
    
    const WEAPON_IDS = {
        battleaxe: "gpZnusEdpaxAPesT",
        blowgun: "1eqSvbUzm4rVN0BW",
        club: "Xq5GOTmI51WGTB2i",
        dagger: "Y6IT6GdS7C81Yz02",
        dart: "NwVBTiWfOh1XmGIm",
        glaive: "uZiGab66lUoqZyOI",
        greataxe: "YVEcMNtAEQnGLv0S",
        greatclub: "yWjRA9RARTDSbAfU",
        greatsword: "vYEfz3IGHqR9krzS",
        halberd: "Qbm3eVE1Xg8Aq30C",
        handaxe: "rIzJTl2bsFVDNji3",
        handcrossbow: "95GGJe2TrPOBeRIU",
        heavycrossbow: "pW1brh2c1mr4LyCq",
        javelin: "pM8eu7VlKCHmEi3N",
        lance: "JKkdR63XyhzzgbsV",
        lightcrossbow: "wPcrbw6GTNb9ZYvp",
        lighthammer: "qqsRY0HoGdEJ6dZr",
        longbow: "u9OIgbETWimkeEx5",
        longsword: "ZOyejSDAVAH74Z4u",
        mace: "ntmAbPMerRRj93Jy",
        maul: "l8KBIR8hyBXP34g3",
        morningstar: "YeHixhF01JFTKaNf",
        pike: "AkHpqbiDKMPArfyR",
        quarterstaff: "qpOD3sz47K9lnNgt",
        rapier: "poEXwYP4n9HdRzwm",
        scimitar: "NLDdf7iJt09G64Dg",
        shortbow: "uHNpC0W5EdHCOnP6",
        shortsword: "0hIX4VFLMTXWVYoW",
        sickle: "STRitF2wexdf7eGM",
        sling: "Ev7JyidZMB8BA9Cn",
        spear: "l6tAULuFVbSNewP4",
        unarmed: "pRDNsHpNLLk1Qq58",
        warhammer: "3geQ0izotY1xNo8c",
        whip: "GdgYGzD0cqVlYguz",
        pistol: "O7abmlrF4raTjnkr",
        musket: "IUIwCZtPbwMwB0b1"
    };

    Object.assign(CONFIG.DND5E.itemProperties, NEW_PROPERTIES);
    Object.keys(NEW_PROPERTIES).forEach(prop => CONFIG.DND5E.validProperties.weapon.add(prop));

    // Removing Weapon Property
    CONFIG.DND5E.validProperties.weapon.delete("spc");

    // Config Weapons
    Object.entries(WEAPON_IDS).forEach(([key, id]) => {
        CONFIG.DND5E.weaponIds[key] = `Compendium.elkan5e.elkan5e-equipment.Item.${id}`;
    });

    const WEAPONS = game.settings.get("elkan5e", "weapons");
    if (!WEAPONS) {
        ["flail", "net", "trident", "warpick"].forEach(weapon => delete CONFIG.DND5E.weaponIds[weapon]);
    }
}

/**
 * Adds the weapons reference
 */
export function weaponRules() {
    const WEAPON_REFS = {
        adamantine: "cUHKJTc6BHyI1gfR",
        ammunition: "5RUwcK38cpr1fZLe",
        coldiron: "ciqBm30ddE1BsPOg",
        finesse: "QIw9oL7nHuy6A5e3",
        heavy: "K644Km2l7enin6ou",
        lightweapon: "AHUBfDV0TrMzcTUa",
        loading: "VENz7U1ksd5WtYbK",
        magicweapon: "ZqkxXr9joWmx5dEx",
        mounted: "NF2lMEQyT4y6dxd0",
        reach: "1xgI5cPXMX8TwBt5",
        thrown: "cJzshBhfAwz9VYv0",
        handed: "R5B5WfIsoxR4E1OZ",
        silver: "3ZyL5VG1OqvBjajQ",
        unwieldy: "sokjqCLGL8GY3O67",
        versatile: "zrkm2gvW9a0IXpvW"
    };

    Object.entries(WEAPON_REFS).forEach(([key, id]) => {
        CONFIG.DND5E.rules[key] = `Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.${id}`;
    });
}