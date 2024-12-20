/*
 * Adds the extra speed types (DOES NOTHING RIGHT NOW)
 */
export function speed(){
    console.log("Elkan 5e  |  Initializing Speed")

    const movementTypes = {
        crawl: "Crawl",
        longJump: "Long Jump",
        highJump: "High Jump"
    };

    Object.assign(CONFIG.DND5E.movementTypes, movementTypes);
}

