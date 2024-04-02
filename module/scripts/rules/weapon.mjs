/**
 * All the changes of Elkan 5e in Foundry.
 */
export function weapons(){
    console.log("Elkan 5e  |  Initializing Weapons")
    weaponTypes()
    weaponProperties()
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

    delete CONFIG.DND5E.weaponIds.flail
    delete CONFIG.DND5E.weaponIds.net
    delete CONFIG.DND5E.weaponIds.trident
    delete CONFIG.DND5E.weaponIds.warpick
}


/**
 * Adds the weapons reference
 */
export function weaponProperties(){
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