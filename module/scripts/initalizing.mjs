import { armor } from "./rules/armor.mjs";
import { conditions, icons } from "./rules/condition.mjs";
import { subFeatures } from "./rules/feats.mjs";
import { language } from "./rules/language.mjs";
import { mats } from "./rules/material.mjs";
import { ruleType } from "./rules/ruleTypes.mjs";
import { skills } from "./rules/skill.mjs";
import { speed } from "./rules/speed.mjs";
import { tools } from "./rules/tools.mjs";
import { weapons } from "./rules/weapon.mjs";



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
    // TODO: the following below
    // speed()
} 


export function ready(){
    console.log("Elkan 5e  |  In Setup Elkan 5e")
    icons()
}