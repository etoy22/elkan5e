import { sizeIndex } from "../../global.mjs";
import { createMountedEffect } from "../../shared/effect-factories.mjs";
import { t } from "../../shared/helpers.mjs";

/**
 * Set used to suppress recursive movement updates when dragging a rider along with its mount.
 * @type {Set<string>}
 */
const DRAG_IGNORE = new Set();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Snap a token's next position along a movement delta, keeping it on a full grid cell.
 * @param {TokenDocument} tokenDoc
 * @param {number} dx
 * @param {number} dy
 * @returns {{x: number, y: number}}
 */
const getFirstFullSpacePosition = (tokenDoc, dx, dy) => {
	const gridSize = canvas.grid?.size ?? 1;
	const desiredX = tokenDoc.x + dx;
	const desiredY = tokenDoc.y + dy;
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
 * Find the active "Mounted" effect on a rider that points to a specific mount UUID.
 * @param {Actor} riderActor
 * @param {string} mountUuid
 * @returns {ActiveEffect|null}
 */
const getMountedEffectFor = (riderActor, mountUuid) =>
	riderActor?.effects?.find((e) => e?.flags?.elkan5e?.ride?.mountUuid === mountUuid) ?? null;

/**
 * Return every {token, actor, effect} tuple for riders currently on a given mount.
 * @param {Actor} mountActor
 * @returns {Array<{token: Token, actor: Actor, effect: ActiveEffect}>}
 */
const getRidersForMount = (mountActor) => {
	if (!canvas?.tokens?.placeables || !mountActor) return [];
	const riders = [];
	for (const token of canvas.tokens.placeables) {
		const actor = token?.actor;
		if (!actor) continue;
		const effect = actor.effects.find(
			(e) => e?.flags?.elkan5e?.ride?.mountUuid === mountActor.uuid,
		);
		if (effect) riders.push({ token, actor, effect });
	}
	return riders;
};

// ---------------------------------------------------------------------------
// Effect application
// ---------------------------------------------------------------------------

/**
 * Apply (or update) the Mounted active effect on the rider.
 * Sets rider movement to 0, stores the mount's UUID in flags, moves the rider
 * token onto the mount, and raises the rider's sort so it renders on top.
 *
 * @param {object} options
 * @param {Actor} options.rider
 * @param {Actor} options.mountActor
 * @param {Token} options.mountToken
 * @param {Token|null} [options.riderToken=null]
 * @param {boolean} [options.notify=true]
 * @returns {Promise<void>}
 */
const applyMountedEffect = async ({
	rider,
	mountActor,
	mountToken,
	riderToken = null,
	notify = true,
}) => {
	if (!rider || !mountActor || !mountToken) return;

	const existing = getMountedEffectFor(rider, mountActor.uuid);

	const changes = [
		{
			key: "system.attributes.movement.all",
			mode: 0,
			value: "0",
			priority: 65,
		},
	];

	const flags = {
		elkan5e: {
			ride: {
				mountUuid: mountActor.uuid,
			},
		},
	};

	const payload = await createMountedEffect(mountActor, rider, changes, flags);

	if (existing) {
		await existing.update(payload);
	} else {
		await rider.createEmbeddedDocuments("ActiveEffect", [payload]);
	}

	// Snap the rider token onto the mount and ensure it renders above it.
	const resolvedRiderToken = riderToken ?? rider.getActiveTokens?.()?.[0] ?? null;
	if (resolvedRiderToken) {
		const mountDoc = mountToken.document;
		const mountSort = mountDoc.sort ?? 0;
		DRAG_IGNORE.add(resolvedRiderToken.id);
		try {
			await resolvedRiderToken.document.update({
				x: mountDoc.x,
				y: mountDoc.y,
				sort: mountSort + 1,
			});
		} catch (error) {
			console.warn("Elkan 5e | Failed to reposition rider token on mount", error);
		}
		setTimeout(() => DRAG_IGNORE.delete(resolvedRiderToken.id), 0);
	}

	if (notify) {
		ui.notifications.info(
			t("elkan5e.ride.notifications.mounted", {
				rider: rider.name,
				mount: mountActor.name,
			}),
		);
	}
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * End all ride relationships involving an actor — both as rider and as mount.
 * @param {Actor} actor
 * @returns {Promise<void>}
 */
export async function endAllRidesForActor(actor) {
	if (!actor || !canvas?.tokens?.placeables) return;

	// Actor is a rider — remove its Mounted effects.
	const mountedEffects = actor.effects.filter((e) => e?.flags?.elkan5e?.ride?.mountUuid);
	for (const effect of mountedEffects) {
		try {
			await effect.delete();
		} catch (error) {
			console.warn("Elkan 5e | Failed to clear mounted effect (rider)", error);
		}
	}

	// Actor is a mount — remove the Mounted effect from every rider.
	for (const token of canvas.tokens.placeables) {
		const tokenActor = token?.actor;
		if (!tokenActor) continue;
		const effects = tokenActor.effects.filter(
			(e) => e?.flags?.elkan5e?.ride?.mountUuid === actor.uuid,
		);
		for (const effect of effects) {
			try {
				await effect.delete();
			} catch (error) {
				console.warn("Elkan 5e | Failed to clear mounted effect (mount side)", error);
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Movement handler
// ---------------------------------------------------------------------------

/**
 * When a mount token moves, drag every rider token along with it.
 * Registered on the "updateToken" hook (GM only).
 *
 * @param {TokenDocument} tokenDoc
 * @param {object} changes
 * @returns {Promise<void>}
 */
export async function handleMountMove(tokenDoc, changes) {
	if (!game.user?.isGM) return;
	if (!canvas?.tokens) return;
	if (changes?.x == null && changes?.y == null) return;
	if (DRAG_IGNORE.has(tokenDoc.id)) return;

	const mountActor = tokenDoc?.actor;
	if (!mountActor) return;

	const newX = changes?.x ?? tokenDoc.x;
	const newY = changes?.y ?? tokenDoc.y;
	const dx = newX - tokenDoc.x;
	const dy = newY - tokenDoc.y;

	if (dx === 0 && dy === 0) return;

	const mountSort = tokenDoc.sort ?? 0;
	const riders = getRidersForMount(mountActor);
	for (const { token: riderToken } of riders) {
		DRAG_IGNORE.add(riderToken.id);
		const pos = getFirstFullSpacePosition(riderToken.document, dx, dy);
		await riderToken.document.update({ ...pos, sort: mountSort + 1 });
		setTimeout(() => DRAG_IGNORE.delete(riderToken.id), 0);
	}
}

// ---------------------------------------------------------------------------
// Core actions
// ---------------------------------------------------------------------------

/**
 * Mount a target creature (workflow.targets).
 *
 * For a willing mount, call with skipRoll = true (no contested check needed).
 * For an unwilling mount, a contested roll is made: rider's Animal Handling
 * vs the mount's Athletics.
 *
 * The target must be at least one size category larger than the rider.
 *
 * @param {object} workflow   MidiQOL workflow
 * @param {boolean} [skipRoll=false]   Skip the contested roll and apply directly
 * @returns {Promise<void>}
 */
export async function ride(workflow, skipRoll = false) {
	if (!workflow?.actor) return;

	const token = workflow.token ?? MidiQOL.tokenForActor(workflow.actor);
	if (!token) {
		ui.notifications.warn(
			t("elkan5e.ride.notifications.noToken", { name: workflow.actor.name }),
		);
		return;
	}

	if (!workflow.targets || workflow.targets.size === 0) {
		console.warn("Elkan 5e | Ride requires at least one target (the mount)");
		return;
	}

	const rider = workflow.actor;
	const riderSize = sizeIndex(rider);
	const flavor = workflow.item?.name ?? t("elkan5e.ride.name");

	for (const mountToken of workflow.targets) {
		const mountActor = mountToken?.actor;
		if (!mountActor) continue;

		const mountSize = sizeIndex(mountActor);
		const sizeDiff = mountSize - riderSize; // positive = mount is larger

		if (sizeDiff < 1) {
			ui.notifications.warn(
				t("elkan5e.ride.notifications.tooSmall", {
					rider: rider.name,
					mount: mountActor.name,
				}),
			);
			continue;
		}

		if (skipRoll) {
			await applyMountedEffect({ rider, mountActor, mountToken, riderToken: token });
			continue;
		}

		// Contested roll: Animal Handling (rider) vs Athletics (mount).
		await MidiQOL.contestedRoll({
			source: {
				token,
				rollType: "skill",
				ability: "ani",
				rollOptions: {},
			},
			target: {
				token: mountToken,
				rollType: "skill",
				ability: "ath",
				rollOptions: {},
			},
			flavor,
			success: async () => {
				await applyMountedEffect({ rider, mountActor, mountToken, riderToken: token });
			},
			displayResults: true,
			itemCardId: workflow.itemCardId,
			rollOptions: { fastForward: false, chatMessage: true, rollMode: "publicroll" },
		});
	}
}

/**
 * When a Mounted active effect is deleted, reset the rider token's sort order
 * so it no longer floats above other tokens on the canvas.
 * Registered on the "deleteActiveEffect" hook (GM only).
 *
 * @param {ActiveEffect} effect
 * @returns {Promise<void>}
 */
export async function handleMountedEffectDelete(effect) {
	if (!game.user?.isGM) return;
	if (!effect?.flags?.elkan5e?.ride?.mountUuid) return;

	const riderActor = effect?.parent;
	if (!riderActor || riderActor.documentName !== "Actor") return;

	const riderTokens = riderActor.getActiveTokens?.() ?? [];
	for (const riderToken of riderTokens) {
		try {
			await riderToken.document.update({ sort: 0 });
		} catch (error) {
			console.warn("Elkan 5e | Failed to reset rider token sort on dismount", error);
		}
	}
}

/**
 * Dismount action — removes the Mounted effect from the workflow actor.
 * Typically called from a "Dismount" item macro.
 *
 * @param {object} workflow   MidiQOL workflow
 * @returns {Promise<void>}
 */
export async function dismountAction(workflow) {
	if (!workflow?.actor) return;
	const rider = workflow.actor;

	const mountedEffects = rider.effects.filter((e) => e?.flags?.elkan5e?.ride?.mountUuid);
	if (!mountedEffects.length) {
		ui.notifications.info(t("elkan5e.ride.notifications.notMounted", { name: rider.name }));
		return;
	}

	for (const effect of mountedEffects) {
		try {
			await effect.delete();
		} catch (error) {
			console.warn("Elkan 5e | Failed to remove mounted effect on dismount", error);
		}
	}

	ui.notifications.info(t("elkan5e.ride.notifications.dismounted", { name: rider.name }));
}
