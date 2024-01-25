/*
 * Adding a target option called Visible Creature
 */
export function target (){
    CONFIG.DND5E.targetTypes.visibleTarget = "Visible Creature"
    CONFIG.DND5E.individualTargetTypes.visibleTarget = "Visible Creature"
    console.log("Elkan 5e targetTypes |", CONFIG.DND5E.targetTypes)
    console.log("Elkan 5e targetTypes |", CONFIG.DND5E.individualTargetTypes)
}