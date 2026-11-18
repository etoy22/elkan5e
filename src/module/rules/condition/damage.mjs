const LEGACY_WEAKENED_MACRO_UUID = "Compendium.elkan5e.elkan5e-macros.Macro.1NtnoPvTQj1IEHCa";

function getActorEffects(actor) {
	const effects = actor?.effects?.contents ?? actor?.effects ?? [];
	return [...effects];
}

function hasStatus(actor, statusId) {
	const effects = getActorEffects(actor);
	const matchingEffects = effects.filter((effect) => {
		if (effect.disabled || effect.isSuppressed) return false;

		const statuses = effect.statuses;
		return (
			effect.flags?.core?.statusId === statusId ||
			statuses?.has?.(statusId) ||
			(Array.isArray(statuses) && statuses.includes(statusId))
		);
	});
	if (matchingEffects.length) return true;

	return !effects.length && actor?.statuses?.has?.(statusId);
}

function hasWeakenedWeaponDamage(actor) {
	return (
		hasStatus(actor, "weakened") ||
		getActorEffects(actor).some(
			(effect) =>
				!effect.disabled &&
				!effect.isSuppressed &&
				effect.changes?.some(
					(change) =>
						change.key === "flags.midi-qol.onUseMacroName" &&
						typeof change.value === "string" &&
						change.value.includes(LEGACY_WEAKENED_MACRO_UUID),
				),
		)
	);
}

function recomputeDamage(damageItem, details, actor) {
	let amount = 0;
	let temp = 0;
	let healing = 0;
	let tempMax = 0;
	for (const entry of details) {
		if (entry.type === "temphp") temp += entry.value ?? 0;
		else if (entry.type === "vitality") continue;
		else if (entry.type === "maximum") tempMax += entry.value ?? 0;
		else if (
			entry.type === "healing" ||
			entry.active?.absorption ||
			entry.active?.type?.absorption
		)
			healing += entry.value ?? 0;
		else if (entry.type !== "midi-none") amount += entry.value ?? 0;
	}

	const totalDamage = Math.max(0, amount);
	tempMax = Math.trunc(tempMax);
	let change = totalDamage + healing;
	change = change > 0 ? Math.floor(change) : Math.ceil(change);
	damageItem.totalDamage = details.reduce(
		(total, entry) =>
			total +
			(["temphp", "midi-none", "vitality", "maximum"].includes(entry.type)
				? 0
				: (entry.value ?? 0)),
		0,
	);
	damageItem.healingAdjustedTotalDamage = change;

	const hp = actor?.system?.attributes?.hp;
	if (!hp) return;

	const oldTemp = hp.temp ?? 0;
	const deltaTemp = change > 0 ? Math.min(oldTemp, change) : 0;
	const deltaHP = Math.min(
		hp.value - tempMax,
		Math.max(-(hp.damage ?? 0) + tempMax, change - deltaTemp),
	);
	const newTemp = Math.max(oldTemp - deltaTemp, temp);
	damageItem.oldTempMax = hp.tempmax ?? 0;
	damageItem.newTempMax = damageItem.oldTempMax - tempMax;
	damageItem.hpDamage = deltaHP;
	damageItem.newHP = hp.value - deltaHP;
	damageItem.newTempHP = newTemp;
	damageItem.tempDamage = oldTemp - newTemp;
}

function halveDamage(damageItem, details, includeHealing) {
	const isHealing = (entry) =>
		entry.type === "healing" || entry.active?.absorption || entry.active?.type?.absorption;
	let updated = false;
	for (const entry of details) {
		if (["temphp", "midi-none", "vitality", "maximum"].includes(entry.type)) continue;
		if (!includeHealing && isHealing(entry)) continue;
		const reduced = (entry.value ?? 0) / 2;
		if (reduced === entry.value) continue;
		entry.value = reduced;
		if (typeof entry.damage === "number") entry.damage = reduced;
		updated = true;
	}
	return updated;
}

export function applyConditionDamage(workflow, damageItem, actor) {
	const details = damageItem?.damageDetail;
	if (!Array.isArray(details) || !details.length) return;

	damageItem.damageDetail = details.map((entry) => ({
		...entry,
		active: entry.active
			? { ...entry.active, type: entry.active.type ? { ...entry.active.type } : undefined }
			: entry.active,
	}));
	const damageDetails = damageItem.damageDetail;
	const attacker = workflow?.actor ?? actor;

	let updated = false;
	if (
		hasWeakenedWeaponDamage(attacker) &&
		["mwak", "rwak"].includes(workflow?.activity?.actionType)
	) {
		updated = halveDamage(damageItem, damageDetails, false) || updated;
	}

	const item = workflow?.item;
	const props = workflow?.activity?.midiProperties ?? {};
	const magical =
		item?.type === "spell" ||
		item?.system?.properties?.has?.("mgc") ||
		props.magicdam ||
		props.magiceffect;
	if (hasStatus(attacker, "siphoned") && magical) {
		updated = halveDamage(damageItem, damageDetails, true) || updated;
	}

	if (updated) recomputeDamage(damageItem, damageDetails, actor);
}
