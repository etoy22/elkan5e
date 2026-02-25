import {
	chooseDefenderSkill,
	sizeIndex,
	isPushBlocked,
	hasPushResist,
} from "../global.mjs";
import { endAllGrapplesForActor } from "./grapple.mjs";

const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));

/**
 * Convert a distance in feet to grid pixels.
 * @param {number} distance
 * @returns {number}
 */
const getGridStep = (distance) => {
	const gridDistance = canvas.grid?.distance ?? 5;
	const gridSize = canvas.grid?.size ?? 1;
	return (distance / gridDistance) * gridSize;
};

/**
 * Compute how many grid steps fit inside a distance.
 * @param {number} distance
 * @returns {number}
 */
const getStepCount = (distance) => {
	const gridDistance = canvas.grid?.distance ?? 5;
	if (!Number.isFinite(distance) || distance <= 0) return 0;
	return Math.max(Math.floor(distance / gridDistance), 0);
};

/**
 * Compute a token's top-left position from a desired center.
 * @param {TokenDocument} tokenDoc
 * @param {{x:number, y:number}} center
 * @returns {{x:number, y:number}}
 */
const getTokenTopLeftFromCenter = (tokenDoc, center) => {
	const gridSize = canvas.grid?.size ?? 1;
	return {
		x: center.x - (tokenDoc.width * gridSize) / 2,
		y: center.y - (tokenDoc.height * gridSize) / 2,
	};
};

/**
 * Get a rectangle for a token at a specific top-left.
 * @param {TokenDocument} tokenDoc
 * @param {number} x
 * @param {number} y
 * @returns {{x:number, y:number, w:number, h:number}}
 */
const getTokenRectAt = (tokenDoc, x, y) => {
	const gridSize = canvas.grid?.size ?? 1;
	return {
		x,
		y,
		w: tokenDoc.width * gridSize,
		h: tokenDoc.height * gridSize,
	};
};

/**
 * AABB collision test.
 * @param {{x:number, y:number, w:number, h:number}} a
 * @param {{x:number, y:number, w:number, h:number}} b
 * @returns {boolean}
 */
const rectsIntersect = (a, b) =>
	a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * Check if a token would overlap any other token at a position.
 * @param {TokenDocument} tokenDoc
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
const isOccupied = (tokenDoc, x, y) => {
	const rect = getTokenRectAt(tokenDoc, x, y);
	return canvas.tokens.placeables.some((t) => {
		if (t.id === tokenDoc.id) return false;
		const other = getTokenRectAt(t.document, t.document.x, t.document.y);
		return rectsIntersect(rect, other);
	});
};

/**
 * Get the scene bounds rectangle.
 * @returns {{x:number, y:number, w:number, h:number}|null}
 */
const getSceneBounds = () => {
	const dims = canvas.dimensions;
	if (!dims) return null;
	return {
		x: 0,
		y: 0,
		w: dims.width,
		h: dims.height,
	};
};

/**
 * Check if a rectangle lies fully within the scene bounds.
 * @param {{x:number, y:number, w:number, h:number}} rect
 * @param {{x:number, y:number, w:number, h:number}|null} bounds
 * @returns {boolean}
 */
const withinBounds = (rect, bounds) => {
	if (!bounds) return true;
	return (
		rect.x >= bounds.x &&
		rect.y >= bounds.y &&
		rect.x + rect.w <= bounds.x + bounds.w &&
		rect.y + rect.h <= bounds.y + bounds.h
	);
};

/**
 * Build candidate push directions, optionally requiring "away" from the source.
 * @param {Token} targetToken
 * @param {Token} sourceToken
 * @param {boolean} requireAway
 * @returns {Array<{dx:number, dy:number, label:string}>}
 */
const getPushDirections = (targetToken, sourcePoint, requireAway) => {
	const dirs = [
		{ dx: 1, dy: 0, label: t("elkan5e.directions.east") },
		{ dx: -1, dy: 0, label: t("elkan5e.directions.west") },
		{ dx: 0, dy: 1, label: t("elkan5e.directions.south") },
		{ dx: 0, dy: -1, label: t("elkan5e.directions.north") },
		{ dx: 1, dy: 1, label: t("elkan5e.directions.southeast") },
		{ dx: 1, dy: -1, label: t("elkan5e.directions.northeast") },
		{ dx: -1, dy: 1, label: t("elkan5e.directions.southwest") },
		{ dx: -1, dy: -1, label: t("elkan5e.directions.northwest") },
	];

	const candidates = [];
	for (const dir of dirs) {
		if (requireAway) {
			const currentDistance = canvas.grid.measureDistance(
				sourcePoint,
				targetToken.center,
			);
			const probe = {
				x: targetToken.center.x + dir.dx,
				y: targetToken.center.y + dir.dy,
			};
			const probeDistance = canvas.grid.measureDistance(sourcePoint, probe);
			if (probeDistance <= currentDistance) continue;
		}
		candidates.push(dir);
	}
	return candidates;
};

/**
 * Prompt the target to choose a direction.
 * @param {Actor} actor
 * @param {string} title
 * @param {Array<{dx:number, dy:number, label:string}>} directions
 * @returns {Promise<{dx:number, dy:number, label:string}|null>}
 */
const chooseDirection = async (actor, title, directions) => {
	const candidates = directions ?? [];
	if (!candidates.length) return null;
	if (!actor?.isOwner) return candidates[0];
	const DialogV2 = foundry.applications.api.DialogV2;
	return new Promise((resolve) => {
		const options = candidates
			.map((c, idx) => `<option value="${idx}">${c.label}</option>`)
			.join("");
		new DialogV2({
			window: { title },
			content: `
				<form>
					<div class="form-group">
						<label>${t("elkan5e.push.directionLabel")}</label>
						<select id="push-direction">${options}</select>
					</div>
				</form>
			`,
			buttons: [
				{
					action: "ok",
					label: t("elkan5e.push.dialogPush"),
					callback: (_event, button) => {
						const idx = Number(button.form.querySelector("#push-direction")?.value ?? 0);
						resolve(candidates[idx] ?? candidates[0]);
					},
				},
			],
			default: "ok",
		}).render(true);
	});
};

/**
 * Find the farthest unoccupied, in-bounds position along a direction.
 * @param {Token} targetToken
 * @param {Token} sourceToken
 * @param {number} distance
 * @param {{dx:number, dy:number}} dir
 * @param {boolean} requireAway
 * @returns {{x:number, y:number}|null}
 */
const getFarthestValidPosition = (targetToken, sourcePoint, distance, dir, requireAway) => {
	const stepCount = getStepCount(distance);
	if (stepCount <= 0) return null;
	const step = getGridStep(distance);
	const bounds = getSceneBounds();
	const startDistance = canvas.grid.measureDistance(sourcePoint, targetToken.center);

	let lastValid = null;
	for (let i = 1; i <= stepCount; i += 1) {
		const center = {
			x: targetToken.center.x + dir.dx * step * i,
			y: targetToken.center.y + dir.dy * step * i,
		};
		const { x, y } = getTokenTopLeftFromCenter(targetToken.document, center);
		const rect = getTokenRectAt(targetToken.document, x, y);
		if (!withinBounds(rect, bounds)) break;
		if (isOccupied(targetToken.document, x, y)) break;
		const dist = canvas.grid.measureDistance(sourcePoint, center);
		if (requireAway && dist <= startDistance) continue;
		lastValid = { x, y };
	}
	return lastValid;
};

/**
 * Resolve a point used as push origin.
 * @param {{x:number,y:number}|Token|null|undefined} source
 * @param {Token} fallbackToken
 * @returns {{x:number,y:number}|null}
 */
const resolveSourcePoint = (source, fallbackToken) => {
	if (source?.center && Number.isFinite(source.center.x) && Number.isFinite(source.center.y)) {
		return { x: source.center.x, y: source.center.y };
	}
	if (Number.isFinite(source?.x) && Number.isFinite(source?.y)) {
		return { x: source.x, y: source.y };
	}
	if (fallbackToken?.center) {
		return { x: fallbackToken.center.x, y: fallbackToken.center.y };
	}
	return null;
};

/**
 * Push a token using the configured choice mode.
 * @param {Token} targetToken
 * @param {Token} sourceToken
 * @param {number} distance
 * @param {number} choice
 * @returns {Promise<void>}
 */
const pushByChoice = async (targetToken, sourcePoint, distance, choice) => {
	if (!sourcePoint) return false;
	if (choice === 0) {
		const dx = targetToken.center.x - sourcePoint.x;
		const dy = targetToken.center.y - sourcePoint.y;
		const dir = { dx: Math.sign(dx), dy: Math.sign(dy) };
		if (dir.dx === 0 && dir.dy === 0) return false;
		const pos = getFarthestValidPosition(targetToken, sourcePoint, distance, dir, true);
		if (!pos) return false;
		await targetToken.document.update(pos);
		return true;
	}

	const requireAway = choice === 1;
	const directions = getPushDirections(targetToken, sourcePoint, requireAway);
	if (!directions.length) return false;

	const picker = targetToken.actor;
	const selected = await chooseDirection(picker, t("elkan5e.push.directionTitle"), directions);
	if (!selected) return false;
	const pos = getFarthestValidPosition(
		targetToken,
		sourcePoint,
		distance,
		selected,
		requireAway,
	);
	if (!pos) return false;
	await targetToken.document.update(pos);
	return true;
};

/**
 * Perform a contested shove against each targeted creature and move it on success.
 * @param {object} workflow
 * @param {boolean} [acr=false] - If true, use Acrobatics instead of Athletics.
 * @param {number} [distance=5]
 * @param {number} [choice=0]
 * @param {{x:number, y:number}|Token|null} [sourcePoint=null] - Optional point used as push origin.
 * @returns {Promise<void>}
 */
export async function push(workflow, acr = false, distance = 5, choice = 0, sourcePoint = null) {
	if (!workflow?.actor) return;
	const token = workflow.token ?? MidiQOL.tokenForActor(workflow.actor);
	if (!token) {
		ui.notifications.warn(
			t("elkan5e.push.notifications.noToken", { name: workflow.actor.name }),
		);
		return;
	}
	if (!workflow.targets || workflow.targets.size === 0) {
		console.warn("Push requires at least one target");
		return;
	}

	const pusher = workflow.actor;
	const pusherSkillKey = acr ? "acr" : "ath";
	const pusherSize = sizeIndex(pusher);
	const flavor = workflow.item?.name ?? t("elkan5e.push.name");
	const resolvedSourcePoint = resolveSourcePoint(sourcePoint ?? workflow?.pushSourcePoint, token);

	const onSuccess = async (_sourceToken, targetToken) => {
		const moved = await pushByChoice(targetToken, resolvedSourcePoint, distance, choice);
		if (moved && targetToken?.actor) await endAllGrapplesForActor(targetToken.actor);
	};

	for (const targetToken of workflow.targets) {
		const targetActor = targetToken?.actor;
		if (!targetActor) continue;
		if (isPushBlocked(targetActor)) {
			ui.notifications.info(
				t("elkan5e.push.notifications.unpushable", { name: targetActor.name }),
			);
			continue;
		}
		const targetSkill = chooseDefenderSkill(targetActor);
		const targetSize = sizeIndex(targetActor);
		const pushResist = hasPushResist(targetActor);

		const pusherAdv = pusherSize > targetSize;
		const targetAdv = targetSize > pusherSize || pushResist;

		console.log("Elkan 5e | push contestedRoll", {
			pusher: pusher.name,
			target: targetActor.name,
			pusherSize,
			targetSize,
			pusherAdv,
			targetAdv,
			pushResist,
			sourceAbility: pusherSkillKey,
			targetAbility: targetSkill,
		});

		await MidiQOL.contestedRoll({
			source: {
				token,
				rollType: "skill",
				ability: pusherSkillKey,
				rollOptions: { advantage: pusherAdv },
			},
			target: {
				token: targetToken,
				rollType: "skill",
				ability: targetSkill,
				rollOptions: { advantage: targetAdv },
			},
			flavor,
			success: onSuccess.bind(null, token, targetToken),
			displayResults: true,
			itemCardId: workflow.itemCardId,
			rollOptions: { fastForward: false, chatMessage: true, rollMode: "publicroll" },
		});
	}
}
