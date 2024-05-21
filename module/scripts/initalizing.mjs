import { armor } from "./rules/armor.mjs";
import { conditions, icons } from "./rules/condition.mjs";
import { language } from "./rules/language.mjs";
import { activation, ruleType, mats, subFeatures } from "./format.mjs";
import { speed } from "./rules/speed.mjs";
import { tools } from "./rules/tools.mjs";
import { weapons } from "./rules/weapon.mjs";
import { combat, skills } from "./rules/references.mjs";



export function init(){
    tools();
    conditions();
    weapons();
    armor();
    language();
    subFeatures()
    mats()
    skills()
    ruleType()
    activation()
    icons()
    combat()
    // TODO: the following below
    // speed()
} 
