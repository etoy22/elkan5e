import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/startDialog.mjs";
import { init } from "./module/initalizing.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";

// CONFIG.elkan5e.WARLOCK_SPELL_SLOT_TABLE = [
//     [2],
//     [2],
//     [2, 1],
//     [2, 2],
//     [2, 2, 1],
//     [2, 2, 2],
//     [2, 2, 2, 1],
//     [2, 2, 2, 2],
//     [2, 2, 2, 2, 1],
//     [2, 2, 2, 2, 2],
//     [2, 2, 2, 2, 2, 1],
//     [2, 2, 2, 2, 2, 1],
//     [2, 2, 2, 2, 2, 1, 1],
//     [2, 2, 2, 2, 2, 1, 1],
//     [2, 2, 2, 2, 2, 1, 1, 1],
//     [2, 2, 2, 2, 2, 1, 1, 1],
//     [2, 2, 2, 2, 2, 1, 1, 1, 1],
//     [2, 2, 2, 2, 2, 1, 1, 1, 1],
//     [2, 2, 2, 2, 2, 2, 1, 1, 1],
//     [2, 2, 2, 2, 2, 2, 2, 1, 1]
// ]
Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    gameSettingRegister()
    init()
    initWarlockSpellSlot()
    // const updateData = {
    //     flags: {
    //         elkan5e: {
    //             "wildcast": 0
    //         }
    //     }
    // }
    // Actor.update(updateData)
    // game.system.config.characterFlags["wildcast"] = {
    //     name: "Wild Cast",
    //     hint: "Wild Cast",

    //     type: Boolean
    // };
    // game.settings.setFlag("elkan5e","")
});

Hooks.once('ready', async () => {
    startDialog()
});

/**
 * Things that occur when an attack is declaired
 */
Hooks.on("dnd5e.preRollAttack", (item, config) => {
    focus(item,config)
});