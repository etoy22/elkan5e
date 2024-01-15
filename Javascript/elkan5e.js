import {tools} from "./startingScripts/tools.js";
import {conditions} from "./startingScripts/condition.js"
import {weaponTotal} from "./startingScripts/weapon.js"
import {feature} from "./startingScripts/feature.js"
import {armor} from "./startingScripts/armor.js"
import {language} from "./startingScripts/language.js"


Hooks.once("init", () => {
    tools();
    feature();
    conditions();
    weaponTotal();
    armor();
    language();
});



//This is part of the siphoned and weakened thing to figure out
// Hook.once("dnd5e.preRollDamage", (item,config) => {

// })