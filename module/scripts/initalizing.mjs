import { armor } from "./rules/armor.mjs";
import { conditions } from "./rules/condition.mjs";
import { subFeatures } from "./rules/feats.mjs";
import { language } from "./rules/language.mjs";
import { speed } from "./rules/speed.mjs";
import { tools } from "./rules/tools.mjs";
import { weaponTotal } from "./rules/weapon.mjs";



export function init(){
    tools();
    conditions();
    weaponTotal();
    armor();
    language();
    speed()
    subFeatures()
    // TODO: the following below
    // target() 
} 