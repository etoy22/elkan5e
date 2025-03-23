/**
 * Changes Foundry's tools to fit that of Elkan 5e. This is the only 
 * one that we had to do a full replacement
 */
export function tools() {
    console.log("Elkan 5e  |  Initializing Tools");

    const TOOL_SETTING = game.settings.get("elkan5e", "tools");
    const TOOLS_TO_REMOVE = ["carpenter", "card", "cartographer", "chess", "cobbler", "dice", "glassblower", "potter", "weaver"];
    const TOOLS = {
        painter: { id: "Compendium.elkan5e.elkan5e-equipment.Item.qZe6ua1j3TtX3QGv" },
        sculpt: { ability: "dex", id: "Compendium.elkan5e.elkan5e-equipment.Item.6x1yyzDnWGRNRwJD" },
        alchemist: { id: "Compendium.elkan5e.elkan5e-equipment.Item.5TRgfcXqzHRvcYql" },
        brewer: { id: "Compendium.elkan5e.elkan5e-equipment.Item.sETCxXco4DFwc95F" },
        calligrapher: { id: "Compendium.elkan5e.elkan5e-equipment.Item.PSBsNmH0WWBmwTMY" },
        cook: { id: "Compendium.elkan5e.elkan5e-equipment.Item.oUY4OJSPtFBSuMJ5" },
        herb: { id: "Compendium.elkan5e.elkan5e-equipment.Item.LQiHNDl73EtsWxj1" },
        jeweler: { id: "Compendium.elkan5e.elkan5e-equipment.Item.0xX2toS9DTCJapez" },
        leatherworker: { id: "Compendium.elkan5e.elkan5e-equipment.Item.SMTANmxywrhJQVmr" },
        mason: { id: "Compendium.elkan5e.elkan5e-equipment.Item.daNXsoFk7oYAeDRt" },
        pois: { id: "Compendium.elkan5e.elkan5e-equipment.Item.PGHsgtscRcDrKt6j" },
        smith: { id: "Compendium.elkan5e.elkan5e-equipment.Item.aFpNp019JYV5bcgI" },
        tailor: { ability: "dex", id: "Compendium.elkan5e.elkan5e-equipment.Item.C3PHE8sJKlVZs9bH" },
        tinker: { id: "Compendium.elkan5e.elkan5e-equipment.Item.2Yeb51C04CmAhbsv" },
        woodcarver: { id: "Compendium.elkan5e.elkan5e-equipment.Item.FDsEsGSSPWhqwjlE" },
        disg: { id: "Compendium.elkan5e.elkan5e-equipment.Item.ArsBY1Z7YMKYCWp5" },
        navg: { id: "Compendium.elkan5e.elkan5e-equipment.Item.lExi8Y6jXHBv8vd2" },
        thief: { id: "Compendium.elkan5e.elkan5e-equipment.Item.LMnHshpVe3ciVIwF" },
        forg: { id: "Compendium.elkan5e.elkan5e-equipment.Item.dFa31G5pfZ3FGcjk" },
        game: { id: "Compendium.elkan5e.elkan5e-equipment.Item.xC669rfIiGBpAALC" },
    };

    // Adding Tool Types
    CONFIG.DND5E.toolTypes.craft = "Crafting Tools";
    CONFIG.DND5E.toolTypes.explore = "Exploration Tools";
    CONFIG.DND5E.toolProficiencies.craft = "Crafting Tools";
    CONFIG.DND5E.toolProficiencies.explore = "Exploration Tools";

    // Assign tools
    Object.entries(TOOLS).forEach(([key, value]) => {
        CONFIG.DND5E.tools[key] = value;
    });

    // Removing Tools
    if (!TOOL_SETTING) {
        console.log("Elkan 5e  |  Removing Tools");
        TOOLS_TO_REMOVE.forEach(tool => delete CONFIG.DND5E.tools[tool]);
        delete CONFIG.DND5E.toolTypes.game
        delete CONFIG.DND5E.toolProficiencies.game

    }
}