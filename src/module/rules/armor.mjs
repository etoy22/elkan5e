import { createBarbarianDefenseEffect } from "../shared/effect-factories.mjs";

/**
 * Applies armor rule behavior.
 *
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
		["ringmail", "studded"].forEach((id) => delete CONFIG.DND5E.armorIds[id]);
		delete CONFIG.DND5E.shieldIds.shield;
	}

	// Add List
	Object.assign(CONFIG.DND5E.shieldIds, {
		large: "elkan5e.elkan5e-equipment.AENiTUeluTRiFzRz",
		small: "elkan5e.elkan5e-equipment.OE836KUoJiAsG0IA",
	});
	CONFIG.DND5E.armorClasses["barbarianDefense"] = {
		label: "Barbarian's Defense",
		formula: "@attributes.ac.armor",
		calc: "barbarianDefense",
	};

	if (dragon) {
		CONFIG.DND5E.armorClasses.draconic.formula = "13 + @abilities.cha.mod";
	}
}

/**
 * Applies calculate Ac Bonus rule behavior.
 *
 * @param {*} actor - Actor document to process.
 * @returns Operation result.
 */
function calculateAcBonus(actor) {
	const dex = actor.system.abilities.dex.mod;
	const con = actor.system.abilities.con.mod;

	// Only light/medium armor modifies the bonus; heavy armor and unarmored are handled below.
	const armor = actor.items.find(
		(i) =>
			i.type === "equipment" &&
			i.system.equipped &&
			(i.system.type.value === "light" || i.system.type.value === "medium"),
	);

	// Unarmored — full Dex + Con bonus.
	if (!armor) return dex + con;

	// Armored — best of Dex or Con, each capped by the armor's dex limit (if any).
	const dexCap = armor.system.armor.dex ?? null;
	if (dexCap !== null) return Math.max(Math.min(dex, dexCap), Math.min(con, dexCap));
	return Math.max(dex, con);
}

/**
 * Updates update Barbarian Defense state.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function updateBarbarianDefense(actor) {
	if (!actor?.system) return;
	if (game.users.activeGM?.id !== game.user.id) return;

	const isUsingBarbarianDefense = actor.system.attributes.ac.calc === "barbarianDefense";
	const existing = actor.effects.find((e) => e.name === "Barbarian Defense Bonus");

	// Not using Barbarian Defense — remove the effect if it exists and bail.
	if (!isUsingBarbarianDefense) {
		await existing?.delete();
		return;
	}

	const bonus = calculateAcBonus(actor);

	// Zero bonus — remove any stale effect and bail without creating a pointless +0 entry.
	if (bonus === 0) {
		await existing?.delete();
		return;
	}

	const changes = [
		{
			key: "system.attributes.ac.bonus",
			mode: CONST.ACTIVE_EFFECT_MODES.ADD,
			value: bonus,
			priority: 20,
		},
	];

	if (existing) {
		const current = Number(existing.changes?.[0]?.value ?? 0);
		if (current !== bonus) await existing.update({ changes });
	} else {
		const effectData = await createBarbarianDefenseEffect(actor, changes);
		await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
	}
}
