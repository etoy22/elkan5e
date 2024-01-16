/**
 * Changes Foundry's tools to fit that of Elkan 5e.
 */
export function tools(){
    console.log("Elkan 5e  |  Initializing Tools")

    //Adding Tool Types
    CONFIG.DND5E.toolTypes.craft = "Crafting Tools"
    CONFIG.DND5E.toolTypes.explore = "Exploration Tools"
    CONFIG.DND5E.toolProficiencies.craft = "Crafting Tools"
    CONFIG.DND5E.toolProficiencies.explore = "Exploration Tools"
    
    //Other Artiist's Tools 
    CONFIG.DND5E.toolIds.painter = "elkan5e.elkan5e-mundane-items.qZe6ua1j3TtX3QGv";
    CONFIG.DND5E.toolIds.sculpt = "elkan5e.elkan5e-mundane-items.6x1yyzDnWGRNRwJD";
    
    //Crafting Supplies
    CONFIG.DND5E.toolIds.alchemist = "elkan5e.elkan5e-mundane-items.5TRgfcXqzHRvcYql";
    CONFIG.DND5E.toolIds.brewer = "elkan5e.elkan5e-mundane-items.sETCxXco4DFwc95F";
    CONFIG.DND5E.toolIds.calligrapher = "elkan5e.elkan5e-mundane-items.PSBsNmH0WWBmwTMY";
    CONFIG.DND5E.toolIds.cook = "elkan5e.elkan5e-mundane-items.oUY4OJSPtFBSuMJ5";
    CONFIG.DND5E.toolIds.herb = "elkan5e.elkan5e-mundane-items.LQiHNDl73EtsWxj1";
    CONFIG.DND5E.toolIds.jeweler = "elkan5e.elkan5e-mundane-items.0xX2toS9DTCJapez";
    CONFIG.DND5E.toolIds.leatherworker = "elkan5e.elkan5e-mundane-items.SMTANmxywrhJQVmr";
    CONFIG.DND5E.toolIds.mason = "elkan5e.elkan5e-mundane-items.daNXsoFk7oYAeDRt";
    CONFIG.DND5E.toolIds.pois = "elkan5e.elkan5e-mundane-items.PGHsgtscRcDrKt6j";
    CONFIG.DND5E.toolIds.smith = "elkan5e.elkan5e-mundane-items.aFpNp019JYV5bcgI";
    CONFIG.DND5E.toolIds.tailor = "elkan5e.elkan5e-mundane-items.C3PHE8sJKlVZs9bH";
    CONFIG.DND5E.toolIds.tinker = "elkan5e.elkan5e-mundane-items.2Yeb51C04CmAhbsv";
    CONFIG.DND5E.toolIds.woodcarver = "elkan5e.elkan5e-mundane-items.FDsEsGSSPWhqwjlE";
    
    //Exploration Tools
    CONFIG.DND5E.toolIds.disg = "elkan5e.elkan5e-mundane-items.ArsBY1Z7YMKYCWp5";
    CONFIG.DND5E.toolIds.navg = "elkan5e.elkan5e-mundane-items.lExi8Y6jXHBv8vd2";
    CONFIG.DND5E.toolIds.thief = "elkan5e.elkan5e-mundane-items.LMnHshpVe3ciVIwF";
    
    //Gaming Tools
    CONFIG.DND5E.toolIds.card = "elkan5e.elkan5e-mundane-items.SnmHCNVC2dgjQfKC";
    CONFIG.DND5E.toolIds.chess = "elkan5e.elkan5e-mundane-items.xC669rfIiGBpAALC";
    CONFIG.DND5E.toolIds.dice = "elkan5e.elkan5e-mundane-items.ZkZ9QPLdXvGleXxj";
    
    //Other Tools
    CONFIG.DND5E.toolIds.forg = "elkan5e.elkan5e-mundane-items.dFa31G5pfZ3FGcjk";
    
    //Removing Tools
    delete CONFIG.DND5E.toolIds.glassblower
    delete CONFIG.DND5E.toolIds.potter
    delete CONFIG.DND5E.toolIds.weaver
    delete CONFIG.DND5E.toolIds.carpenter
    delete CONFIG.DND5E.toolIds.cartographer
    delete CONFIG.DND5E.toolIds.cobbler
}