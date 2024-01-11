import {tools} from "./scripts/tools.js";
import {conditions} from "./scripts/condition.js"
import {weaponTotal} from "./scripts/weapon.js"
import {feature} from "./scripts/feature.js"
import {armor} from "./scripts/armor.js"
import {language} from "./scripts/language.js"


Hooks.once("init", () => {
    tools();
    feature();
    conditions();
    weaponTotal();
    armor();
    language();
});

