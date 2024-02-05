/**
 * All the changes of Elkan 5e in Foundry.
 */
export function weapons(){
    console.log("Elkan 5e  |  Initializing Weapons")
    weaponTypes()
    weaponProperties()
}


/**
 * Changes the weapon properties in Foundry to match Elkan 5e.
 */
export function weaponProperties(){
    //Adding new weapon Properties
    CONFIG.DND5E.itemProperties.coldIron = {
        label:"Cold Iron",
        isPhysical: "true"
    };

    CONFIG.DND5E.itemProperties.mou = {
        label:"Mounted"
    };
    CONFIG.DND5E.itemProperties.unw = {
        label:"Unwieldy"
    };


    CONFIG.DND5E.validProperties.weapon.add("coldIron")
    CONFIG.DND5E.validProperties.weapon.add("mou")
    CONFIG.DND5E.validProperties.weapon.add("unw")
    //Removing Weapon Property
    CONFIG.DND5E.validProperties.weapon.delete("spc")
}


/**
 * Removes weapons that aren't in Elkan 5e in Foundry.
 */
export function weaponTypes(){
    delete CONFIG.DND5E.weaponIds.flail
    delete CONFIG.DND5E.weaponIds.net
    delete CONFIG.DND5E.weaponIds.trident
    delete CONFIG.DND5E.weaponIds.warpick
}