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
        CONFIG.DND5E.armorClasses.draconic.formula = "13 + @abilities.cha.mod";
    }

    // CONFIG.DND5E.armorClasses.unarmoredBarb.formula = `10 + @abilities.dex.mod + @abilities.con.mod`;

    // // New code to handle unarmoredBarb with light or medium armor
    // const armorType = actor.items.find(i => i.type === "armor")?.data?.armor?.type;
    // if (armorType === "light" || armorType === "medium") {
    //     CONFIG.DND5E.armorClasses.unarmoredBarb.formula = `@attributes.ac.value + @abilities.con.mod`;
    // }
}