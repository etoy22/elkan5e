const getSkillTotal = (actor, key) =>
	Number(actor?.system?.skills?.[key]?.total ?? actor?.system?.skills?.[key]?.mod ?? 0);

const chooseDefenderSkill = (actor) => {
	const ath = getSkillTotal(actor, "ath");
	const acr = getSkillTotal(actor, "acr");
	return acr > ath ? "acr" : "ath";
};

const imgForCondition = (key) => `modules/elkan5e/icons/conditions/${key}.svg`;

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

const hasStatus = (effect, statusId) => {
	const statuses = effect?.statuses;
	if (!statuses) return false;
	if (typeof statuses.has === "function") return statuses.has(statusId);
	if (Array.isArray(statuses)) return statuses.includes(statusId);
	return false;
};

const getConditionChanges = (key) => {
	const cond = CONFIG.DND5E?.conditionTypes?.[key];
	return cond?.changes ? foundry.utils.duplicate(cond.changes) : [];
};

const DRAG_IGNORE = new Set();

const getClimbSpeed = (actor) =>
	Number(actor?.system?.attributes?.movement?.climb ?? 0);

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

const getGrappleRange = (workflow) => {
	const raw = workflow?.item?.system?.range?.value;
	const range = Number(raw);
	return Number.isFinite(range) && range > 0 ? range : 5;
};

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
			return g?.grapplerUuid === grapplerUuid && g?.sizeDiff === 0;
		});
		if (!effects.length) continue;

		const storedRange = Number(effects[0]?.flags?.elkan5e?.grapple?.range);
		const reach = Number(tokenDoc?.actor?.system?.attributes?.reach);
		const range =
			Number.isFinite(storedRange) && storedRange > 0
				? storedRange
				: Number.isFinite(reach) && reach > 0
					? reach
					: 5;
		const distance = canvas.grid.measureDistance(center, targetToken.center);
		if (distance <= range) continue;

		for (const effect of effects) {
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
		if ((dx !== 0 || dy !== 0) && sizeDiff <= -1) {
			DRAG_IGNORE.add(grapplerToken.id);
			await grapplerToken.document.update({ x: grapplerToken.x + dx, y: grapplerToken.y + dy });
			setTimeout(() => DRAG_IGNORE.delete(grapplerToken.id), 0);
		}
		const storedRange = Number(effect.flags.elkan5e.grapple.range);
		const reach = Number(grapplerActor?.system?.attributes?.reach);
		const range =
			Number.isFinite(storedRange) && storedRange > 0
				? storedRange
				: Number.isFinite(reach) && reach > 0
					? reach
					: 5;
		const distance = canvas.grid.measureDistance(center, grapplerToken.center);
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
			DRAG_IGNORE.add(targetToken.id);
			await targetToken.document.update({ x: targetToken.x + dx, y: targetToken.y + dy });
			setTimeout(() => DRAG_IGNORE.delete(targetToken.id), 0);
		}
	}
}

export async function grapple(workflow, acr = false) {
	if (!workflow?.actor) return;
	const token = workflow.token ?? MidiQOL.tokenForActor(workflow.actor);
	if (!token) {
		ui.notifications.warn(`${workflow.actor.name} does not have a token on the canvas`);
		return;
	}
	if (!workflow.targets || workflow.targets.size === 0) {
		console.warn("Grapple requires at least one target");
		return;
	}

	const grappler = workflow.actor;
	const grapplerSkillKey = acr ? "acr" : "ath";
	const grapplerAbility = grapplerSkillKey === "acr" ? "Acrobatics" : "Athletics";
	const grapplerSize = sizeIndex(grappler);
	const flavor = workflow.item?.name ?? "Grapple";
	const range = getGrappleRange(workflow);
	const icon = workflow.item?.img ?? imgForCondition("grappled");

	const applyGrapple = async (_sourceToken, targetToken, sizeDiff, grappleRange) => {
		const targetActor = targetToken?.actor;
		if (!targetActor) return;
		const existing = targetActor.effects.find(
			(e) => e?.origin === grappler.uuid && hasStatus(e, "grappled"),
		);
		if (existing) return;
		const statuses = ["grappled"];
		const changes = [];
		if (sizeDiff >= 0) {
			changes.push({
				key: "system.attributes.movement.all",
				mode: 0,
				value: "0",
				priority: 60,
			});
		} else if (sizeDiff === -1) {
			changes.push({
				key: "system.attributes.movement.all",
				mode: 0,
				value: "*0.5",
				priority: 60,
			});
		}
		if (sizeDiff >= 2) {
			statuses.push("restrained");
			changes.push(...getConditionChanges("restrained"));
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
							name: "Grappling (Climber)",
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
				changes.push({
					key: "flags.midi-qol.disadvantage.attack.all",
					mode: 5,
					value: `target?.actor?.uuid === \"${grappler.uuid}\"`,
					priority: 50,
				});

				const existingClimber = grappler.effects.find(
					(e) =>
						e?.flags?.elkan5e?.grapple?.type === "climber-adv" &&
						e?.flags?.elkan5e?.grapple?.targetUuid === targetActor.uuid,
				);
				if (!existingClimber) {
					await grappler.createEmbeddedDocuments("ActiveEffect", [
						{
							name: "Grappling (Climber)",
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
									value: `target?.actor?.uuid === \"${targetActor.uuid}\"`,
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
		const effect = {
			name: game.i18n.localize("elkan5e.conditions.grappled") || "Grappled",
			icon,
			origin: grappler.uuid,
			flags: {
				elkan5e: {
					grapple: {
						grapplerUuid: grappler.uuid,
						sizeDiff,
						range: grappleRange,
					},
				},
			},
			changes,
			disabled: false,
			type: "base",
			statuses,
		};
		await targetActor.createEmbeddedDocuments("ActiveEffect", [effect]);
		ui.notifications.info(`${grappler.name} grapples ${targetActor.name}.`);
	};

	for (const targetToken of workflow.targets) {
		const targetActor = targetToken?.actor;
		if (!targetActor) continue;

		const targetSkill = chooseDefenderSkill(targetActor);
		const targetSize = sizeIndex(targetActor);
		const sizeDiff = grapplerSize - targetSize;

		const grapplerAdv = grapplerSize > targetSize;
		const targetAdv = targetSize > grapplerSize;

		const targetAbility = targetSkill === "acr" ? "Acrobatics" : "Athletics";

		await MidiQOL.contestedRoll({
			source: {
				token,
				rollType: "skill",
				ability: grapplerAbility,
				options: { advantage: grapplerAdv },
			},
			target: {
				token: targetToken,
				rollType: "skill",
				ability: targetAbility,
				options: { advantage: targetAdv },
			},
			flavor,
			success: applyGrapple.bind(null, token, targetToken, sizeDiff, range),
			displayResults: true,
			itemCardId: workflow.itemCardId,
			rollOptions: { fastForward: false, chatMessage: true, rollMode: "publicroll" },
		});
	}
}
