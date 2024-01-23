import {tools} from "./setup/tools.mjs";
import {conditions} from "./setup/condition.mjs"
import {weaponTotal} from "./setup/weapon.mjs"
import {armor} from "./setup/armor.mjs"
import {language} from "./setup/language.mjs"

import {focus} from "./classes/barbarian.mjs"
import {advance_monk} from "./classes/monk.mjs"
import {advance_sorcerer} from "./classes/sorcerer.mjs"
import {advance_cleric} from "./classes/cleric.mjs"

import {target} from "./setup/target.mjs";

// import { grapple } from "./conditions/grapple.mjs";

Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    tools();
    conditions();
    weaponTotal();
    armor();
    language();
    // TODO: the following below
    // target() 
});

/**
 * Things that occur when an attack is declaired
 */
Hooks.on("dnd5e.preRollAttack", (item, config) => {
    focus(item, config)
    // TODO: the following below
    // grapple() //This may want to go in dnd5e.preRollSkill or even rollSkill
});

/**
 * On advancement type abilities
 */
Hooks.on("dnd5e.preAdvancementManagerComplete", (advancementManager,actorUpdates,toCreate,toUpdate,toDelete) => {
    advance_bard(toCreate,toUpdate)
    advance_cleric(toCreate,toUpdate)
    advance_monk(toCreate,toUpdate)
    advance_sorcerer(toCreate,toUpdate)
});


// TODO: This works with getting midi saves
// Hooks.on("dnd5e.preRollAbilitySave", (actor,roll,abilityID) => {
//     console.log("Elkan 5e Actor", actor)
//     console.log("Elkan 5e Roll", roll)
//     console.log("Elkan 5e abilityID", abilityID)
// });