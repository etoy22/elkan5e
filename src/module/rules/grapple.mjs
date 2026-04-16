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
 * Check whether an ActiveEffect includes a given status id.
 * @param {ActiveEffect} effect
 * @param {string} statusId
 * @returns {boolean}
 */
const hasStatus = (effect, statusId) => {
	const statuses = effect?.statuses;
	if (!statuses) return false;
	if (typeof statuses.has === "function") {
		if (statuses.has(statusId)) return true;
		return [...statuses].some((entry) => statusMatches(entry, statusId));
	}
	if (Array.isArray(statuses)) return statuses.some((entry) => statusMatches(entry, statusId));
	return false;
};

const isGrappledEffect = (effect) => {
	if (hasStatus(effect, "grappled")) return true;
	if (statusMatches(effect?.flags?.core?.statusId, "grappled")) return true;
	const localized = normalizeStatus(game.i18n.localize("elkan5e.conditions.grappled"));
	const name = normalizeStatus(effect?.name);
	return Boolean(name) && (name === "grappled" || (localized && name === localized));
};

const isTruthy = (value) => {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	return PUSH_TRUE_VALUES.has(
		String(value ?? "")
			.trim()
			.toLowerCase(),
	);
};

const hasTruthyChange = (effect, key) =>
	(effect?.changes ?? []).some((change) => change?.key === key && isTruthy(change?.value));

const isPushedEffect = (effect, changes = {}) => {
	if (!effect) return false;
	if (effect?.flags?.elkan5e?.push?.pushed === true) return true;
	if (hasTruthyChange(effect, "flags.elkan5e.push.pushed")) return true;
	if (hasTruthyChange(effect, "flags.elkan5e.pushed")) return true;
	if (hasTruthyChange(effect, "flags.midi-qol.pushed")) return true;

	const incomingPushFlag =
		changes?.["flags.elkan5e.push.pushed"] ??
		changes?.flags?.elkan5e?.push?.pushed ??
		changes?.["flags.elkan5e.pushed"] ??
		changes?.flags?.elkan5e?.pushed ??
		changes?.["flags.midi-qol.pushed"] ??
		changes?.flags?.["midi-qol"]?.pushed;
	if (incomingPushFlag != null && isTruthy(incomingPushFlag)) return true;

	const pushedName = t("elkan5e.push.effects.pushed").toLowerCase();
	const name = String(effect?.name ?? "")
		.trim()
		.toLowerCase();
	return Boolean(name) && (name === "pushed" || name === pushedName);
};

/**
 * Clone the condition changes for a DND5E condition type.
 * @param {string} key
 * @returns {Array<object>}
 */
const getConditionChanges = (key) => {
	const cond = CONFIG.DND5E?.conditionTypes?.[key];
	return cond?.changes ? foundry.utils.duplicate(cond.changes) : [];
};

const DRAG_IGNORE = new Set();

/**
 * Get an actor's climb speed (0 if missing).
 * @param {Actor} actor
 * @returns {number}
 */
const getClimbSpeed = (actor) => Number(actor?.system?.attributes?.movement?.climb ?? 0);

/**
 * Remove the temporary climber advantage effect from the grappler.
 * @param {Actor} grapplerActor
 * @param {Actor} grappledActor
 * @returns {Promise<void>}
 */
const removeClimberEffect = async (grapplerActor, grappledActor) => {
	if (!grapplerActor || !grappledActor) return;
	const effect = grapplerActor.effects.find(
		(e) =>
			e?.flags?.elkan5e?.grapple?.type === "climber-adv" &&
			e?.flags?.elkan5e?.grapple?.targetUuid === grappledActor.uuid,
	);
	if (!effect) return;
	try {
		await effect.delete();
	} catch (error) {
		console.warn("Elkan 5e | Failed to remove climber advantage effect", error);
	}
};

/**
 * Check whether an actor is currently dead.
 * @param {Actor} actor
 * @returns {boolean}
 */
const isActorDead = (actor) => {
	if (!actor) return false;
	const defeatedId = CONFIG.specialStatusEffects?.DEFEATED ?? "defeated";
	if (
		typeof actor.statuses?.has === "function" &&
		(actor.statuses.has("dead") || actor.statuses.has(defeatedId))
	) {
		return true;
	}
	if (actor.effects.some((e) => hasStatus(e, "dead") || hasStatus(e, defeatedId))) return true;
	const hp = Number(actor.system?.attributes?.hp?.value);
	return Number.isFinite(hp) && hp <= 0;
};

/**
 * Collect grapple links involving an actor.
 * @param {Actor} actor
 * @returns {Promise<Array<{effect: ActiveEffect, grappler: Actor, grappled: Actor}>>}
 */
const getGrappleLinks = async (actor) => {
	const links = [];
	if (!actor || !canvas?.tokens?.placeables) return links;

	// Actor is grappled by others.
	const grappledEffects = actor.effects.filter((e) => e?.flags?.elkan5e?.grapple?.grapplerUuid);
	for (const effect of grappledEffects) {
		const grappler = await fromUuid(effect.flags.elkan5e.grapple.grapplerUuid);
		if (!grappler) continue;
		links.push({ effect, grappler, grappled: actor });
	}

	// Actor is grappling others.
	for (const token of canvas.tokens.placeables) {
		const targetActor = token?.actor;
		if (!targetActor) continue;
		const effects = targetActor.effects.filter(
			(e) =>
				e?.flags?.elkan5e?.grapple?.grapplerUuid === actor.uuid && hasStatus(e, "grappled"),
		);
		for (const effect of effects) {
			links.push({ effect, grappler: actor, grappled: targetActor });
		}
	}

	return links;
};

/**
 * Prompt whether to clear grapples involving a dead creature.
 * @param {Actor} deadActor
 * @param {Array<{effect: ActiveEffect, grappler: Actor, grappled: Actor}>} links
 * @returns {Promise<boolean>}
 */
const promptDeadUngrapple = async (deadActor, links) => {
	if (!deadActor || !links?.length) return false;
	const partners = [
		...new Set(
			links
				.map((link) =>
					link.grappler?.uuid === deadActor.uuid
						? link.grappled?.name
						: link.grappler?.name,
				)
				.filter(Boolean),
		),
	];
	const DialogV2 = foundry.applications.api.DialogV2;
	return new Promise((resolve) => {
		const partnerList = partners
			.map((name) => `<li>${foundry.utils.escapeHTML(name)}</li>`)
			.join("");
		new DialogV2({
			window: { title: t("elkan5e.grapple.deadDialog.title") },
			content: `
				<form>
					<p>${t("elkan5e.grapple.deadDialog.prompt", { name: deadActor.name })}</p>
					${partners.length ? `<p>${t("elkan5e.grapple.deadDialog.partners")}</p><ul>${partnerList}</ul>` : ""}
				</form>
			`,
			buttons: [
				{
					action: "release",
					label: t("elkan5e.grapple.deadDialog.release"),
					callback: () => resolve(true),
				},
				{
					action: "keep",
					label: t("elkan5e.grapple.deadDialog.keep"),
					callback: () => resolve(false),
				},
			],
			default: "release",
		}).render(true);
	});
};

/**
 * Collect all active grapple effects created by the grappler on scene tokens.
 * @param {Actor} grapplerActor
 * @returns {Array<{token: Token, actor: Actor, effects: ActiveEffect[]}>}
 */
const getActiveGrapples = (grapplerActor) => {
	if (!canvas?.tokens?.placeables || !grapplerActor) return [];
	const grapples = [];
	for (const token of canvas.tokens.placeables) {
		const actor = token?.actor;
		if (!actor) continue;
		const effects = actor.effects.filter(
			(e) =>
				hasStatus(e, "grappled") &&
				(e?.flags?.elkan5e?.grapple?.grapplerUuid === grapplerActor.uuid ||
					e?.origin === grapplerActor.uuid),
		);
		if (!effects.length) continue;
		grapples.push({ token, actor, effects });
	}
	return grapples;
};

/**
 * Prompt the grappler to select which existing grapples to release.
 * @param {Actor} grapplerActor
 * @param {Array<{token: Token, actor: Actor, effects: ActiveEffect[]}>} active
 * @returns {Promise<number[]>}
 */
const chooseGrapplesToRelease = async (grapplerActor, active) => {
	if (!active?.length) return [];
	if (!grapplerActor?.isOwner && !game.user?.isGM) return [];
	const DialogV2 = foundry.applications.api.DialogV2;
	return new Promise((resolve) => {
		const options = active
			.map(
				(g, idx) => `
					<div class="form-group">
						<label>
							<input type="checkbox" name="release" value="${idx}">
							${g.actor?.name ?? t("elkan5e.grapple.releaseDialog.target", { index: idx + 1 })}
						</label>
					</div>
				`,
			)
			.join("");
		new DialogV2({
			window: { title: t("elkan5e.grapple.releaseDialog.title") },
			content: `
				<form>
					<p>${t("elkan5e.grapple.releaseDialog.prompt")}</p>
					${options}
				</form>
			`,
			buttons: [
				{
					action: "ok",
					label: t("elkan5e.grapple.releaseDialog.releaseSelected"),
					callback: (_event, button) => {
						const selected = Array.from(
							button.form.querySelectorAll("input[name='release']:checked"),
						).map((el) => Number(el.value));
						resolve(selected.filter((v) => Number.isFinite(v)));
					},
				},
				{
					action: "skip",
					label: t("elkan5e.grapple.releaseDialog.keepAll"),
					callback: () => resolve([]),
				},
			],
			default: "skip",
		}).render(true);
	});
};

/**
 * Resolve the grapple range from the item's range or default to 5 ft.
 * @param {object} workflow
 * @returns {number}
 */
const getGrappleRange = (workflow) => {
	const raw = workflow?.item?.system?.range?.value;
	const range = Number(raw);
	return Number.isFinite(range) && range > 0 ? range : 5;
};

const measureRangeDistance = (from, to) => {
	if (!canvas?.grid) return Number.POSITIVE_INFINITY;
	if (typeof canvas.grid.measurePath === "function") {
		try {
			const path = canvas.grid.measurePath([from, to], {});
			if (Number.isFinite(path?.distance)) return path.distance;
		} catch (error) {
			// Fallback below for older grid APIs or unexpected measurePath signatures.
			void error;
		}
	}
	return canvas.grid.measureDistance(from, to);
};

const mergeUniqueChanges = (existing = [], incoming = []) => {
	const sig = (c) => `${c?.key}|${c?.mode}|${c?.value}|${c?.priority ?? ""}`;
	const map = new Map();
	for (const c of existing || []) map.set(sig(c), c);
	for (const c of incoming || []) map.set(sig(c), c);
	return [...map.values()];
};

const changeSignature = (c) => `${c?.key}|${c?.mode}|${c?.value}|${c?.priority ?? ""}`;

const getTokenRect = (tokenDoc, x = tokenDoc.x, y = tokenDoc.y) => {
	const gridSize = canvas.grid?.size ?? 1;
	return {
		x,
		y,
		w: tokenDoc.width * gridSize,
		h: tokenDoc.height * gridSize,
	};
};

const nearest1D = (aMin, aMax, bMin, bMax) => {
	if (aMax < bMin) return [aMax, bMin];
	if (bMax < aMin) return [aMin, bMax];
	const p = Math.max(aMin, bMin);
	return [p, p];
};

const measureTokenDistance = (aDoc, aX, aY, bDoc, bX = bDoc.x, bY = bDoc.y) => {
	const a = getTokenRect(aDoc, aX, aY);
	const b = getTokenRect(bDoc, bX, bY);
	const [ax, bx] = nearest1D(a.x, a.x + a.w, b.x, b.x + b.w);
	const [ay, by] = nearest1D(a.y, a.y + a.h, b.y, b.y + b.h);
	return measureRangeDistance({ x: ax, y: ay }, { x: bx, y: by });
};

const isWithinGrappleRange = (distance, range) => {
	if (!Number.isFinite(distance)) return false;
	if (!Number.isFinite(range) || range <= 0) return false;
	// We measure token edge-to-edge distance; use strict comparison so 5 ft reach
	// does not allow an extra empty square.
	return distance < range;
};

const getFirstFullSpacePosition = (token, dx, dy) => {
	const gridSize = canvas.grid?.size ?? 1;
	const desiredX = token.x + dx;
	const desiredY = token.y + dy;
	if (!Number.isFinite(gridSize) || gridSize <= 0) return { x: desiredX, y: desiredY };
	const snap = (value, delta) => {
		const scaled = value / gridSize;
		if (delta > 0) return Math.ceil(scaled) * gridSize;
		if (delta < 0) return Math.floor(scaled) * gridSize;
		return Math.round(scaled) * gridSize;
	};
	return { x: snap(desiredX, dx), y: snap(desiredY, dy) };
};

/**
 * Apply (or upgrade) an Elkan grapple effect without a contested roll.
 * @param {object} options
 * @param {Actor} options.grappler
 * @param {Actor} options.targetActor
 * @param {Token} options.targetToken
 * @param {number} options.sizeDiff
 * @param {number} options.grappleRange
 * @param {string} options.icon
 * @param {ActiveEffect|null} [options.existingEffect=null]
 * @param {string|null} [options.originOverride=null]
 * @param {boolean} [options.notify=true]
 * @returns {Promise<void>}
 */
const applyElkanGrapple = async ({
	grappler,
	targetActor,
	targetToken,
	sizeDiff,
	grappleRange,
	icon,
	existingEffect = null,
	originOverride = null,
	notify = true,
}) => {
	if (!grappler || !targetActor || !targetToken) return;
	const current = existingEffect ? foundry.utils.duplicate(existingEffect) : {};
	const currentStatuses = Array.isArray(current?.statuses)
		? current.statuses
		: typeof current?.statuses?.values === "function"
			? [...current.statuses.values()]
			: [];
	const statuses = new Set(
		currentStatuses.filter(
			(statusId) =>
				!statusMatches(statusId, "grappled") && !statusMatches(statusId, "restrained"),
		),
	);
	statuses.add("grappled");
	const restrainedBaseChanges = getConditionChanges("restrained");
	const restrainedSigs = new Set(restrainedBaseChanges.map(changeSignature));
	let changes = foundry.utils.duplicate(current?.changes ?? []).filter((change) => {
		if (change?.key === "system.attributes.movement.all") return false;
		if (
			change?.key === "flags.midi-qol.disadvantage.attack.all" &&
			String(change?.value ?? "").includes(grappler.uuid)
		) {
			return false;
		}
		return !restrainedSigs.has(changeSignature(change));
	});

	const addChanges = (incoming) => {
		changes = mergeUniqueChanges(changes, incoming);
	};
	await removeClimberEffect(grappler, targetActor);

	if (sizeDiff >= 0) {
		addChanges([
			{
				key: "system.attributes.movement.all",
				mode: 0,
				value: "0",
				priority: 60,
			},
		]);
	} else if (sizeDiff === -1) {
		addChanges([
			{
				key: "system.attributes.movement.all",
				mode: 0,
				value: "*0.5",
				priority: 60,
			},
		]);
	}

	if (sizeDiff >= 2) {
		statuses.add("restrained");
		addChanges(restrainedBaseChanges);
	} else if (sizeDiff <= -2) {
		const climb = getClimbSpeed(grappler);
		if (!Number.isFinite(climb) || climb <= 0) {
			const existingClimber = grappler.effects.find(
				(e) =>
					e?.flags?.elkan5e?.grapple?.type === "climber-adv" &&
					e?.flags?.elkan5e?.grapple?.targetUuid === targetActor.uuid,
			);
			if (!existingClimber) {
				await grappler.createEmbeddedDocuments("ActiveEffect", [
					{
						name: t("elkan5e.grapple.climberEffect"),
						icon,
						origin: targetActor.uuid,
						flags: {
							elkan5e: {
								grapple: {
									type: "climber-adv",
									targetUuid: targetActor.uuid,
								},
							},
						},
						changes: [
							{
								key: "system.attributes.movement.all",
								mode: 0,
								value: "0",
								priority: 60,
							},
						],
						disabled: false,
						type: "base",
					},
				]);
			}
		} else {
			addChanges([
				{
					key: "flags.midi-qol.disadvantage.attack.all",
					mode: 5,
					value: `target?.actor?.uuid === "${grappler.uuid}"`,
					priority: 50,
				},
			]);

			const existingClimber = grappler.effects.find(
				(e) =>
					e?.flags?.elkan5e?.grapple?.type === "climber-adv" &&
					e?.flags?.elkan5e?.grapple?.targetUuid === targetActor.uuid,
			);
			if (!existingClimber) {
				await grappler.createEmbeddedDocuments("ActiveEffect", [
					{
						name: t("elkan5e.grapple.climberEffect"),
						icon,
						origin: targetActor.uuid,
						flags: {
							elkan5e: {
								grapple: {
									type: "climber-adv",
									targetUuid: targetActor.uuid,
								},
							},
						},
						changes: [
							{
								key: "flags.midi-qol.advantage.attack.all",
								mode: 5,
								value: `target?.actor?.uuid === "${targetActor.uuid}"`,
								priority: 50,
							},
						],
						disabled: false,
						type: "base",
					},
				]);
			}
		}
	}

	const flags = foundry.utils.duplicate(current?.flags ?? {});
	flags.elkan5e ??= {};
	flags.elkan5e.grapple = {
		grapplerUuid: grappler.uuid,
		sizeDiff,
		range: grappleRange,
	};

	const payload = {
		name:
			current?.name ??
			game.i18n.localize("elkan5e.conditions.grappled") ??
			t("elkan5e.grapple.grappled"),
		icon: current?.icon ?? icon,
		origin: originOverride ?? grappler.uuid,
		flags,
		changes,
		disabled: false,
		type: "base",
		statuses: [...statuses],
	};

	if (existingEffect) await existingEffect.update(payload);
	else await targetActor.createEmbeddedDocuments("ActiveEffect", [payload]);

	if (notify) {
		ui.notifications.info(
			t("elkan5e.grapple.notifications.grappled", {
				grappler: grappler.name,
				target: targetActor.name,
			}),
		);
	}
};

/**
 * Maintain grapple movement rules when either token moves.
 * @param {TokenDocument} tokenDoc
 * @param {object} changes
 * @returns {Promise<void>}
 */
export async function handleGrapplerMove(tokenDoc, changes) {
	if (!game.user?.isGM) return;
	if (!canvas?.tokens) return;
	if (changes?.x == null && changes?.y == null) return;
	if (DRAG_IGNORE.has(tokenDoc.id)) return;

	const actor = tokenDoc?.actor;
	if (!actor) return;

	const grapplerUuid = actor.uuid;
	const newX = changes?.x ?? tokenDoc.x;
	const newY = changes?.y ?? tokenDoc.y;
	const dx = newX - tokenDoc.x;
	const dy = newY - tokenDoc.y;

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
			if (isWithinGrappleRange(distance, range)) continue;
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
		if ((dx !== 0 || dy !== 0) && sizeDiff <= -1 && !isWithinGrappleRange(distance, range)) {
			DRAG_IGNORE.add(grapplerToken.id);
			const pos = getFirstFullSpacePosition(grapplerToken.document, dx, dy);
			await grapplerToken.document.update(pos);
			setTimeout(() => DRAG_IGNORE.delete(grapplerToken.id), 0);
			movedTogether = true;
		}
		// If the larger grappled creature moved and the smaller grappler was moved with it,
		// do not end the grapple on range in this update.
		if (movedTogether) continue;
		if (!isWithinGrappleRange(distance, range)) {
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
			if (isWithinGrappleRange(distance, range)) continue;
			DRAG_IGNORE.add(targetToken.id);
			const pos = getFirstFullSpacePosition(targetToken.document, dx, dy);
			await targetToken.document.update(pos);
			setTimeout(() => DRAG_IGNORE.delete(targetToken.id), 0);
		}
	}
}

/**
 * End all grapples involving an actor (as grappler and as grappled).
 * Used when forced movement (like push) should break grapples immediately.
 * @param {Actor} actor
 * @returns {Promise<void>}
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
 * End grapple links when a pushed effect is applied to an actor.
 * @param {ActiveEffect} effect
 * @param {object} [changes={}]
 * @returns {Promise<void>}
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
 * Ask whether grapples involving a dead creature should end.
 * The prompt is shown once per dead state and resets when revived.
 * @param {Actor} actor
 * @returns {Promise<void>}
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
 * Perform a contested grapple against each targeted creature.
 * @param {object} workflow
 * @param {boolean} [acr=false] - If true, use Acrobatics instead of Athletics.
 * @param {boolean} [skipRoll=false] - If true, apply grapple directly without contested roll.
 * @returns {Promise<void>}
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
		const targetDistance = measureTokenDistance(
			token.document,
			token.document.x,
			token.document.y,
			targetToken.document,
			targetToken.document.x,
			targetToken.document.y,
		);
		if (!isWithinGrappleRange(targetDistance, range)) {
			console.warn("Elkan 5e | Grapple target out of range", {
				grappler: grappler.name,
				target: targetActor.name,
				distance: targetDistance,
				range,
			});
			continue;
		}

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
