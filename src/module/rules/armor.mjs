/**
 * Changes Foundry's armor types to that of Elkan 5e.
 */
export function armor() {
    const armor = game.settings.get("elkan5e", "armor");
    const dragon = game.settings.get("elkan5e", "draconic-toughness");
    console.log("Elkan 5e  |  Initializing Armor");

    // Ensure CONFIG.DND5E.armorIds exists
    if (!CONFIG.DND5E.armorIds) CONFIG.DND5E.armorIds = {};
    // Ensure CONFIG.DND5E.shieldIds exists
    if (!CONFIG.DND5E.shieldIds) CONFIG.DND5E.shieldIds = {};
    // Ensure CONFIG.DND5E.armorClasses exists
    if (!CONFIG.DND5E.armorClasses) CONFIG.DND5E.armorClasses = {};
    // Ensure CONFIG.DND5E.armorClasses.draconic exists
    if (!CONFIG.DND5E.armorClasses.draconic) CONFIG.DND5E.armorClasses.draconic = {};

    if (!armor) {
        // Delete List
        ["ringmail", "studded"].forEach(id => delete CONFIG.DND5E.armorIds[id]);
        delete CONFIG.DND5E.shieldIds.shield;
    }

    // Add List
    Object.assign(CONFIG.DND5E.shieldIds, {
        large: "elkan5e.elkan5e-equipment.AENiTUeluTRiFzRz",
        small: "elkan5e.elkan5e-equipment.OE836KUoJiAsG0IA"
    });
    CONFIG.DND5E.armorClasses["barbarianDefense"] = {
        label: "Barbarian's Defense",
        formula: "@attributes.ac.armor",
        calc: "barbarianDefense"
    };

    if (dragon) {
        CONFIG.DND5E.armorClasses.draconic.formula = "13 + @abilities.cha.mod";
    }
}

function calculateAcBonus(actor) {
    const dex = actor.system.abilities.dex.mod;
    const con = actor.system.abilities.con.mod;

    const armor = actor.items.find(i =>
        i.type === "equipment" &&
        i.system.equipped &&
        i.system.armor?.type !== "shield"
    );

    if (!armor) {
        // console.log(`Unarmored: ${actor.name}, Dex: ${dex}, Con: ${con}`);
        return con + dex;
    }
    const armorType = armor.system.armor.type;

    // console.log(`Calculating AC Bonus for ${actor.name} with armor type: ${armor}`);
    // console.log(`Dexterity: ${dex}, Constitution: ${con}, Armor: ${armor?.name ?? "None"}, Armor Data: ${armor} Dex Cap (if any): ${armor.system.armor.dex}`);

    if (armorType === "unarmored") {
        return con + dex;
    }

    const dexCap = armor.system.armor.dex ?? null;
    // console.log(`Dexterity Cap: ${dexCap}`);
    if (dexCap !== null) {
        const effectiveDex = Math.min(dex, dexCap);
        const effectiveCon = Math.min(con, dexCap);
        // console.log(`Effective Dexterity: ${effectiveDex}, Effective Constitution: ${effectiveCon}`);
        return Math.max(effectiveDex, effectiveCon);
    }
    return Math.max(dex, con);
}


export async function updateBarbarianDefense(actor) {
    if (!actor || !actor.system) return; // Prevents error if actor is null/undefined

    const isUsingBarbarianDefense = actor.system.attributes.ac.calc === "barbarianDefense";
    const existing = actor.effects.find(e => e.name === "Barbarian Defense Bonus");
    if (!isUsingBarbarianDefense) {
        if (existing) {
            // console.log(`Removing Barbarian Fortitude Bonus: ${actor.name} no longer uses barbarianDefense AC`);
            await existing.delete();
        }
        return;
    }

    const bonus = calculateAcBonus(actor);

    if (bonus === 0 && existing) {
        // console.log(`Removing zero-value Fortitude Bonus for ${actor.name}`);
        await existing.delete();
        return;
    }

    const changes = [{
        key: "system.attributes.ac.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: bonus,
        priority: 20
    }];

    if (existing) {
        const current = Number(existing.changes?.[0]?.value ?? 0);
        if (current !== bonus) {
            // console.log(`Updating Fortitude Bonus from ${current} to ${bonus} for ${actor.name}`);
            await existing.update({ changes });
        }
    } else {
        const effectData = {
            name: "Barbarian Defense Bonus",
            icon: "icons/commodities/biological/shell-tan.webp", // Change this to fit your module style
            origin: actor.uuid,
            disabled: false,
            changes
        };
        // console.log(`Applying new Fortitude Bonus of ${bonus} for ${actor.name}`);
        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
}
