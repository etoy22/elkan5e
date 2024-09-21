/**
 * Changes Foundry's tools to fit that of Elkan 5e. This is the only 
 * one that we had to do a full replacement
 */
export function tools(){
    console.log("Elkan 5e  |  Initializing Tools")
    
    //Adding Tool Types
    // console.log("Elkan 5e  |  Adding Tool Types")
    CONFIG.DND5E.toolTypes.craft = "Crafting Tools"
    CONFIG.DND5E.toolTypes.explore = "Exploration Tools"
    CONFIG.DND5E.toolProficiencies.craft = "Crafting Tools"
    CONFIG.DND5E.toolProficiencies.explore = "Exploration Tools"
    
    //Artist's Tools
    console.log("Elkan 5e  |  Adding Artist's Tools")
    // CONFIG.DND5E.tools.painter.id =  "Compendium.elkan5e.elkan5e-mundane-items.Item.qZe6ua1j3TtX3QGv"
    // CONFIG.DND5E.tools.sculpt = {"ability": "dex", "id": "Compendium.elkan5e.elkan5e-mundane-items.Item.6x1yyzDnWGRNRwJD"}
    
    // //Crafting Supplies
    // console.log("Elkan 5e  |  Adding Crafting Supplies")
    // CONFIG.DND5E.tools.alchemist.id = "Compendium.elkan5e.elkan5e-mundane-items.5TRgfcXqzHRvcYql";
    // CONFIG.DND5E.tools.brewer.id = "Compendium.elkan5e.elkan5e-mundane-items.sETCxXco4DFwc95F";
    // CONFIG.DND5E.tools.calligrapher.id = "Compendium.elkan5e.elkan5e-mundane-items.PSBsNmH0WWBmwTMY";
    // CONFIG.DND5E.tools.cook.id = "Compendium.elkan5e.elkan5e-mundane-items.oUY4OJSPtFBSuMJ5";
    // CONFIG.DND5E.tools.herb.id = "Compendium.elkan5e.elkan5e-mundane-items.LQiHNDl73EtsWxj1";
    // CONFIG.DND5E.tools.jeweler.id = "Compendium.elkan5e.elkan5e-mundane-items.0xX2toS9DTCJapez";
    // CONFIG.DND5E.tools.leatherworker.id = "Compendium.elkan5e.elkan5e-mundane-items.SMTANmxywrhJQVmr";
    // CONFIG.DND5E.tools.mason.id = "Compendium.elkan5e.elkan5e-mundane-items.daNXsoFk7oYAeDRt";
    // CONFIG.DND5E.tools.pois.id = "Compendium.elkan5e.elkan5e-mundane-items.PGHsgtscRcDrKt6j";
    // CONFIG.DND5E.tools.smith.id = "Compendium.elkan5e.elkan5e-mundane-items.aFpNp019JYV5bcgI";
    // CONFIG.DND5E.tools.tailor = {"ability": "dex", "id": "Compendium.elkan5e.elkan5e-mundane-items.C3PHE8sJKlVZs9bH"}
    // CONFIG.DND5E.tools.tinker.id = "Compendium.elkan5e.elkan5e-mundane-items.2Yeb51C04CmAhbsv";
    // CONFIG.DND5E.tools.woodcarver.id = "Compendium.elkan5e.elkan5e-mundane-items.FDsEsGSSPWhqwjlE";
    
    // //Exploration Tools
    // console.log("Elkan 5e  |  Adding Exploration Tools")
    // CONFIG.DND5E.tools.disg.id = "Compendium.elkan5e.elkan5e-mundane-items.ArsBY1Z7YMKYCWp5";
    // CONFIG.DND5E.tools.navg.id = "Compendium.elkan5e.elkan5e-mundane-items.lExi8Y6jXHBv8vd2";
    // CONFIG.DND5E.tools.thief.id = "Compendium.elkan5e.elkan5e-mundane-items.LMnHshpVe3ciVIwF";
    
    // //Gaming Tools
    // console.log("Elkan 5e  |  Adding Gaming Tools")
    // CONFIG.DND5E.tools.card.id = "Compendium.elkan5e.elkan5e-mundane-items.SnmHCNVC2dgjQfKC";
    // CONFIG.DND5E.tools.chess.id = "Compendium.elkan5e.elkan5e-mundane-items.xC669rfIiGBpAALC";
    // CONFIG.DND5E.tools.dice.id = "Compendium.elkan5e.elkan5e-mundane-items.ZkZ9QPLdXvGleXxj";
    
    // //Other Tools
    // console.log("Elkan 5e  |  Adding Other Tools")
    // CONFIG.DND5E.tools.forg.id = "Compendium.elkan5e.elkan5e-mundane-items.dFa31G5pfZ3FGcjk";
    
    // //Removing Tools
    // if(!tools){
    //     console.log("Elkan 5e  |  Removing Tools")
    //     delete CONFIG.DND5E.tools.glassblower
    //     delete CONFIG.DND5E.tools.potter
    //     delete CONFIG.DND5E.tools.weaver
    //     delete CONFIG.DND5E.tools.carpenter
    //     delete CONFIG.DND5E.tools.cartographer
    //     delete CONFIG.DND5E.tools.cobbler
    // }
}