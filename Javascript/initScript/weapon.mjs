/**
 * All the changes of Elkan 5e in Foundry.
 */
export function weaponTotal(){
    console.log("Elkan 5e  |  Initializing Weapons")
    weaponTypes()
    weaponProperties()
}



/**
 * Changes the weapon properties in Foundry to match Elkan 5e.
 */
export function weaponProperties(){
    CONFIG.DND5E.weaponProperties.coldIron = "Cold Iron"
    CONFIG.DND5E.physicalWeaponProperties.coldIron = "Cold Iron"
    CONFIG.DND5E.weaponProperties.mou = "Mounted"
    CONFIG.DND5E.weaponProperties.unw = "Unwieldy"
    delete CONFIG.DND5E.weaponProperties.spc
}


/**
 * Removes weapons that aren't in Elkan 5e in Foundry.
 */
export function weaponTypes(){
    //Removed Weapons
    delete CONFIG.DND5E.weaponIds.flail
    delete CONFIG.DND5E.weaponIds.net
    delete CONFIG.DND5E.weaponIds.trident
    delete CONFIG.DND5E.weaponIds.warpick
}