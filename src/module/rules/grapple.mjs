import { chooseDefenderSkill, sizeIndex } from "../global.mjs";

const imgForCondition = (key) => `modules/elkan5e/icons/conditions/${key}.svg`;
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));
const DEAD_PROMPT_FLAG = "grappleDeadPrompted";
const PUSH_TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const normalizeStatus = (value) =>
	String(value ?? "")
		.trim()
		.toLowerCase();
const statusMatches = (candidate, wanted) => {
	const cand = normalizeStatus(candidate);
	const want = normalizeStatus(wanted);
	return cand === want || cand.endsWith(`.${want}`);
};

/**
 * Applies handle Grappler Move rule behavior.
 *
 * @param {*} tokenDoc - Token document or placeable token.
 * @param {*} changes - Update payload containing changed fields.
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function handleGrapplerMove(tokenDoc, changes) {
	if (!game.user?.isGM) return;
	if (!canvas?.tokens) return;
	if (changes?.x == null && changes?.y == null) return;
	if (DRAG_IGNORE.has(tokenDoc.id)) return;

	const actor = tokenDoc?.actor;
	if (!actor) return;

	const grapplerUuid = actor.uuid;
	const grid = canvas.grid?.size ?? 1;
	const newX = changes?.x ?? tokenDoc.x;
	const newY = changes?.y ?? tokenDoc.y;
	const dx = newX - tokenDoc.x;
	const dy = newY - tokenDoc.y;
	const center = {
		x: newX + (tokenDoc.width * grid) / 2,
		y: newY + (tokenDoc.height * grid) / 2,
	};

	for (const targetToken of canvas.tokens.placeables) {
		const targetActor = targetToken?.actor;
		if (!targetActor) continue;
		const effects = targetActor.effects.filter((e) => {
			const g = e?.flags?.elkan5e?.grapple;
			return g?.grapplerUuid === grapplerUuid;
		});
		if (!effects.length) continue;
		for (const effect of effects) {
			const sizeDiff = Number(effect?.flags?.elkan5e?.grapple?.sizeDiff ?? 0);
			// If grappler is larger, target movement is resolved in the drag section below.
			if (sizeDiff > 0) continue;
			const storedRange = Number(effect?.flags?.elkan5e?.grapple?.range);
			const reach = Number(tokenDoc?.actor?.system?.attributes?.reach);
			const range =
				Number.isFinite(storedRange) && storedRange > 0
					? storedRange
					: Number.isFinite(reach) && reach > 0
						? reach
						: 5;
			const distance = measureTokenDistance(
				tokenDoc,
				newX,
				newY,
				targetToken.document,
				targetToken.document.x,
				targetToken.document.y,
			);
			if (distance <= range) continue;
			try {
				await effect.delete();
				await removeClimberEffect(actor, targetActor);
			} catch (error) {
				console.warn("Elkan 5e | Failed to end grapple on movement", error);
			}
		}
	}

	// Ease-of-play: if a grappled creature moves away, end the grapple.
	const grappledEffects = actor.effects.filter((e) => e?.flags?.elkan5e?.grapple?.grapplerUuid);
	for (const effect of grappledEffects) {
		const grapplerActor = await fromUuid(effect.flags.elkan5e.grapple.grapplerUuid);
		const grapplerToken = grapplerActor?.getActiveTokens?.()[0] ?? null;
		if (!grapplerToken) continue;
		const sizeDiff = Number(effect.flags.elkan5e.grapple.sizeDiff ?? 0);
		const storedRange = Number(effect.flags.elkan5e.grapple.range);
		const reach = Number(grapplerActor?.system?.attributes?.reach);
		const range =
			Number.isFinite(storedRange) && storedRange > 0
				? storedRange
				: Number.isFinite(reach) && reach > 0
					? reach
					: 5;
		const distance = measureTokenDistance(
			tokenDoc,
			newX,
			newY,
			grapplerToken.document,
			grapplerToken.document.x,
			grapplerToken.document.y,
		);
		let movedTogether = false;
		if ((dx !== 0 || dy !== 0) && sizeDiff <= -1 && distance > range) {
			DRAG_IGNORE.add(grapplerToken.id);
			const pos = getFirstFullSpacePosition(grapplerToken.document, dx, dy);
			await grapplerToken.document.update(pos);
			setTimeout(() => DRAG_IGNORE.delete(grapplerToken.id), 0);
			movedTogether = true;
		}
		// If the larger grappled creature moved and the smaller grappler was moved with it,
		// do not end the grapple on range in this update.
		if (movedTogether) continue;
		if (distance > range) {
			try {
				await effect.delete();
				await removeClimberEffect(grapplerActor, actor);
			} catch (error) {
				console.warn("Elkan 5e | Failed to end grapple on grappled movement", error);
			}
		}
	}

	// Drag smaller creature when grappler is 1+ sizes larger.
	if (dx !== 0 || dy !== 0) {
		for (const targetToken of canvas.tokens.placeables) {
			const targetActor = targetToken?.actor;
			if (!targetActor) continue;
			const effects = targetActor.effects.filter((e) => {
				const g = e?.flags?.elkan5e?.grapple;
				return g?.grapplerUuid === grapplerUuid && g?.sizeDiff >= 1;
			});
			if (!effects.length) continue;
			const storedRange = Number(effects[0]?.flags?.elkan5e?.grapple?.range);
			const reach = Number(actor?.system?.attributes?.reach);
			const range =
				Number.isFinite(storedRange) && storedRange > 0
					? storedRange
					: Number.isFinite(reach) && reach > 0
						? reach
						: 5;
			const distance = measureTokenDistance(
				tokenDoc,
				newX,
				newY,
				targetToken.document,
				targetToken.document.x,
				targetToken.document.y,
			);
			// If movement keeps the pair within grapple range, do not force-move the other token.
			if (distance <= range) continue;
			DRAG_IGNORE.add(targetToken.id);
			const pos = getFirstFullSpacePosition(targetToken.document, dx, dy);
			await targetToken.document.update(pos);
			setTimeout(() => DRAG_IGNORE.delete(targetToken.id), 0);
		}
	}
}

/**
 * Applies end All Grapples For Actor rule behavior.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function endAllGrapplesForActor(actor) {
	if (!actor || !canvas?.tokens?.placeables) return;

	// Actor is grappled by someone else.
	const grappledEffects = actor.effects.filter((e) => e?.flags?.elkan5e?.grapple?.grapplerUuid);
	for (const effect of grappledEffects) {
		const grapplerActor = await fromUuid(effect.flags.elkan5e.grapple.grapplerUuid);
		try {
			await effect.delete();
			await removeClimberEffect(grapplerActor, actor);
		} catch (error) {
			console.warn("Elkan 5e | Failed to clear grappled effect", error);
		}
	}

	// Actor is grappling others.
	for (const targetToken of canvas.tokens.placeables) {
		const targetActor = targetToken?.actor;
		if (!targetActor) continue;
		const effects = targetActor.effects.filter(
			(e) =>
				e?.flags?.elkan5e?.grapple?.grapplerUuid === actor.uuid && hasStatus(e, "grappled"),
		);
		if (!effects.length) continue;
		for (const effect of effects) {
			try {
				await effect.delete();
			} catch (error) {
				console.warn("Elkan 5e | Failed to clear grappler effect", error);
			}
		}
		await removeClimberEffect(actor, targetActor);
	}

	// Cleanup any remaining climber effects on this actor.
	const ownClimberEffects = actor.effects.filter(
		(e) => e?.flags?.elkan5e?.grapple?.type === "climber-adv",
	);
	for (const effect of ownClimberEffects) {
		try {
			await effect.delete();
		} catch (error) {
			console.warn("Elkan 5e | Failed to clear climber effect", error);
		}
	}
}

/**
 * Applies handle Pushed Effect rule behavior.
 *
 * @param {*} effect - Active effect being handled.
 * @param {*} changes - Update payload containing changed fields.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function handlePushedEffect(effect, changes = {}) {
	if (!game.user?.isGM) return;
	if (!effect?.parent) return;
	const actor = effect.parent;
	if (actor.documentName !== "Actor") return;
	if (!isPushedEffect(effect, changes)) return;
	await endAllGrapplesForActor(actor);
}

/**
 * Applies handle Dead Grapple Prompt rule behavior.
 *
 * @param {*} actor - Actor document to process.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function handleDeadGrapplePrompt(actor) {
	if (!game.user?.isGM || !actor) return;

	const dead = isActorDead(actor);
	const prompted = Boolean(actor.getFlag("elkan5e", DEAD_PROMPT_FLAG));

	if (!dead) {
		if (prompted) await actor.unsetFlag("elkan5e", DEAD_PROMPT_FLAG);
		return;
	}
	if (prompted) return;

	const links = await getGrappleLinks(actor);
	if (!links.length) return;

	const shouldRelease = await promptDeadUngrapple(actor, links);
	if (shouldRelease) {
		for (const { effect, grappler, grappled } of links) {
			try {
				if (!effect?.deleted) await effect.delete();
				await removeClimberEffect(grappler, grappled);
			} catch (error) {
				console.warn("Elkan 5e | Failed to clear dead-creature grapple", error);
			}
		}
	}

	await actor.setFlag("elkan5e", DEAD_PROMPT_FLAG, true);
}

/**
 * Applies grapple rule behavior.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @param {*} acr - Acr.
 * @param {*} skipRoll - Skip Roll.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function grapple(workflow, acr = false, skipRoll = false) {
	if (!workflow?.actor) return;
	const token = workflow.token ?? MidiQOL.tokenForActor(workflow.actor);
	if (!token) {
		ui.notifications.warn(
			t("elkan5e.grapple.notifications.noToken", { name: workflow.actor.name }),
		);
		return;
	}
	if (!workflow.targets || workflow.targets.size === 0) {
		console.warn("Grapple requires at least one target");
		return;
	}

	const grappler = workflow.actor;
	const grapplerSkillKey = acr ? "acr" : "ath";
	const grapplerSize = sizeIndex(grappler);
	const flavor = workflow.item?.name ?? t("elkan5e.grapple.name");
	const range = getGrappleRange(workflow);
	const icon = workflow.item?.img ?? imgForCondition("grappled");

	const activeGrapples = getActiveGrapples(grappler);
	const releaseIndexes = await chooseGrapplesToRelease(grappler, activeGrapples);
	if (releaseIndexes.length) {
		for (const idx of releaseIndexes) {
			const entry = activeGrapples[idx];
			if (!entry) continue;
			for (const effect of entry.effects) {
				try {
					await effect.delete();
				} catch (error) {
					console.warn("Elkan 5e | Failed to release grapple", error);
				}
			}
			await removeClimberEffect(grappler, entry.actor);
		}
	}

	const applyGrapple = async (_sourceToken, targetToken, sizeDiff, grappleRange) => {
		const targetActor = targetToken?.actor;
		if (!targetActor) return;
		const sourceItemUuid = workflow.item?.uuid ?? null;
		const existing = targetActor.effects.find(
			(e) =>
				(e?.flags?.elkan5e?.grapple?.grapplerUuid === grappler.uuid ||
					e?.origin === grappler.uuid ||
					(sourceItemUuid && e?.origin === sourceItemUuid)) &&
				isGrappledEffect(e),
		);
		await applyElkanGrapple({
			grappler,
			targetActor,
			targetToken,
			sizeDiff,
			grappleRange,
			icon,
			existingEffect: existing ?? null,
		});
	};

	const resolvedTargets =
		skipRoll && workflow?.hitTargets?.size ? workflow.hitTargets : workflow.targets;
	for (const targetToken of resolvedTargets) {
		const targetActor = targetToken?.actor;
		if (!targetActor) continue;

		const targetSkill = chooseDefenderSkill(targetActor);
		const targetSize = sizeIndex(targetActor);
		const sizeDiff = grapplerSize - targetSize;
		if (skipRoll) {
			await applyGrapple(token, targetToken, sizeDiff, range);
			continue;
		}

		const grapplerAdv = grapplerSize > targetSize;
		const targetAdv = targetSize > grapplerSize;

		console.log("Elkan 5e | grapple contestedRoll", {
			grappler: grappler.name,
			target: targetActor.name,
			grapplerSize,
			targetSize,
			sizeDiff,
			grapplerAdv,
			targetAdv,
			sourceAbility: grapplerSkillKey,
			targetAbility: targetSkill,
		});

		await MidiQOL.contestedRoll({
			source: {
				token,
				rollType: "skill",
				ability: grapplerSkillKey,
				rollOptions: { advantage: grapplerAdv },
			},
			target: {
				token: targetToken,
				rollType: "skill",
				ability: targetSkill,
				rollOptions: { advantage: targetAdv },
			},
			flavor,
			success: applyGrapple.bind(null, token, targetToken, sizeDiff, range),
			displayResults: true,
			itemCardId: workflow.itemCardId,
			rollOptions: { fastForward: false, chatMessage: true, rollMode: "publicroll" },
		});
	}
}
