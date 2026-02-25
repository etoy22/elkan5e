import { rmvMeldShadow, rmvhijackShadow } from "../module/classes/index.mjs";

export function registerCombatHooks() {
	// End of turn (Monk shadow meld cleanup)
	Hooks.on("combatTurnChange", (combat, prior) => {
		try {
			const lastActor = combat.combatants.get(prior.combatantId).actor;
			rmvMeldShadow(lastActor);
			rmvhijackShadow(lastActor);
		} catch (error) {
			console.error("Elkan 5e | Error in combatTurnChange hook:", error);
		}
	});
}
