import { init} from "./scripts/initalizing.mjs";

Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    init()
    d.render(true);
});


/**
 * Things that occur when an attack is declaired
 */
Hooks.on("dnd5e.preRollAttack", (item, config) => {
    focus(item,config)
});

let d = new Dialog({
    title: "Test Dialog",
    content: "<p>You must choose either Option 1, or Option 2</p>",
    buttons: {
     one: {
      icon: '<i class="fas fa-check"></i>',
      label: "Option One",
      callback: () => console.log("Chose One")
     },
     two: {
      icon: '<i class="fas fa-times"></i>',
      label: "Option Two",
      callback: () => console.log("Chose Two")
     }
    }
});

// TODO: This works with getting midi saves
// Hooks.on("dnd5e.preRollAbilitySave", (actor,roll,abilityID) => {
//     console.log("Elkan 5e Actor", actor)
//     console.log("Elkan 5e Roll", roll)
//     console.log("Elkan 5e abilityID", abilityID)
// });

