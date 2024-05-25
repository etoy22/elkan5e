import { armor } from "./rules/armor.mjs";
import { conditions, icons } from "./rules/condition.mjs";
import { language } from "./rules/language.mjs";
import { activation, ruleType, mats, subFeatures, sheets } from "./rules/format.mjs";
import { tools } from "./rules/tools.mjs";
import { weapons } from "./rules/weapon.mjs";
import { references } from "./rules/references.mjs";



export function init(){
    tools();
    conditions();
    weapons();
    armor();
    language();
    subFeatures()
    mats()
    ruleType()
    activation()
    icons()
    sheets()
    references()
} 
