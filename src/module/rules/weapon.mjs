/**
 * All the changes of Elkan 5e in Foundry.
 */
export function weapons(){
    console.log("Elkan 5e  |  Initializing Weapons")
    weaponTypes()
    weaponRules()
}


/**
 * Changes the weapon properties in Foundry to match Elkan 5e.
 */
export function weaponTypes(){
    //Adding new weapon Properties
    CONFIG.DND5E.itemProperties.coldIron = {
        label:"Cold Iron",
        isPhysical: "true"
    };

    CONFIG.DND5E.itemProperties.mou = {
        label:"Mounted"
    };
    CONFIG.DND5E.itemProperties.unw = {
        label:"Unwieldy"
    };

    
    CONFIG.DND5E.validProperties.weapon.add("coldIron")
    CONFIG.DND5E.validProperties.weapon.add("mou")
    CONFIG.DND5E.validProperties.weapon.add("unw")
    //Removing Weapon Property
    CONFIG.DND5E.validProperties.weapon.delete("spc")
    
	//Config Weapons
	CONFIG.DND5E.weaponIds.battleaxe = "Compendium.elkan5e.elkan5e-equipment.Item.gpZnusEdpaxAPesT"
    CONFIG.DND5E.weaponIds.blowgun = "Compendium.elkan5e.elkan5e-equipment.Item.1eqSvbUzm4rVN0BW"
    CONFIG.DND5E.weaponIds.club = "Compendium.elkan5e.elkan5e-equipment.Item.Xq5GOTmI51WGTB2i"
    CONFIG.DND5E.weaponIds.dagger = "Compendium.elkan5e.elkan5e-equipment.Item.Y6IT6GdS7C81Yz02"
    CONFIG.DND5E.weaponIds.dart = "Compendium.elkan5e.elkan5e-equipment.Item.NwVBTiWfOh1XmGIm"
    CONFIG.DND5E.weaponIds.glaive = "Compendium.elkan5e.elkan5e-equipment.Item.uZiGab66lUoqZyOI"
    CONFIG.DND5E.weaponIds.greataxe = "Compendium.elkan5e.elkan5e-equipment.Item.YVEcMNtAEQnGLv0S"
    CONFIG.DND5E.weaponIds.greatclub = "Compendium.elkan5e.elkan5e-equipment.Item.yWjRA9RARTDSbAfU"
    CONFIG.DND5E.weaponIds.greatsword = "Compendium.elkan5e.elkan5e-equipment.Item.vYEfz3IGHqR9krzS"
    CONFIG.DND5E.weaponIds.halberd = "Compendium.elkan5e.elkan5e-equipment.Item.Qbm3eVE1Xg8Aq30C"
    CONFIG.DND5E.weaponIds.handaxe = "Compendium.elkan5e.elkan5e-equipment.Item.rIzJTl2bsFVDNji3"
    CONFIG.DND5E.weaponIds.handcrossbow = "Compendium.elkan5e.elkan5e-equipment.Item.95GGJe2TrPOBeRIU"
    CONFIG.DND5E.weaponIds.heavycrossbow = "Compendium.elkan5e.elkan5e-equipment.Item.pW1brh2c1mr4LyCq"
    CONFIG.DND5E.weaponIds.javelin = "Compendium.elkan5e.elkan5e-equipment.Item.pM8eu7VlKCHmEi3N"
    CONFIG.DND5E.weaponIds.lance = "Compendium.elkan5e.elkan5e-equipment.Item.JKkdR63XyhzzgbsV"
    CONFIG.DND5E.weaponIds.lightcrossbow = "Compendium.elkan5e.elkan5e-equipment.Item.wPcrbw6GTNb9ZYvp"
    CONFIG.DND5E.weaponIds.lighthammer = "Compendium.elkan5e.elkan5e-equipment.Item.qqsRY0HoGdEJ6dZr"
    CONFIG.DND5E.weaponIds.longbow = "Compendium.elkan5e.elkan5e-equipment.Item.u9OIgbETWimkeEx5"
    CONFIG.DND5E.weaponIds.longsword = "Compendium.elkan5e.elkan5e-equipment.Item.ZOyejSDAVAH74Z4u"
    CONFIG.DND5E.weaponIds.mace = "Compendium.elkan5e.elkan5e-equipment.Item.ntmAbPMerRRj93Jy"
    CONFIG.DND5E.weaponIds.maul = "Compendium.elkan5e.elkan5e-equipment.Item.l8KBIR8hyBXP34g3"
    CONFIG.DND5E.weaponIds.morningstar = "Compendium.elkan5e.elkan5e-equipment.Item.YeHixhF01JFTKaNf"
    CONFIG.DND5E.weaponIds.pike = "Compendium.elkan5e.elkan5e-equipment.Item.AkHpqbiDKMPArfyR"
    CONFIG.DND5E.weaponIds.quarterstaff = "Compendium.elkan5e.elkan5e-equipment.Item.qpOD3sz47K9lnNgt"
    CONFIG.DND5E.weaponIds.rapier = "Compendium.elkan5e.elkan5e-equipment.Item.poEXwYP4n9HdRzwm"
	CONFIG.DND5E.weaponIds.scimitar = "Compendium.elkan5e.elkan5e-equipment.Item.NLDdf7iJt09G64Dg"
    CONFIG.DND5E.weaponIds.shortbow = "Compendium.elkan5e.elkan5e-equipment.Item.uHNpC0W5EdHCOnP6"
    CONFIG.DND5E.weaponIds.shortsword = "Compendium.elkan5e.elkan5e-equipment.Item.0hIX4VFLMTXWVYoW"
    CONFIG.DND5E.weaponIds.sickle = "Compendium.elkan5e.elkan5e-equipment.Item.STRitF2wexdf7eGM"
    CONFIG.DND5E.weaponIds.sling = "Compendium.elkan5e.elkan5e-equipment.Item.Ev7JyidZMB8BA9Cn"
    CONFIG.DND5E.weaponIds.spear = "Compendium.elkan5e.elkan5e-equipment.Item.l6tAULuFVbSNewP4"
    CONFIG.DND5E.weaponIds.unarmed = "Compendium.elkan5e.elkan5e-class-features.Item.pRDNsHpNLLk1Qq58"
    CONFIG.DND5E.weaponIds.warhammer = "Compendium.elkan5e.elkan5e-equipment.Item.3geQ0izotY1xNo8c"
    CONFIG.DND5E.weaponIds.whip = "Compendium.elkan5e.elkan5e-equipment.Item.GdgYGzD0cqVlYguz"

	const weapons = game.settings.get("elkan5e", "weapons");
    if (!weapons){
        delete CONFIG.DND5E.weaponIds.flail
        delete CONFIG.DND5E.weaponIds.net
        delete CONFIG.DND5E.weaponIds.trident
        delete CONFIG.DND5E.weaponIds.warpick
    }
}


/**
 * Adds the weapons reference
 */
export function weaponRules(){
    CONFIG.DND5E.rules.adamantine = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.cUHKJTc6BHyI1gfR"
    CONFIG.DND5E.rules.ammunition = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.5RUwcK38cpr1fZLe"
    CONFIG.DND5E.rules.coldw = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.ciqBm30ddE1BsPOg"
    CONFIG.DND5E.rules.finesse = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.QIw9oL7nHuy6A5e3"
    CONFIG.DND5E.rules.heavy = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.K644Km2l7enin6ou"
    CONFIG.DND5E.rules.lightw = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.AHUBfDV0TrMzcTUa"
    CONFIG.DND5E.rules.loading = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.VENz7U1ksd5WtYbK"
    CONFIG.DND5E.rules.magicw = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.ZqkxXr9joWmx5dEx"
    CONFIG.DND5E.rules.mounted = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.NF2lMEQyT4y6dxd0"
    CONFIG.DND5E.rules.reach = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.1xgI5cPXMX8TwBt5"
    CONFIG.DND5E.rules.thrown = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.cJzshBhfAwz9VYv0"
    CONFIG.DND5E.rules.handed = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.R5B5WfIsoxR4E1OZ"
    CONFIG.DND5E.rules.silver = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.3ZyL5VG1OqvBjajQ"
    CONFIG.DND5E.rules.unwieldy = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.sokjqCLGL8GY3O67"
    CONFIG.DND5E.rules.versatile = "Compendium.elkan5e.elkan5e-rules.JournalEntry.nfEDSQG0DMBs7eGp.JournalEntryPage.zrkm2gvW9a0IXpvW"
}