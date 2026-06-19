/**
 * Handles Undead Fortitude.
 * Triggered by the dnd5e.preApplyDamage hook before damage is written to the actor.
 * Cancels the damage synchronously, then rolls a Con save and sets HP to 0 or 1.
 *
 * @param {Actor5e} actor
 * @param {number} amount - Net damage amount to be applied.
 * @param {object} _updates
 * @param {DamageApplicationOptions} options
 * @returns {false|void}
 */
export async function undeadFortitude(actor, amount, _updates, options) {
	if (!actor) return;

	const currentHp = Number(actor.system?.attributes?.hp?.value ?? 0);
	if (currentHp - amount > 0) return;

	const hasFeature = actor.items.some(
		(i) => i.system?.identifier === "undead-fortitude" && i.system?.source?.book === "Elkan 5e",
	);
	if (!hasFeature) return;

	const damages = options?.damages ?? [];
	const isRadiant = damages.some((d) => (d.type ?? "").toLowerCase() === "radiant");
	if (isRadiant) return;

	const isCritical =
		options?.critical === true ||
		damages.some((d) => d.critical === true || d.isCritical === true);
	if (isCritical) return;

	let conDC = 5 + amount;
	const saveRolls = await actor.rollSavingThrow({
		ability: "con",
		target: conDC,
		midiOptions: { fastForward: true },
	});
	if (saveRolls?.[0]?.total < conDC) return;
	await actor.update({ "system.attributes.hp.value": 1 });

	return false;
}