/**
 * Changes Foundry's armor types to that of Elkan 5e.
 */
export function armor() {
    const armor = game.settings.get("elkan5e", "armor");
    const dragon = game.settings.get("elkan5e", "draconic-toughness");
    console.log("Elkan 5e  |  Initializing Armor");

    if (!armor) {
        // Delete List
        ["ringmail", "studded"].forEach(id => delete CONFIG.DND5E.armorIds[id]);
        delete CONFIG.DND5E.shieldIds.shield;
    }

    // Add List
    Object.assign(CONFIG.DND5E.shieldIds, {
        large: "elkan5e.elkan5e-equipment.AENiTUeluTRiFzRz",
        small: "elkan5e.elkan5e-equipment.OE836KUoJiAsG0IA"
    });

    if (dragon) {
        CONFIG.DND5E.armorClasses.draconic.formula = "14 + @abilities.dex.mod";
    }
    /*
    Work in progress the goal is to make it so that con is used in replacement for dex
    
    CONFIG.DND5E.armorClasses.armorBarb = {
         label: "Armored Defence (Barbarian)",
         formula: "@attributes.ac.armor + @abilities.con.mod"
     };
     */
}