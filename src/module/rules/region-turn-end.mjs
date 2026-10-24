/**
 * Midi-QOL's region activities ("enters the area for the first time on a turn or ends its turn
 * there, but not both") remember the combat turn a creature was affected on. A creature's
 * turn-end trigger runs after the combat has already moved to the next turn, so Midi-QOL compares
 * against the wrong turn and affects a creature again at the end of the turn it entered on. It
 * also records the new turn, which blocks entering on that next turn.
 *
 * During a turn-end trigger, this checks and records against the turn that just ended.
 */
export function fixRegionTurnEnd() {
	const Behavior = CONFIG.RegionBehavior?.dataModels?.["midi-qol.regionActivity"];
	const proto = Behavior?.prototype;
	if (!proto?._executeRulesForTrigger || !proto._hasTriggeredThisTurn) return;
	if (!proto._markTriggeredThisTurn || proto._elkan5eTurnEndFixed) return;
	proto._elkan5eTurnEndFixed = true;

	const execute = proto._executeRulesForTrigger;
	const hasTriggered = proto._hasTriggeredThisTurn;
	const markTriggered = proto._markTriggeredThisTurn;

	// The turn that just ended, while a turn-end trigger runs.
	const endedTurn = (behavior) => {
		if (!behavior._elkan5eTurnEnd) return null;
		const previous = game.combat?.previous;
		if (previous?.round == null || previous?.turn == null) return null;
		return `${previous.round}.${previous.turn}`;
	};
	// Midi-QOL's flag key for this creature and activity, found by its parts.
	const triggerKey = (behavior, actor, activityUuid) => {
		const stored =
			game.combat?.getFlag("midi-qol", `regionTriggers.${behavior.parent?.id}`) ?? {};
		const activityKey = behavior._activityKeyFromUuid?.(activityUuid);
		return Object.keys(stored).find(
			(key) => key.includes(actor.id) && key.includes(activityKey),
		);
	};

	proto._executeRulesForTrigger = async function (token, trigger, ...args) {
		this._elkan5eTurnEnd = trigger === "turnEnd";
		try {
			return await execute.call(this, token, trigger, ...args);
		} finally {
			this._elkan5eTurnEnd = false;
		}
	};

	proto._hasTriggeredThisTurn = function (actor, activityUuid, ...args) {
		const ended = endedTurn(this);
		if (!ended || !actor) return hasTriggered.call(this, actor, activityUuid, ...args);
		const key = triggerKey(this, actor, activityUuid);
		if (!key) return false;
		const stored = game.combat.getFlag("midi-qol", `regionTriggers.${this.parent.id}`);
		return stored?.[key] === ended;
	};

	proto._markTriggeredThisTurn = async function (actor, activityUuid, ...args) {
		const result = await markTriggered.call(this, actor, activityUuid, ...args);
		const ended = endedTurn(this);
		const key = ended && actor ? triggerKey(this, actor, activityUuid) : null;
		if (key) {
			await game.combat.setFlag("midi-qol", `regionTriggers.${this.parent.id}`, {
				[key]: ended,
			});
		}
		return result;
	};
}
