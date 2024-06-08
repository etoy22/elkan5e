import { init} from "./scripts/initalizing.mjs";

Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    init()
});


/**
 * Things that occur when an attack is declaired
*/
Hooks.on("dnd5e.preCreateItemTemplate", (item, templateData) => {
    console.log("Elkan 5e  |  item", item)
    console.log("Elkan 5e  |  config", templateData)
    
    if (item.name == "Web"){
        console.log("Elkan 5e  |  Hope")
        item.system.target.value = ""+20 + 5*(item.system.level - 2)
        templateData.width = 20 + 5*(item.system.level - 2)
    }
});



// TODO: This works with getting midi saves
// Hooks.on("dnd5e.preRollAbilitySave", (actor,roll,abilityID) => {
//     console.log("Elkan 5e Actor", actor)
//     console.log("Elkan 5e Roll", roll)
//     console.log("Elkan 5e abilityID", abilityID)
// });


// TODO: This works with getting midi saves
// Hooks.on("dnd5e.preRollAbilitySave", (actor,roll,abilityID) => {
//     console.log("Elkan 5e Actor", actor)
//     console.log("Elkan 5e Roll", roll)
//     console.log("Elkan 5e abilityID", abilityID)
// });

