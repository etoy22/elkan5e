const IGNORED_TYPES = new Set(["temphp", "maximum", "midi-none", "none"]);

/**
 * Finds the midi-qol workflow activity behind a damage calculation. midi-qol's calculation
 * options only carry the source actor and target UUIDs, so the most recent workflow from that
 * actor that includes the target is used.
 *
 * @param {object} midi - The `options.midi` block midi-qol passes to calculateDamage.
 * @returns {Activity|null}
 */
function _findMidiActivity(midi) {
	const workflows = globalThis.MidiQOL?.Workflow?.workflows;
	if (!midi?.sourceActorUuid || !workflows) return null;
	let match = null;
	for (let workflow of workflows.values()) {
		if (workflow instanceof WeakRef) workflow = workflow.deref();
		if (!workflow || workflow.actor?.uuid !== midi.sourceActorUuid) continue;
		if (midi.targetUuid) {
			const targets = Array.from(workflow.targets ?? []);
			if (!targets.some((t) => (t.document?.uuid ?? t.uuid) === midi.targetUuid)) continue;
		}
		match = workflow;
	}
	return match?.activity ?? null;
}

/**
 * Finds the activity that produced the damage being calculated.
 *
 * @param {DamageApplicationOptions} options
 * @returns {Activity|null}
 */
function _getDamageActivity(options) {
	const activity = options?.originatingMessage?.getAssociatedActivity?.();
	if (activity) return activity;
	return _findMidiActivity(options?.midi);
}

/**
 * Handles Swarm Damage Resistance.
 * Triggered by the dnd5e.calculateDamage hook after resistances and vulnerabilities are applied.
 * Requires flags.elkan5e.swarm on the actor (set by the Swarm Damage Resistance item's effect).
 * Damage from an activity with an area template is doubled; damage from any other activity is
 * halved. Damage with no activity behind it (manual HP edits, midi-qol's manual multiplier
 * buttons, plain rolls) is left alone.
 *
 * @param {Actor5e} actor
 * @param {DamageSummary} damages
 * @param {DamageApplicationOptions} options
 */
export function swarmDamage(actor, damages, options) {
	if (!actor?.flags?.elkan5e?.swarm || !damages?.length) return;
	if (options?.ignore === true) return;

	const activity = _getDamageActivity(options);
	if (!activity) return;

	const isArea = (activity.target?.template?.type ?? "") in CONFIG.DND5E.areaTargetTypes;
	const category = isArea ? "vulnerability" : "resistance";
	const ignored = options?.ignore?.[category];
	if (ignored === true) return;

	let delta = 0;
	for (const d of damages) {
		if (IGNORED_TYPES.has(d.type) || d.type in CONFIG.DND5E.healingTypes) continue;
		if (ignored?.has?.("ALL") || ignored?.has?.(d.type)) continue;
		if (!d.value) continue;
		const value = isArea ? d.value * 2 : Math.trunc(d.value / 2);
		delta += value - d.value;
		d.value = value;
		d.active ??= {};
		d.active.multiplier = (d.active.multiplier ?? 1) * (isArea ? 2 : 0.5);
		(d.active.all ??= {})[category] = true;
	}
	damages.amount = Math.trunc(damages.amount + delta);
}
