import { chooseDefenderSkill, sizeIndex, isPushBlocked, hasPushResist } from "../global.mjs";
import { endAllGrapplesForActor } from "./grapple.mjs";

const t = (key, data) => (data ? game.i18n.format(key, data) : game.i18n.localize(key));

/**
 * Applies push rule behavior.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @param {*} acr - Acr.
 * @param {*} distance - Distance.
 * @param {*} choice - Choice.
 * @param {*} sourcePointOrSkiped - Source Point Or Skiped.
 * @param {*} skiped - Skiped.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function push(
	workflow,
	acr = false,
	distance = 5,
	choice = 0,
	sourcePointOrSkiped = null,
	skiped = false,
) {
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
	const sourcePointInput = typeof sourcePointOrSkiped === "boolean" ? null : sourcePointOrSkiped;
	const skipContestedRoll =
		typeof sourcePointOrSkiped === "boolean" ? sourcePointOrSkiped : skiped;
	const resolvedSourcePoint = resolveSourcePoint(
		sourcePointInput ?? workflow?.pushSourcePoint,
		token,
	);

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
		if (skipContestedRoll) {
			await onSuccess(token, targetToken);
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
