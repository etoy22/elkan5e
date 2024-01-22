import {tools} from "./setup/tools.mjs";
import {conditions} from "./setup/condition.mjs"
import {weaponTotal} from "./setup/weapon.mjs"
import {armor} from "./setup/armor.mjs"
import {language} from "./setup/language.mjs"
import {focus} from "./classes/barbarian.mjs"
import {advance_monk} from "./classes/monk.mjs"
import {advance_sorcerer} from "./classes/sorcerer.mjs"
import {advance_cleric} from "./classes/cleric.mjs"


Hooks.once("init", () => {
    console.log("Elkan 5e  |  Initializing Elkan 5e")
    tools();
    conditions();
    weaponTotal();
    armor();
    language();
});

/**
 * Things that occur when an attack is declaired
 */
Hooks.on("dnd5e.preRollAttack", (item, config) => {
    focus(item, config)
});

/**
 * On advancement type abilities
 */
Hooks.on("dnd5e.preAdvancementManagerComplete", (advancementManager,actorUpdates,toCreate,toUpdate,toDelete) => {
    advance_monk(toCreate,toUpdate)
    advance_sorcerer(toCreate,toUpdate)
    advance_cleric(toCreate,toUpdate)
});