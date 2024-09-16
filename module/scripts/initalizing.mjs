import { armor } from "./rules/armor.mjs";
import { conditions, icons } from "./rules/condition.mjs";
import { language } from "./rules/language.mjs";
import { formating } from "./rules/format.mjs";
import { tools } from "./rules/tools.mjs";
import { weapons } from "./rules/weapon.mjs";
import { references } from "./rules/references.mjs";



export function init(){
    references()
    tools();
    conditions();
    weapons();
    armor();
    language();
    icons()
    formating()
    console.log("Elkan 5e  |  Done Initalizing")
    // TODO: the following below
    // speed()
} 
