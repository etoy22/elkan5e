import {tools} from "./initScript/tools.mjs";
import {conditions} from "./initScript/condition.mjs"
import {weaponTotal} from "./initScript/weapon.mjs"
import {armor} from "./initScript/armor.mjs"
import {language} from "./initScript/language.mjs"


Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    tools();
    conditions();
    weaponTotal();
    armor();
    language();
});