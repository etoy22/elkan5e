export async function markForDeath(workflow) {
	try {
		if (workflow.hitTargets.size === 0) return {};
		const target = workflow.hitTargets.first();
		const isMarked = target.actor?.effects?.find((ef) => {
			const byName = ef.name === "Mark for Death";
			if (!byName) return false;
			const sourceItem = MidiQOL.getItemFromEffectOrigin(ef.origin ?? "");
			return sourceItem?.uuid === macroItem.uuid;
		});
		if (!isMarked) return {};

		// ── Damage formula: prefer the ranger scale value, fall back to 1d4 ─────────
		const scaleValue = workflow.actor?.system?.scale?.ranger?.["mark-for-death"];
		const base = workflow.item?.system?.damage?.base;
		const parts = workflow.item?.system?.damage?.parts;
		let damageType = "slashing";

		if (base?.types instanceof Set && base.types.size > 0) {
			[damageType] = [...base.types]; // dnd5e v4 / Foundry v14
		}

		const isCritical = workflow.isCritical;
		return await new CONFIG.Dice.DamageRoll(
			formula,
			{},
			{ type: damageType, isCritical, flavor: macroItem.name },
		).evaluate();
	} catch (err) {
		console.error("markForDeath |", err);
		return {};
	}
}
