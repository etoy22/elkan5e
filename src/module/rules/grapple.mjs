import { chooseDefenderSkill, sizeIndex } from "../global.mjs";

const imgForCondition = (key) => `modules/elkan5e/icons/conditions/${key}.svg`;
const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));

/**
 * Check whether an ActiveEffect includes a given status id.
 * @param {ActiveEffect} effect
 * @param {string} statusId
 * @returns {boolean}
 */
const hasStatus = (effect, statusId) => {
	const statuses = effect?.statuses;
	if (!statuses) return false;
	if (typeof statuses.has === "function") return statuses.has(statusId);
	if (Array.isArray(statuses)) return statuses.includes(statusId);
	return false;
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
const getClimbSpeed = (actor) =>
	Number(actor?.system?.attributes?.movement?.climb ?? 0);

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
			(e) => e?.origin === grapplerActor.uuid && hasStatus(e, "grappled"),
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

/**
 * Perform a contested grapple against each targeted creature.
 * @param {object} workflow
 * @param {boolean} [acr=false] - If true, use Acrobatics instead of Athletics.
 * @returns {Promise<void>}
 */
export async function grapple(workflow, acr = false) {
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
	const grapplerAbility =
		grapplerSkillKey === "acr"
			? t("elkan5e.skills.acrobatics")
			: t("elkan5e.skills.athletics");
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
			name: game.i18n.localize("elkan5e.conditions.grappled") || t("elkan5e.grapple.grappled"),
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
		ui.notifications.info(
			t("elkan5e.grapple.notifications.grappled", {
				grappler: grappler.name,
				target: targetActor.name,
			}),
		);
	};

	for (const targetToken of workflow.targets) {
		const targetActor = targetToken?.actor;
		if (!targetActor) continue;

		const targetSkill = chooseDefenderSkill(targetActor);
		const targetSize = sizeIndex(targetActor);
		const sizeDiff = grapplerSize - targetSize;

		const grapplerAdv = grapplerSize > targetSize;
		const targetAdv = targetSize > grapplerSize;

		const targetAbility =
			targetSkill === "acr"
				? t("elkan5e.skills.acrobatics")
				: t("elkan5e.skills.athletics");

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
