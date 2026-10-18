import { updateActorAsGM } from "../shared/helpers.mjs";

const DIVINE_WORD_BANISHED_TYPES = new Set(["celestial", "elemental", "fey", "fiend"]);

/**
 * Builds a timed condition effect for Divine Word.
 *
 * @param {Item5e} item - The Divine Word item (origin and image).
 * @param {string} name - Effect name.
 * @param {string[]} statuses - Conditions applied.
 * @param {number} seconds - Duration in seconds.
 * @param {object[]} [changes] - Extra effect changes.
 * @returns {object} ActiveEffect create data.
 */
const divineWordEffect = (item, name, statuses, seconds, changes = []) => ({
	name,
	img: item?.img,
	origin: item?.uuid,
	statuses,
	duration: { seconds },
	changes,
});

/**
 * Runs Divine Word spell automation from its activity macro (postActiveEffects).
 * Each creature that failed the save suffers an effect based on its current hit points:
 * 50 or fewer: deafened (1 minute); 40 or fewer: deafened and blinded (10 minutes);
 * 30 or fewer: blinded, deafened, and stunned (1 hour); 20 or fewer: killed.
 * Celestials, elementals, fey, and fiends that fail are also banished for 24 hours.
 *
 * @param {*} workflow - midi-qol workflow.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function divineWord(workflow) {
	try {
		const item = workflow.item;
		for (const target of workflow.failedSaves ?? []) {
			const actor = target?.actor ?? target?.document?.actor;
			if (!actor) continue;
			const hp = Number(actor.system?.attributes?.hp?.value ?? 0);
			const effects = [];

			if (hp <= 20) {
				await updateActorAsGM(actor, { "system.attributes.hp.value": 0 });
				effects.push(divineWordEffect(item, "Divine Word [Slain]", ["dead"], null));
			} else if (hp <= 30) {
				effects.push(
					divineWordEffect(item, "Divine Word", ["blinded", "deafened", "stunned"], 3600),
				);
			} else if (hp <= 40) {
				effects.push(divineWordEffect(item, "Divine Word", ["blinded", "deafened"], 600));
			} else if (hp <= 50) {
				effects.push(divineWordEffect(item, "Divine Word", ["deafened"], 60));
			}

			if (DIVINE_WORD_BANISHED_TYPES.has(actor.system?.details?.type?.value)) {
				effects.push(
					divineWordEffect(item, "Divine Word [Banished]", [], 86400, [
						{ key: "flags.midi-qol.neverTarget", type: "custom", value: "1" },
					]),
				);
			}

			if (effects.length) {
				await MidiQOL.createEffects({
					actorUuid: actor.uuid,
					effects,
					options: { keepId: false },
				});
			}
		}
	} catch (err) {
		console.error("Divine Word |", err);
	}
}

/**
 * Runs Curse of Doom automation at dnd5e.damageActor: a creature that reaches
 * 0 hit points while cursed dies instantly.
 *
 * @param {Actor5e} actor - Actor that was damaged.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function curseOfDoom(actor) {
	if (!actor || Number(actor.system?.attributes?.hp?.value) !== 0) return;
	const curse = actor.effects.find((e) => e.name === "Curse of Doom" && !e.disabled);
	if (!curse || actor.statuses?.has("dead")) return;
	await MidiQOL.createEffects({
		actorUuid: actor.uuid,
		effects: [
			{
				name: "Curse of Doom [Slain]",
				img: curse.img,
				origin: curse.origin,
				statuses: ["dead"],
			},
		],
		options: { keepId: false },
	});
}

/**
 * Runs Pain Reflection automation at midi-qol.RollComplete: a creature cursed by
 * Pain Reflection takes psychic damage equal to half the damage it dealt to others.
 * For effects that damage several creatures, only the highest single amount counts.
 *
 * @param {*} workflow - midi-qol workflow.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function painReflection(workflow) {
	const actor = workflow.actor;
	const token = workflow.token;
	if (!actor || !token) return;
	if (!actor.effects.some((e) => e.name === "Pain Reflection (Curse)" && !e.disabled)) return;

	let highest = 0;
	for (const entry of workflow.damageList ?? []) {
		if (entry.actorUuid === actor.uuid || entry.targetUuid === token.document?.uuid) continue;
		const dealt = (entry.hpDamage ?? 0) + (entry.tempDamage ?? 0);
		if (dealt > highest) highest = dealt;
	}
	const reflected = Math.floor(highest / 2);
	if (reflected <= 0) return;

	const roll = await new Roll(`${reflected}`).evaluate();
	new MidiQOL.DamageOnlyWorkflow(actor, token, roll.total, "psychic", [token], roll, {
		flavor: "Pain Reflection",
	});
}
