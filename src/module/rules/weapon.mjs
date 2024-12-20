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
    const newProperties = {
        coldIron: { label: "Cold Iron", isPhysical: "true" },
        mou: { label: "Mounted" },
        unw: { label: "Unwieldy" }
    };

    Object.assign(CONFIG.DND5E.itemProperties, newProperties);
    Object.keys(newProperties).forEach(prop => CONFIG.DND5E.validProperties.weapon.add(prop));

    // Removing Weapon Property
    CONFIG.DND5E.validProperties.weapon.delete("spc");

    // Config Weapons
    const weaponIds = {
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
        whip: "GdgYGzD0cqVlYguz"
    };

    Object.entries(weaponIds).forEach(([key, id]) => {
        CONFIG.DND5E.weaponIds[key] = `Compendium.elkan5e.elkan5e-equipment.Item.${id}`;
    });

    const weapons = game.settings.get("elkan5e", "weapons");
    if (!weapons) {
        ["flail", "net", "trident", "warpick"].forEach(weapon => delete CONFIG.DND5E.weaponIds[weapon]);
    }
}

/**
 * Adds the weapons reference
 */
export function weaponRules() {
    const weaponRefs = {
        adamantine: "cUHKJTc6BHyI1gfR",
        ammunition: "5RUwcK38cpr1fZLe",
        coldw: "ciqBm30ddE1BsPOg",
        finesse: "QIw9oL7nHuy6A5e3",
        heavy: "K644Km2l7enin6ou",
        lightw: "AHUBfDV0TrMzcTUa",
        loading: "VENz7U1ksd5WtYbK",
        magicw: "ZqkxXr9joWmx5dEx",
        mounted: "NF2lMEQyT4y6dxd0",
        reach: "1xgI5cPXMX8TwBt5",
        thrown: "cJzshBhfAwz9VYv0",
        handed: "R5B5WfIsoxR4E1OZ",
        silver: "3ZyL5VG1OqvBjajQ",
        unwieldy: "sokjqCLGL8GY3O67",
        versatile: "zrkm2gvW9a0IXpvW"
    };

    Object.entries(weaponRefs).forEach(([key, id]) => {
        CONFIG.DND5E.rules[key] = `Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.${id}`;
    });
}