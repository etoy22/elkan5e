/**
 * DAE's "Dependent Conditions" setting creates a status effect document (with a static id such as
 * "dnd5eslowed00000") for every status an active effect carries. Elkan's compendium conditions,
 * and effects that copy a condition's rules, already carry those changes, so the auto-created
 * copy would apply them a second time (e.g. Hasted giving x4 speed, Slowed giving -4 AC).
 *
 * When DAE auto-creates a status document and another active effect on the actor already carries
 * the same status, the copy isn't created at all if the other effect covers all of its rules, so
 * the creature shows one effect (one Prone, not two). Otherwise the copy keeps only the rules the
 * other effect doesn't cover.
 *
 * @param {ActiveEffect} effect - Effect about to be created.
 * @returns {boolean|void} False to cancel creating the copy.
 */
export function dedupeAutoCreatedStatus(effect) {
	if (!effect?.flags?.dae?.autoCreated) return;
	const actor = effect.parent;
	if (!(actor instanceof CONFIG.Actor.documentClass)) return;
	const changes = effect.system?.changes ?? effect.changes ?? [];
	const statuses = [...(effect.statuses ?? [])];
	if (!statuses.length) return;

	const keyOf = (c) => `${c.key}|${c.value}`;
	const covered = new Set();
	let carried = false;
	for (const other of actor.effects) {
		if (other.id === effect.id || other.disabled || other.flags?.dae?.autoCreated) continue;
		if (!statuses.every((s) => other.statuses?.has(s))) continue;
		carried = true;
		for (const c of other.system?.changes ?? other.changes ?? []) covered.add(keyOf(c));
	}
	if (!carried) return;
	const remaining = changes.filter((c) => !covered.has(keyOf(c)));
	if (!remaining.length) return false;
	if (remaining.length !== changes.length) {
		effect.updateSource({ "system.changes": remaining.map((c) => ({ ...c })) });
	}
}

/**
 * Adds the conditions a condition implies (Stunned, Paralyzed, Petrified, and Unconscious imply
 * Incapacitated) to an effect that gives the condition. DAE's copy of the condition lists them too,
 * so with them on the original effect the copy is fully covered and isn't created, and DAE still
 * adds the implied condition.
 *
 * @param {ActiveEffect} effect - Effect about to be created.
 * @returns {void}
 */
export function addImpliedStatuses(effect) {
	if (effect?.flags?.dae?.autoCreated) return;
	if (!(effect?.parent instanceof CONFIG.Actor.documentClass)) return;
	const statuses = new Set(effect.statuses ?? []);
	if (!statuses.size) return;
	const before = statuses.size;
	for (const status of [...statuses]) {
		const config = CONFIG.statusEffects.find((s) => s.id === status);
		for (const implied of config?.statuses ?? []) statuses.add(implied);
	}
	if (statuses.size !== before) effect.updateSource({ statuses: [...statuses] });
}

/**
 * Stops a creature from getting a second copy of a condition it already has from the same source,
 * such as a second Prone from failing Grease's save again while already prone.
 *
 * @param {ActiveEffect} effect - Effect about to be created.
 * @returns {boolean|void} False to cancel creating the copy.
 */
export function skipDuplicateCondition(effect) {
	if (effect?.flags?.dae?.autoCreated) return;
	const actor = effect?.parent;
	if (!(actor instanceof CONFIG.Actor.documentClass)) return;
	const statuses = effect.statuses ?? new Set();
	if (!statuses.size) return;
	const source = effect._stats?.compendiumSource ?? effect.origin;
	if (!source) return;
	const duplicate = actor.effects.some(
		(other) =>
			other.name === effect.name &&
			!other.disabled &&
			(other._stats?.compendiumSource ?? other.origin) === source &&
			other.statuses.size === statuses.size &&
			[...statuses].every((s) => other.statuses.has(s)),
	);
	if (duplicate) return false;
}
