import { gameSettingRegister } from "./scripts/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./scripts/gameSettings/startDialog.mjs";
import { init} from "./scripts/initalizing.mjs";




Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    gameSettingRegister()
    init()
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