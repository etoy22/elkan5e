import {
	conditionSources,
	createLightRegion,
	deleteEffects,
	drainedEffect,
	updateActorAsGM,
	withoutTokens,
} from "../shared/helpers.mjs";
import { computeDistance, damageOnly } from "../shared/midi-compat.mjs";

function tokenIdFromEntry(entry) {
	if (!entry) return null;
	if (typeof entry === "string") return entry;
	if (entry.document?.id) return entry.document.id;
	if (entry.id) return entry.id;
	if (entry.object?.document?.id) return entry.object.document.id;
	return null;
}

function buildIdSet(collection) {
	const ids = new Set();
	if (!collection) return ids;
	for (const entry of collection) {
		const id = tokenIdFromEntry(entry);
		if (id) ids.add(id);
	}
	return ids;
}

function resolveCanvasToken(entry) {
	const tokenId = tokenIdFromEntry(entry);
	if (!tokenId) return null;
	if (typeof entry === "string") return canvas.tokens.get(entry) ?? null;
	return entry.document?.object ?? entry.object ?? canvas.tokens.get(tokenId) ?? null;
}

/**
 * Runs Well Of Corruption spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function wellOfCorruption(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = workflow.token?.actor?.uuid;
	if (!caster || !casterToken || !casterUuid) {
		console.warn("Well of Corruption aborted: missing caster or casterToken");
		return;
	}

	const targetEntries = Array.from(workflow.targets ?? []);
	if (targetEntries.length === 0) {
		console.warn("Well of Corruption: No targets to affect");
		return;
	}

	const workflowCastLevel = Number(workflow.castData?.castLevel);
	const itemCastLevel = Number(workflow.item?.system?.level);
	const effectiveCastLevel = Math.max(
		Number.isFinite(workflowCastLevel)
			? workflowCastLevel
			: Number.isFinite(itemCastLevel)
				? itemCastLevel
				: 2,
		2,
	);
	const totalDice = 4 + Math.max(effectiveCastLevel - 2, 0) * 2;
	const damageRoll = await new Roll(`${totalDice}d8`).evaluate();

	const failedSaveIds = buildIdSet(workflow.failedSaves);
	const successfulSaveIds = buildIdSet(workflow.saves);

	for (const targetEntry of targetEntries) {
		const tokenId = tokenIdFromEntry(targetEntry);
		if (!tokenId) {
			console.warn("Well of Corruption: Unable to resolve target token ID", targetEntry);
			continue;
		}

		const targetToken = resolveCanvasToken(targetEntry);
		if (!targetToken) {
			console.warn(`Well of Corruption: Token with ID ${tokenId} not found on canvas`);
			continue;
		}

		const failedSave = failedSaveIds.has(tokenId);
		const saved = !failedSave && successfulSaveIds.has(tokenId);
		const damage = saved ? Math.floor(damageRoll.total / 2) : damageRoll.total;
		if (damage <= 0) continue;

		await drainedEffect(
			targetToken.actor,
			damage,
			"Well of Corruption",
			"icons/magic/unholy/orb-swirling-teal.webp",
			casterUuid,
			true,
		);
	}
}

/**
 * Runs Darkness spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function darkness(workflow) {
	const castLevel = Number(workflow.castData?.castLevel);
	const itemLevel = Number(workflow.item?.system?.level);
	const spellLevel = Number.isFinite(castLevel)
		? castLevel
		: Number.isFinite(itemLevel)
			? itemLevel
			: 2;

	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 0,
				bright: 15,
				alpha: 0.3,
				luminosity: 0.5,
				negative: true,
				animation: {
					type: "",
					speed: 2,
					intensity: 5,
				},
				priority: spellLevel - 1,
			},
			"Darkness",
		);
	}
}

/**
 * Runs Continual Flame spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function continualFlame(workflow) {
	const castLevel = Number(workflow.castData?.castLevel);
	const itemLevel = Number(workflow.item?.system?.level);
	const spellLevel = Number.isFinite(castLevel)
		? castLevel
		: Number.isFinite(itemLevel)
			? itemLevel
			: 2;

	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 60,
				bright: 30,
				alpha: 0.3,
				luminosity: 0.5,
				color: "#e25822",
				animation: {
					type: "torch",
					speed: 2,
					intensity: 5,
				},
				priority: spellLevel,
			},
			"Continual Flame",
		);
	}
}

/**
 * Runs Moon Beam spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function moonBeam(workflow) {
	const castLevel = Number(workflow.castData?.castLevel);
	const itemLevel = Number(workflow.item?.system?.level);
	const spellLevel = Number.isFinite(castLevel)
		? castLevel
		: Number.isFinite(itemLevel)
			? itemLevel
			: 2;

	for (const region of workflow.templateUuids ?? []) {
		await createLightRegion(
			region,
			{
				dim: 60,
				bright: 30,
				alpha: 0.3,
				luminosity: 0.5,
				color: "#587BA5",
				animation: {
					type: "starlight",
					speed: 2,
					intensity: 5,
				},
				priority: spellLevel,
			},
			"Moon Beam",
		);
	}
}

// Each Mirror Image duplicate is its own effect adding 1 to this flag (the same pattern as the
// dnd5e Mirror Image items), so duplicates are counted and destroyed one effect at a time.
const MIRROR_IMAGE_KEY = "flags.elkan5e.mirrorImages";

/**
 * Gets the active Mirror Image duplicate effects on an actor.
 *
 * @param {Actor} actor - Actor to check.
 * @returns {ActiveEffect[]}
 */
const getMirrorImageDuplicates = (actor) =>
	(actor?.effects ?? []).filter(
		(e) =>
			!e.disabled &&
			(e.system?.changes ?? e.changes ?? []).some((c) => c.key === MIRROR_IMAGE_KEY),
	);

/**
 * Finds the concentration effect maintaining an actor's Mirror Image.
 *
 * @param {Actor} actor - Actor that cast Mirror Image.
 * @returns {ActiveEffect|undefined}
 */
const getMirrorImageConcentration = (actor) =>
	[...(actor.concentration?.effects ?? [])].find((e) => {
		const data = e.getFlag("dnd5e", "item") ?? {};
		const identifier =
			actor.items.get(data.id)?.system.identifier ?? data.data?.system?.identifier;
		return identifier === "mirror-image";
	});

/**
 * Runs Mirror Image spell automation on midi-qol.AttackRollComplete (after midi checks hits, so
 * workflow.attackTotal and workflow.hitTargets are set). When the attack is redirected to a
 * duplicate, the real target is removed from the workflow so it takes no damage.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>}
 */
export async function mirrorImage(workflow) {
	try {
		// Only intercept direct targeted attacks — area effects are ignored by duplicates.
		if (workflow.template) return;
		if (!["mwak", "rwak", "msak", "rsak"].includes(workflow.activity?.actionType)) return;

		// Find the target with Mirror Image duplicates.
		const target = Array.from(workflow.targets ?? []).find(
			(t) => getMirrorImageDuplicates(t.actor ?? t.document?.actor).length,
		);
		if (!target) return;

		const actor = target.actor ?? target.document?.actor;
		const duplicateEffects = getMirrorImageDuplicates(actor);
		const duplicates = duplicateEffects.length;

		// Threshold based on remaining duplicates.
		const threshold = duplicates >= 3 ? 4 : duplicates === 2 ? 5 : 7;

		// Roll 1d12 to see if the attack hits a duplicate.
		const roll = await new Roll("1d12").evaluate();
		await roll.toMessage({
			flavor: `Mirror Image Check — need ${threshold}+ to hit a duplicate`,
			speaker: ChatMessage.getSpeaker({ token: target.document ?? target }),
		});

		// Below threshold → attack hits the real target, proceed normally.
		if (roll.total < threshold) return;

		// Attack redirected to a duplicate — check against the duplicate's AC 15.
		const attackTotal = workflow.attackTotal ?? workflow.attackRoll?.total ?? 0;
		const hitsDuplicate = attackTotal >= 15;
		const speakerToken = target.document ?? target;

		if (hitsDuplicate) {
			const newCount = duplicates - 1;
			// deleteEffects relays to the GM, since the attacker usually doesn't own the target.
			if (newCount <= 0) {
				// The last duplicate ends the spell, so end its concentration as well.
				const concentration = getMirrorImageConcentration(actor);
				await deleteEffects(actor, [duplicateEffects[0], concentration].filter(Boolean));
				await ChatMessage.create({
					content: `<p><strong>${actor.name}'s</strong> final Mirror Image duplicate was destroyed — the spell ends!</p>`,
					speaker: ChatMessage.getSpeaker({ token: speakerToken }),
				});
			} else {
				await deleteEffects(actor, [duplicateEffects[0]]);
				await ChatMessage.create({
					content: `<p>A <strong>Mirror Image</strong> duplicate of ${actor.name} was destroyed! <em>${newCount} duplicate${newCount === 1 ? "" : "s"} remain.</em></p>`,
					speaker: ChatMessage.getSpeaker({ token: speakerToken }),
				});
			}
		} else {
			await ChatMessage.create({
				content: `<p>An attack targeted a <strong>Mirror Image</strong> duplicate of ${actor.name} but missed! (AC 15)</p>`,
				speaker: ChatMessage.getSpeaker({ token: speakerToken }),
			});
		}

		// Remove the real target from the workflow so damage is never applied,
		// without aborting the whole roll (which would delete the attack roll card).
		// Midi has already checked hits by AttackRollComplete, so the hit sets need it too.
		// Midi-QOL rebuilds these sets from stored uuids on every read, so assign filtered sets.
		for (const key of ["targets", "hitTargets", "hitTargetsEC"]) {
			if (workflow[key]) workflow[key] = withoutTokens(workflow[key], [target]);
		}
	} catch (err) {
		console.error("Mirror Image |", err);
	}
}

/**
 * Runs Lesser Restoration spell automation.
 * Presents a dialog showing which removable conditions the target currently has,
 * lets the caster pick one, then removes it.
 *
 * Removable conditions: blinded, deafened, paralyzed, poisoned, weakened.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function lesserRestoration(workflow) {
	try {
		const targetEntry = Array.from(workflow.targets ?? [])[0];
		if (!targetEntry) {
			ui.notifications.warn("Lesser Restoration: No target selected.");
			return;
		}

		const actor = targetEntry.actor ?? targetEntry.document?.actor;
		if (!actor) {
			ui.notifications.warn("Lesser Restoration: Could not resolve target actor.");
			return;
		}

		const REMOVABLE = [
			{ id: "blinded", label: "Blinded" },
			{ id: "deafened", label: "Deafened" },
			{ id: "paralyzed", label: "Paralyzed" },
			{ id: "poisoned", label: "Poisoned" },
			{ id: "weakened", label: "Weakened" },
		];

		const present = REMOVABLE.filter(
			(c) =>
				actor.statuses.has(c.id) ||
				actor.effects.some((e) => !e.disabled && e.statuses.has(c.id)),
		);

		if (present.length === 0) {
			ui.notifications.info(
				`${actor.name} has none of the conditions Lesser Restoration can remove.`,
			);
			return;
		}

		// Build one button per present condition, plus Cancel.
		const chosen = await foundry.applications.api.DialogV2.wait({
			window: { title: "Lesser Restoration" },
			content: `<p>Which condition on <strong>${actor.name}</strong> do you want to remove?</p>`,
			buttons: [
				...present.map((cond) => ({ label: cond.label, action: cond.id })),
				{ label: "Cancel", action: "cancel" },
			],
			default: present[0].id,
			rejectClose: false,
		});

		if (!chosen || chosen === "cancel") return;

		// Remove every active effect that carries this status (handles stacked effects).
		const toDelete = conditionSources(actor, [chosen]).map((e) => e.id);
		if (toDelete.length) await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);

		const label = REMOVABLE.find((c) => c.id === chosen)?.label ?? chosen;
		await ChatMessage.create({
			content: `<p><strong>Lesser Restoration</strong> removes the <em>${label}</em> condition from <strong>${actor.name}</strong>.</p>`,
			speaker: ChatMessage.getSpeaker({ actor: workflow.actor }),
		});
	} catch (err) {
		console.error("Lesser Restoration |", err);
	}
}

/**
 * Pairs the two Active Effects created by a single Spirit Link casting using the dnd5e
 * `dependentOn` flag, so deleting one (separation, death, dismissal) cascades to the other.
 *
 * @param {ActiveEffect5e} effect - Newly-created active effect.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function spiritLinkPair(effect) {
	// createActiveEffect fires on every client; only the active GM pairs (and can set both flags).
	if (!game.users.activeGM?.isSelf) return;
	if (effect?.name !== "Spirit Link") return;
	if (effect.getFlag("dnd5e", "dependentOn")) return;

	// Include unlinked token actors, which aren't in game.actors.
	const actors = new Set(game.actors.contents);
	for (const token of canvas?.tokens?.placeables ?? []) if (token.actor) actors.add(token.actor);
	const partner = [...actors]
		.flatMap((actor) => actor.appliedEffects)
		.find(
			(candidate) =>
				candidate.id !== effect.id &&
				candidate.name === "Spirit Link" &&
				candidate.origin === effect.origin &&
				!candidate.getFlag("dnd5e", "dependentOn"),
		);
	if (!partner) return;

	await partner.setFlag("dnd5e", "dependentOn", effect.uuid);
	await effect.setFlag("dnd5e", "dependentOn", partner.uuid);
}

/**
 * Runs Spirit Link spell automation on actor HP changes: mirrors half the damage taken to
 * the linked partner (the caster's own effect grants resistance to all damage, so the HP
 * already lost here is exactly the other half). Ends the bond if either linked creature
 * drops to 0 HP or the two become separated by more than 60 feet.
 *
 * @param {Actor5e} actor - Actor about to be updated.
 * @param {object} updates - Pending update diff.
 * @param {object} options - Update options.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function spiritLinkUpdate(actor, updates, options) {
	// Shared damage is applied with this option so it isn't shared back.
	if (options.onUpdateCalled || options.elkan5eSpiritLink) return;
	const newHp = foundry.utils.getProperty(updates, "system.attributes.hp.value");
	if (newHp === undefined) return;

	const thisEffect = actor.appliedEffects.find((candidate) => candidate.name === "Spirit Link");
	if (!thisEffect) return;

	const partnerUuid = thisEffect.getFlag("dnd5e", "dependentOn");
	const partnerEffect = partnerUuid ? fromUuidSync(partnerUuid) : null;
	const partnerActor = partnerEffect?.parent;
	if (!partnerActor) return;

	const thisToken = actor.getActiveTokens()[0];
	const partnerToken = partnerActor.getActiveTokens()[0];

	if (thisToken && partnerToken) {
		const distance = computeDistance(thisToken, partnerToken);
		if (distance > 60) {
			await ChatMessage.create({
				content: `Spirit Link ends — ${actor.name} and ${partnerActor.name} are more than 60 feet apart (${distance} ft).`,
			});
			await thisEffect.delete();
			return;
		}
	}

	const oldHp = actor.system.attributes.hp.value;
	if (newHp <= 0) {
		await thisEffect.delete();
		return;
	}
	if (newHp < oldHp && partnerToken) {
		const damage = oldHp - newHp;
		await ChatMessage.create({
			content: `Spirit Link: ${damage} damage is shared from ${actor.name} to ${partnerActor.name}.`,
		});
		// The partner's half can't be reduced, so it skips resistances and goes straight to hit points.
		const hp = partnerActor.system.attributes.hp;
		const fromTemp = Math.min(hp.temp ?? 0, damage);
		const partnerHp = Math.max(hp.value - (damage - fromTemp), 0);
		await updateActorAsGM(
			partnerActor,
			{
				"system.attributes.hp.temp": (hp.temp ?? 0) - fromTemp,
				"system.attributes.hp.value": partnerHp,
			},
			{ elkan5eSpiritLink: true },
		);
		if (partnerHp <= 0) await thisEffect.delete();
	}
}

/**
 * Runs Shatter spell automation (midi-qol preTargetSave): constructs have disadvantage on the
 * Constitution saving throw. Midi rolls each target's save from the saveDetails it passes here.
 *
 * @param {Token} target - Target about to roll its save.
 * @param {*} workflow - Midi-QOL workflow for the Shatter cast.
 * @param {object} saveDetails - Midi-QOL save request for this target.
 */
export function shatter(target, workflow, saveDetails) {
	if (workflow.item?.system.identifier !== "shatter") return;
	if (target.actor?.system.details.type?.value === "construct") saveDetails.disadvantage = true;
}

const SPIKE_GROWTH_BEHAVIOR = "Spike Growth — Movement Damage";

/**
 * Runs Spike Growth automation after it's cast: gives its area a script behavior that deals
 * 2d4 piercing damage for every 5 ft. a creature moves inside it.
 *
 * @param {*} workflow - Midi-QOL workflow of the cast.
 * @returns {Promise<void>}
 */
export async function spikeGrowth(workflow) {
	for (const ref of workflow.templateUuids ?? []) {
		const region = typeof ref === "string" ? await fromUuid(ref).catch(() => null) : ref;
		if (!region || region.behaviors.some((b) => b.name === SPIKE_GROWTH_BEHAVIOR)) continue;
		await region.createEmbeddedDocuments("RegionBehavior", [
			{
				name: SPIKE_GROWTH_BEHAVIOR,
				type: "executeScript",
				system: {
					events: ["tokenMoveWithin"],
					source: "await elkan5e.macros.spells.spikeGrowthMove(event, region);",
				},
			},
		]);
	}
}

/**
 * Deals Spike Growth's damage for one stretch of movement inside its area. Foundry splits a move
 * where it crosses the area's edge, so this stretch is only the part inside. Teleporting doesn't
 * count. Runs on the active GM.
 *
 * @param {RegionEvent} event - The region's tokenMoveWithin event.
 * @returns {Promise<void>}
 */
export async function spikeGrowthMove(event) {
	if (!game.users.activeGM?.isSelf) return;
	const { token, movement } = event.data ?? {};
	const actor = token?.actor;
	const waypoints = movement?.passed?.waypoints ?? [];
	if (!actor || !waypoints.length || waypoints.every((w) => w.action === "blink")) return;

	const feet = canvas.grid.measurePath([movement.origin, ...waypoints]).distance;
	const dice = Math.floor(feet / 5) * 2;
	if (dice <= 0) return;
	const roll = await new Roll(`${dice}d4`).evaluate();
	const flavor = `Spike Growth — ${dice}d4 piercing (${Math.floor(feet / 5) * 5} ft. through spikes)`;
	await damageOnly(actor, token.object, roll.total, "piercing", [token.object ?? token], roll, {
		flavor,
	});
}
