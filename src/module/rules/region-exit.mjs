/**
 * Ends effects that only last while a creature stays in a spell's area (such as Zone of Truth)
 * once the creature leaves it. Midi-QOL's area rules can apply an effect when a creature enters,
 * but have no way to remove it when it leaves.
 *
 * Effects opt in with flags.elkan5e.endsOnRegionExit. The effect ends when its creature is no
 * longer inside any area created by the same item. Runs on the active GM.
 *
 * @param {TokenDocument} tokenDoc - Token that moved.
 * @param {object} changes - Token update changes.
 * @returns {Promise<void>}
 */
export async function endEffectsOnRegionExit(tokenDoc, changes) {
	if (!game.users.activeGM?.isSelf) return;
	if (!("x" in changes) && !("y" in changes) && !("elevation" in changes)) return;
	const actor = tokenDoc.actor;
	const effects = actor?.effects.filter((e) => e.getFlag("elkan5e", "endsOnRegionExit")) ?? [];
	if (!effects.length) return;

	const { width, height } = tokenDoc.getSize?.() ?? {
		width: tokenDoc.width * canvas.grid.size,
		height: tokenDoc.height * canvas.grid.size,
	};
	const center = {
		x: tokenDoc.x + width / 2,
		y: tokenDoc.y + height / 2,
		elevation: tokenDoc.elevation ?? 0,
	};
	const itemOf = (uuid) => uuid?.split(".ActiveEffect.")[0];
	const ended = effects.filter((effect) => {
		const item = itemOf(effect.origin);
		if (!item) return false;
		const areas = tokenDoc.parent.regions.filter((r) => r.getFlag("dnd5e", "item") === item);
		// Leave it alone if the area is gone; the spell ending removes the effect.
		if (!areas.length) return false;
		return !areas.some((region) => region.testPoint(center));
	});
	if (ended.length) {
		await actor.deleteEmbeddedDocuments(
			"ActiveEffect",
			ended.map((e) => e.id),
		);
	}
}
