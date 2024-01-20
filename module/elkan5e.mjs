import {tools} from "./setup/tools.mjs";
import {conditions} from "./setup/condition.mjs"
import {weaponTotal} from "./setup/weapon.mjs"
import {armor} from "./setup/armor.mjs"
import {language} from "./setup/language.mjs"


Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    tools();
    conditions();
    weaponTotal();
    armor();
    language();
});