import { measureRangeDistance, offerItemUse, t } from "../shared/helpers.mjs";

const ALLY_RANGE = 60;

/**
 * Finds an actor's item by identifier, if it has a use left.
 *
 * @param {Actor} actor - Actor to search.
 * @param {string} identifier - Item identifier.
 * @returns {Item|null}
 */
function readyItem(actor, identifier) {
	const item = actor?.items.find((i) => i.system?.identifier === identifier);
	return item?.system.uses?.value > 0 ? item : null;
}

/**
 * Whether an actor is able to take a reaction right now.
 *
 * @param {Actor} actor - Actor to check.
 * @returns {boolean}
 */
function canReact(actor) {
	const midi = globalThis.MidiQOL;
	if (midi?.checkIncapacitated?.(actor, false, false)) return false;
	return !(game.combat && midi?.hasUsedReaction?.(actor));
}

/**
 * Finds tokens allied to `token`, within range of it, whose actor has a ready reaction item.
 *
 * @param {Token} token - Token the reaction would help.
 * @param {string} identifier - Identifier of the reaction item.
 * @returns {{token: Token, item: Item}[]}
 */
function alliedReactors(token, identifier) {
	if (!canvas?.tokens || !token) return [];
	return canvas.tokens.placeables.flatMap((other) => {
		if (other === token || other.actor === token.actor) return [];
		if (other.document.disposition !== token.document.disposition) return [];
		const item = readyItem(other.actor, identifier);
		if (!item || !canReact(other.actor)) return [];
		if (measureRangeDistance(other, token) > ALLY_RANGE) return [];
		return [{ token: other, item }];
	});
}

/**
 * Sailor's Vigilance: after a creature with the feature rolls initiative, offers to reroll it,
 * keeping the higher result.
 *
 * @param {ChatMessage} message - Created chat message.
 * @param {string} userId - Id of the user who created the message.
 * @returns {Promise<void>}
 */
export async function sailorVigilance(message, userId) {
	if (userId !== game.user.id || !message.getFlag("core", "initiativeRoll")) return;
	const combat = game.combat;
	const { token: tokenId, actor: actorId } = message.speaker ?? {};
	const combatant = combat?.combatants.find((c) =>
		tokenId ? c.tokenId === tokenId : c.actorId === actorId,
	);
	const actor = combatant?.actor;
	const item = readyItem(actor, "sailors-vigilance");
	if (!item || !canReact(actor) || combatant.initiative === null) return;

	const current = combatant.initiative;
	const used = await offerItemUse(
		item,
		t("elkan5e.background.sailorsVigilancePrompt", { name: actor.name, total: current }),
		{ reaction: true },
	);
	if (!used) return;

	const roll = combatant.getInitiativeRoll();
	await roll.evaluate();
	const best = Math.max(current, roll.total);
	if (best !== current) await combatant.update({ initiative: best });
	await roll.toMessage({
		speaker: message.speaker,
		flavor: t("elkan5e.background.sailorsVigilanceResult", { item: item.name, total: best }),
	});
}

/**
 * Coordinating Direction: after a creature makes a skill check, offers an ally within 60 ft. with
 * the feature the chance to have them reroll it, keeping the higher result.
 *
 * @param {D20Roll[]} rolls - Skill check rolls.
 * @param {object} data - Roll data from the dnd5e.rollSkillV2 hook.
 * @returns {Promise<void>}
 */
export async function coordinatingDirection(rolls, { skill, subject } = {}) {
	const roll = rolls?.[0];
	const token = subject?.getActiveTokens()?.[0];
	if (!roll || !skill || !token) return;
	const skillLabel = CONFIG.DND5E.skills[skill]?.label ?? skill;

	for (const { item } of alliedReactors(token, "coordinating-direction")) {
		const used = await offerItemUse(
			item,
			t("elkan5e.background.coordinatingDirectionPrompt", {
				name: item.actor.name,
				ally: subject.name,
				skill: skillLabel,
				total: roll.total,
			}),
			{ reaction: true },
		);
		if (!used) continue;
		const reroll = await roll.reroll();
		await reroll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: subject }),
			flavor: t("elkan5e.background.coordinatingDirectionResult", {
				item: item.name,
				name: item.actor.name,
				skill: skillLabel,
				total: Math.max(roll.total, reroll.total),
			}),
		});
		return;
	}
}

/**
 * Sudden Warning: when allies fail a Dexterity save, offers a creature with the feature the chance
 * to let every allied creature within 60 ft. of it that failed reroll the save.
 *
 * @param {Workflow} workflow - Midi-QOL workflow, after saves are checked.
 * @returns {Promise<void>}
 */
export async function suddenWarning(workflow) {
	const save = workflow?.saveActivity?.save;
	const abilities = save?.ability instanceof Set ? save.ability : new Set([save?.ability]);
	if (!abilities.has("dex") || !workflow.failedSaves?.size || !canvas?.tokens) return;
	const dc = save.dc?.value;
	if (!Number.isFinite(dc)) return;

	for (const holder of canvas.tokens.placeables) {
		const item = readyItem(holder.actor, "sudden-warning");
		if (!item || !canReact(holder.actor)) continue;
		const allies = [...workflow.failedSaves].filter(
			(target) =>
				target !== holder &&
				target.actor !== holder.actor &&
				target.document.disposition === holder.document.disposition &&
				measureRangeDistance(holder, target) <= ALLY_RANGE,
		);
		if (!allies.length) continue;

		const used = await offerItemUse(
			item,
			t("elkan5e.background.suddenWarningPrompt", {
				name: holder.actor.name,
				allies: allies.map((a) => a.name).join(", "),
			}),
			{ reaction: true },
		);
		if (!used) continue;

		const results = [];
		for (const ally of allies) {
			const original = workflow.targetSaveDetails?.[ally.document.uuid]?.saveRoll;
			if (!original) continue;
			const reroll = await original.reroll();
			const saved = reroll.total >= dc;
			workflow.updateSaveFailSets(ally, saved);
			workflow.saveDisplayData = (workflow.saveDisplayData ?? []).filter(
				(e) => e.id !== ally.id,
			);
			await workflow.buildSaveDisplayEntry(ally, reroll, saved, dc);
			results.push(
				t(
					saved
						? "elkan5e.background.suddenWarningSaved"
						: "elkan5e.background.suddenWarningFailed",
					{
						name: ally.name,
						total: reroll.total,
					},
				),
			);
		}
		if (results.length) {
			await ChatMessage.create({
				speaker: ChatMessage.getSpeaker({ actor: holder.actor }),
				content: `<p><strong>${item.name}</strong></p><p>${results.join("<br>")}</p>`,
			});
		}
	}
}
