import { SIZE_ORDER, hasSpecialTrait } from "./shared/effects.mjs";

export { hasPushResist, isPushBlocked } from "./shared/effects.mjs";

/**
 * Get a skill total or fallback modifier for a skill key.
 *
 * @param {*} actor - Actor document to process.
 * @param {*} key - Skill key.
 * @returns {number} Numeric skill total.
 */
export const getSkillTotal = (actor, key) =>
	Number(actor?.system?.skills?.[key]?.total ?? actor?.system?.skills?.[key]?.mod ?? 0);

/**
 * Choose the defender's better skill between Athletics and Acrobatics.
 *
 * @param {*} actor - Actor document to process.
 * @returns {"ath"|"acr"} Best defender skill key.
 */
export const chooseDefenderSkill = (actor) => {
	const ath = getSkillTotal(actor, "ath");
	const acr = getSkillTotal(actor, "acr");
	return acr > ath ? "acr" : "ath";
};

/**
 * Get size index for an actor, applying Powerful Build if present.
 *
 * @param {*} actor - Actor document to process.
 * @returns {number} Effective size index.
 */
export const sizeIndex = (actor) => {
	const size = actor?.system?.traits?.size ?? "med";
	const idx = SIZE_ORDER.indexOf(size);
	const base = idx === -1 ? SIZE_ORDER.indexOf("med") : idx;
	const powerfulBuild = hasSpecialTrait(actor, "powerful build");
	const result = powerfulBuild ? Math.min(base + 1, SIZE_ORDER.length - 1) : base;

	console.log(
		`Elkan 5e | sizeIndex actor="${actor?.name ?? "Unknown"}" size="${size}" base=${base} powerfulBuild=${powerfulBuild} result=${result}`,
	);

	return result;
};
