import { init} from "./scripts/initalizing.mjs";

Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    init()
});


/**
 * Things that occur when an attack is declaired
 */
Hooks.on("dnd5e.preRollAttack", (item, config) => {
    focus(item,config)
});



// TODO: This works with getting midi saves
// Hooks.on("dnd5e.preRollAbilitySave", (actor,roll,abilityID) => {
//     console.log("Elkan 5e Actor", actor)
//     console.log("Elkan 5e Roll", roll)
//     console.log("Elkan 5e abilityID", abilityID)
// });

