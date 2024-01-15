/**
 * Changes Foundry's armor tpypes to that of Elkan 5e.
 */
export function armor(){
    console.log("Elkan 5e  |  Initializing Armor")

    //Delete List
    delete CONFIG.DND5E.armorIds.ringmail
    delete CONFIG.DND5E.armorIds.studded
    delete CONFIG.DND5E.shieldIds.shield

    //Add List
    CONFIG.DND5E.shieldIds.large = "elkan5e.elkan5e-mundane-items.AENiTUeluTRiFzRz"
    CONFIG.DND5E.shieldIds.small = "elkan5e.elkan5e-mundane-items.OE836KUoJiAsG0IA"

    //Draconic Toughness New Formula
    CONFIG.DND5E.armorClasses.draconic.formula = "14 + @abilities.dex.mod"
    
    /*
    Work in progress the goal is to make it so that con is used in replacement for dex
    
    CONFIG.DND5E.armorClasses.armorBarb = {
         label: "Armored Defence (Barbarian)",
         formula: "@attributes.ac.armor + @abilities.con.mod"
     };
     */
}
