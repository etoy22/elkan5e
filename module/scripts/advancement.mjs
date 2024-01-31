import {advance_monk} from "./classes/monk.mjs"
import {advance_sorcerer} from "./classes/sorcerer.mjs"
import {advance_cleric} from "./classes/cleric.mjs"
import {advance_bard} from "./classes/bard.mjs"

/**
 * On advancement type abilities
 */
export function advance(toCreate,toUpdate){
    advance_bard(toCreate,toUpdate)
    advance_cleric(toCreate,toUpdate)
    advance_monk(toCreate,toUpdate)
    advance_sorcerer(toCreate,toUpdate)
}


