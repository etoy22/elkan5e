import {focus} from "./scripts/classes/barbarian.mjs"
import { advance } from "./scripts/advancement.mjs";
import { init } from "./scripts/initalizing.mjs";

Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    init()
});

/**
 * Things that occur when an attack is declaired
 */
Hooks.on("dnd5e.preRollAttack", (item, config) => {
    focus(item, config)
});


Hooks.on("dnd5e.preAdvancementManagerComplete", (advancementManager,actorUpdates,toCreate,toUpdate,toDelete) => {
    advance(toCreate,toUpdate)
});


// TODO: This works with getting midi saves
// Hooks.on("dnd5e.preRollAbilitySave", (actor,roll,abilityID) => {
//     console.log("Elkan 5e Actor", actor)
//     console.log("Elkan 5e Roll", roll)
//     console.log("Elkan 5e abilityID", abilityID)
// });