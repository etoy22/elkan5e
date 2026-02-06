const getSkillTotal = (actor, key) =>
	Number(actor?.system?.skills?.[key]?.total ?? actor?.system?.skills?.[key]?.mod ?? 0);

const chooseDefenderSkill = (actor) => {
	const ath = getSkillTotal(actor, "ath");
	const acr = getSkillTotal(actor, "acr");
	return acr > ath ? "acr" : "ath";
};

const SIZE_ORDER = ["tiny", "sm", "med", "lg", "huge", "grg"];

const hasPowerfulBuild = (actor) =>
	actor?.items?.some(
		(i) =>
			i?.system?.identifier === "powerful-build" ||
			i?.identity === "powerful-build" ||
			i?.name?.toLowerCase() === "powerful build",
	);

const sizeIndex = (actor) => {
	const size = actor?.system?.traits?.size ?? "med";
	const idx = SIZE_ORDER.indexOf(size);
	const base = idx === -1 ? SIZE_ORDER.indexOf("med") : idx;
	if (!hasPowerfulBuild(actor)) return base;
	return Math.min(base + 1, SIZE_ORDER.length - 1);
};

const getGridStep = (distance) => {
	const gridDistance = canvas.grid?.distance ?? 5;
	const gridSize = canvas.grid?.size ?? 1;
	return (distance / gridDistance) * gridSize;
};

const getStepCount = (distance) => {
	const gridDistance = canvas.grid?.distance ?? 5;
	if (!Number.isFinite(distance) || distance <= 0) return 0;
	return Math.max(Math.floor(distance / gridDistance), 0);
};

const getTokenTopLeftFromCenter = (tokenDoc, center) => {
	const gridSize = canvas.grid?.size ?? 1;
	return {
		x: center.x - (tokenDoc.width * gridSize) / 2,
		y: center.y - (tokenDoc.height * gridSize) / 2,
	};
};

const getTokenRectAt = (tokenDoc, x, y) => {
	const gridSize = canvas.grid?.size ?? 1;
	return {
		x,
		y,
		w: tokenDoc.width * gridSize,
		h: tokenDoc.height * gridSize,
	};
};

const rectsIntersect = (a, b) =>
	a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const isOccupied = (tokenDoc, x, y) => {
	const rect = getTokenRectAt(tokenDoc, x, y);
	return canvas.tokens.placeables.some((t) => {
		if (t.id === tokenDoc.id) return false;
		const other = getTokenRectAt(t.document, t.document.x, t.document.y);
		return rectsIntersect(rect, other);
	});
};

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

const withinBounds = (rect, bounds) => {
	if (!bounds) return true;
	return (
		rect.x >= bounds.x &&
		rect.y >= bounds.y &&
		rect.x + rect.w <= bounds.x + bounds.w &&
		rect.y + rect.h <= bounds.y + bounds.h
	);
};

const getPushDirections = (targetToken, sourceToken, requireAway) => {
	const dirs = [
		{ dx: 1, dy: 0, label: "East" },
		{ dx: -1, dy: 0, label: "West" },
		{ dx: 0, dy: 1, label: "South" },
		{ dx: 0, dy: -1, label: "North" },
		{ dx: 1, dy: 1, label: "Southeast" },
		{ dx: 1, dy: -1, label: "Northeast" },
		{ dx: -1, dy: 1, label: "Southwest" },
		{ dx: -1, dy: -1, label: "Northwest" },
	];

	const candidates = [];
	for (const dir of dirs) {
		if (requireAway) {
			const currentDistance = canvas.grid.measureDistance(
				sourceToken.center,
				targetToken.center,
			);
			const probe = {
				x: targetToken.center.x + dir.dx,
				y: targetToken.center.y + dir.dy,
			};
			const probeDistance = canvas.grid.measureDistance(sourceToken.center, probe);
			if (probeDistance <= currentDistance) continue;
		}
		candidates.push(dir);
	}
	return candidates;
};

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
						<label>Direction</label>
						<select id="push-direction">${options}</select>
					</div>
				</form>
			`,
			buttons: [
				{
					action: "ok",
					label: "Push",
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

const getFarthestValidPosition = (targetToken, sourceToken, distance, dir, requireAway) => {
	const stepCount = getStepCount(distance);
	if (stepCount <= 0) return null;
	const step = getGridStep(canvas.grid?.distance ?? 5);
	const bounds = getSceneBounds();
	const startDistance = canvas.grid.measureDistance(sourceToken.center, targetToken.center);

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
		const dist = canvas.grid.measureDistance(sourceToken.center, center);
		if (requireAway && dist <= startDistance) continue;
		lastValid = { x, y };
	}
	return lastValid;
};

const pushByChoice = async (targetToken, sourceToken, distance, choice) => {
	if (choice === 0) {
		const dx = targetToken.center.x - sourceToken.center.x;
		const dy = targetToken.center.y - sourceToken.center.y;
		const dir = { dx: Math.sign(dx), dy: Math.sign(dy) };
		if (dir.dx === 0 && dir.dy === 0) return;
		const pos = getFarthestValidPosition(targetToken, sourceToken, distance, dir, true);
		if (!pos) return;
		await targetToken.document.update(pos);
		return;
	}

	const requireAway = choice === 1;
	const directions = getPushDirections(targetToken, sourceToken, requireAway);
	if (!directions.length) return;

	const picker = targetToken.actor;
	const selected = await chooseDirection(picker, "Push Direction", directions);
	if (!selected) return;
	const pos = getFarthestValidPosition(
		targetToken,
		sourceToken,
		distance,
		selected,
		requireAway,
	);
	if (!pos) return;
	await targetToken.document.update(pos);
};

export async function push(workflow, acr = false, distance = 5, choice = 0) {
	if (!workflow?.actor) return;
	const token = workflow.token ?? MidiQOL.tokenForActor(workflow.actor);
	if (!token) {
		ui.notifications.warn(`${workflow.actor.name} does not have a token on the canvas`);
		return;
	}
	if (!workflow.targets || workflow.targets.size === 0) {
		console.warn("Push requires at least one target");
		return;
	}

	const pusher = workflow.actor;
	const pusherSkillKey = acr ? "acr" : "ath";
	const pusherAbility = pusherSkillKey === "acr" ? "Acrobatics" : "Athletics";
	const pusherSize = sizeIndex(pusher);
	const flavor = workflow.item?.name ?? "Push";

	const onSuccess = async (_sourceToken, targetToken) => {
		await pushByChoice(targetToken, token, distance, choice);
	};

	for (const targetToken of workflow.targets) {
		const targetActor = targetToken?.actor;
		if (!targetActor) continue;
		const targetSkill = chooseDefenderSkill(targetActor);
		const targetSize = sizeIndex(targetActor);

		const pusherAdv = pusherSize > targetSize;
		const targetAdv = targetSize > pusherSize;

		const targetAbility = targetSkill === "acr" ? "Acrobatics" : "Athletics";

		await MidiQOL.contestedRoll({
			source: {
				token,
				rollType: "skill",
				ability: pusherAbility,
				options: { advantage: pusherAdv },
			},
			target: {
				token: targetToken,
				rollType: "skill",
				ability: targetAbility,
				options: { advantage: targetAdv },
			},
			flavor,
			success: onSuccess.bind(null, token, targetToken),
			displayResults: true,
			itemCardId: workflow.itemCardId,
			rollOptions: { fastForward: false, chatMessage: true, rollMode: "publicroll" },
		});
	}
}
