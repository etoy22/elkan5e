/*
Doing tool configurations
*/
export function tools(){
    
    //Adding Tool Types
    CONFIG.DND5E.toolTypes.art = "Artist's Tools"
    CONFIG.DND5E.toolTypes.craft = "Crafting Tools"
    CONFIG.DND5E.toolTypes.explore = "Exploration Tools"
    
    CONFIG.DND5E.toolProficiencies.art = "Artist's Tools"
    CONFIG.DND5E.toolProficiencies.craft = "Crafting Tools"
    CONFIG.DND5E.toolProficiencies.explore = "Exploration Tools"
    CONFIG.DND5E.toolProficiencies.vehicle = "Vehicles"
    
    //Musical Instruments
    CONFIG.DND5E.toolIds.bagpipes = "elkan5e.elkan5e-mundane-items.bltntEoiFJvXR939";
    CONFIG.DND5E.toolIds.drum = "elkan5e.elkan5e-mundane-items.VLTPhQqTAOk2LPHW";
    CONFIG.DND5E.toolIds.dul = "elkan5e.elkan5e-mundane-items.v72QLYutEG6w5ZRI";
    CONFIG.DND5E.toolIds.drum = "elkan5e.elkan5e-mundane-items.VLTPhQqTAOk2LPHW";
    CONFIG.DND5E.toolIds.dulcimer = "elkan5e.elkan5e-mundane-items.v72QLYutEG6w5ZRI";
    CONFIG.DND5E.toolIds.flute = "elkan5e.elkan5e-mundane-items.uDJgqlZsYrqLrNEX";
    CONFIG.DND5E.toolIds.horn = "elkan5e.elkan5e-mundane-items.PgP06DVVwXZNPMOW";
    CONFIG.DND5E.toolIds.lute = "elkan5e.elkan5e-mundane-items.yQy1cBGK6P3eD4GZ";
    CONFIG.DND5E.toolIds.lyre = "elkan5e.elkan5e-mundane-items.BrCG6C5mCLPahCml";
    CONFIG.DND5E.toolIds.panflute = "elkan5e.elkan5e-mundane-items.VC36HOskyNfD6DXV";
    CONFIG.DND5E.toolIds.shawm = "elkan5e.elkan5e-mundane-items.ZN6lVBJAeNqt4EE9";
    CONFIG.DND5E.toolIds.viol = "elkan5e.elkan5e-mundane-items.rrNz3sZQQdb8ygRW";
    
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
}