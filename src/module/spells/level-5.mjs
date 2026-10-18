import {
	drainedEffect,
	forEachDamagedTarget,
	removeStatuses,
	restoreDrainedMaxHP,
} from "../shared/helpers.mjs";

/**
 * Runs Greater Restoration spell automation.
 * Automatically removes all listed conditions from the target, removes one level
 * of exhaustion, and removes the diseased condition.
 *
 * Conditions removed: blinded, dazed, deafened, drained, paralyzed, stunned, poisoned, weakened.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function greaterRestoration(workflow) {
	try {
		const targetEntry = Array.from(workflow.targets ?? [])[0];
		if (!targetEntry) {
			ui.notifications.warn("Greater Restoration: No target selected.");
			return;
		}

		const actor = targetEntry.actor ?? targetEntry.document?.actor;
		if (!actor) {
			ui.notifications.warn("Greater Restoration: Could not resolve target actor.");
			return;
		}

		const CONDITION_IDS = [
			"blinded",
			"dazed",
			"deafened",
			"drained",
			"paralyzed",
			"stunned",
			"poisoned",
			"weakened",
			"diseased",
		];

		const removed = [];

		// Collect all active-effect IDs that carry any of the target statuses.
		const effectIdsToDelete = actor.effects
			.filter((e) => !e.disabled && CONDITION_IDS.some((id) => e.statuses.has(id)))
			.map((e) => e.id);

		if (effectIdsToDelete.length) {
			// Track which condition labels were actually present for the chat message.
			for (const condId of CONDITION_IDS) {
				if (
					actor.statuses.has(condId) ||
					actor.effects.some((e) => !e.disabled && e.statuses.has(condId))
				) {
					removed.push(
						condId === "diseased"
							? "disease"
							: condId.charAt(0).toUpperCase() + condId.slice(1),
					);
				}
			}
			await actor.deleteEmbeddedDocuments("ActiveEffect", effectIdsToDelete);
		}

		// Drain lowers temporary max HP rather than coming from an effect.
		if ((await restoreDrainedMaxHP(actor)) && !removed.includes("Drained"))
			removed.push("Drained");

		// Remove one level of exhaustion.
		const currentExhaustion = actor.system.attributes?.exhaustion ?? 0;
		if (currentExhaustion > 0) {
			await actor.update({ "system.attributes.exhaustion": currentExhaustion - 1 });
			removed.push("one level of Exhaustion");
		}

		if (removed.length === 0) {
			ui.notifications.info(
				`${actor.name} has no conditions or exhaustion that Greater Restoration can remove.`,
			);
			return;
		}

		await ChatMessage.create({
			content: `<p><strong>Greater Restoration</strong> removes the following from <strong>${actor.name}</strong>: <em>${removed.join(", ")}</em>.</p>`,
			speaker: ChatMessage.getSpeaker({ actor: workflow.actor }),
		});
	} catch (err) {
		console.error("Greater Restoration |", err);
	}
}

/**
 * Runs enervate spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function enervate(workflow) {
	const casterUuid = workflow.token.actor.uuid;
	await forEachDamagedTarget(workflow, (targetToken, damage) =>
		drainedEffect(
			targetToken.actor,
			damage,
			"Enervate",
			"icons/magic/death/skeleton-skull-soul-blue.webp",
			casterUuid,
		),
	);
}

/**
 * Runs enervate Ongoing spell automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function enervateOngoing(workflow) {
	const casterUuid = workflow.token.actor.uuid;
	await forEachDamagedTarget(workflow, (targetToken, damage) =>
		drainedEffect(
			targetToken.actor,
			damage,
			"Enervate",
			"icons/magic/death/skeleton-skull-soul-blue.webp",
			casterUuid,
		),
	);
}

/**
 * Runs Break Enchantment spell automation.
 * The caster chooses to end either all of the listed conditions or all curses on the target.
 * Removing a possessing creature is left to the GM.
 *
 * Conditions removed: charmed, confused, frightened, goaded, petrified, silenced, siphoned.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function breakEnchantment(workflow) {
	try {
		const targetEntry = Array.from(workflow.targets ?? [])[0];
		const actor = targetEntry?.actor ?? targetEntry?.document?.actor;
		if (!actor) {
			ui.notifications.warn("Break Enchantment: No target selected.");
			return;
		}

		const CONDITIONS = [
			"charmed",
			"confused",
			"frightened",
			"goaded",
			"petrified",
			"silenced",
			"siphoned",
		];
		const has = (ids) =>
			actor.effects.some((e) => !e.disabled && ids.some((id) => e.statuses?.has(id)));
		const options = [];
		if (has(CONDITIONS)) options.push({ label: "Conditions", action: "conditions" });
		if (has(["cursed"])) options.push({ label: "Curses", action: "curses" });

		if (!options.length) {
			ui.notifications.info(`${actor.name} has nothing Break Enchantment can remove.`);
			return;
		}

		const chosen = await foundry.applications.api.DialogV2.wait({
			window: { title: "Break Enchantment" },
			content: `<p>What do you want to remove from <strong>${actor.name}</strong>?</p>`,
			buttons: [...options, { label: "Cancel", action: "cancel" }],
			default: options[0].action,
			rejectClose: false,
		});

		if (chosen === "conditions") await removeStatuses(actor, CONDITIONS);
		else if (chosen === "curses") await removeStatuses(actor, ["cursed"]);
	} catch (err) {
		console.error("Break Enchantment |", err);
	}
}
