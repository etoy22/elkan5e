const DC_MODIFIER_FLAG = "undeadFortitudeDCModifier";

function _getSaveAdvantage(actor) {
	let advantage = false;
	let disadvantage = false;
	for (const effect of actor.effects) {
		if (effect.disabled) continue;
		const flags = effect.flags?.dnd5e ?? {};
		if (flags.advantage?.save?.con || flags.advantage?.save?.all) advantage = true;
		if (flags.disadvantage?.save?.con || flags.disadvantage?.save?.all) disadvantage = true;
	}
	if (advantage && disadvantage) return {};
	return { advantage, disadvantage };
}

/**
 * Handles Undead Fortitude.
 * Triggered by the dnd5e.preApplyDamage hook before damage is written to the actor.
 * Requires flags.elkan5e.undeadFortitude = true on the actor (set via a DAE active effect).
 *
 * flags.elkan5e.undeadFortitudeDCModifier {number} - Added to the base DC (negative lowers it).
 *
 * @param {Actor5e} actor
 * @param {number} amount - Net damage amount to be applied.
 * @param {object} _updates
 * @param {DamageApplicationOptions} options
 * @returns {Promise<false|void>}
 */
export async function undeadFortitude(actor, amount, _updates, options) {
	if (!actor) return;
	const enabled = actor.flags?.dnd5e?.undeadFortitude || actor.flags?.elkan5e?.undeadFortitude;
	if (!enabled) return;

	const currentHp = Number(actor.system?.attributes?.hp?.value ?? 0);
	if (currentHp - amount > 0) return;

	const damages = options?.damages ?? [];
	const isRadiant = damages.some((d) => (d.type ?? "").toLowerCase() === "radiant");
	if (isRadiant) return;

	const isCritical =
		options?.critical === true ||
		damages.some((d) => d.critical === true || d.isCritical === true);
	if (isCritical) return;

	if (game.user.isGM) {
		const skip = await foundry.applications.api.DialogV2.confirm({
			window: { title: `Undead Fortitude — ${actor.name}` },
			content: "<p>Skip Undead Fortitude and set HP to 0?</p>",
			rejectClose: false,
		});
		if (skip) return;
	}

	const dcModifier =
		Number(actor.flags?.dnd5e?.undeadFortitudeDCModifier ?? 0) +
		Number(actor.getFlag("elkan5e", DC_MODIFIER_FLAG) ?? 0);
	const conDC = Math.max(1, 5 + amount + dcModifier);

	const { advantage, disadvantage } = _getSaveAdvantage(actor);
	const saveRolls = await actor.rollSavingThrow({
		ability: "con",
		target: conDC,
		advantage,
		disadvantage,
		midiOptions: { fastForward: true },
	});
	if (saveRolls?.[0]?.total < conDC) return;
	await actor.update({ "system.attributes.hp.value": 1 });

	return false;
}
