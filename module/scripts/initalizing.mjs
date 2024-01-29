import { armor } from "./rules/armor.mjs";
import { conditions } from "./rules/condition.mjs";
import { subFeatures } from "./rules/feats.mjs";
import { language } from "./rules/language.mjs";
import { mats } from "./rules/material.mjs";
import { speed } from "./rules/speed.mjs";
import { tools } from "./rules/tools.mjs";
import { weapons } from "./rules/weapon.mjs";



export function init(){
    tools();
    conditions();
    weapons();
    armor();
    language();
    speed()
    subFeatures()
    mats()
    // TODO: the following below
    // target() 
} 