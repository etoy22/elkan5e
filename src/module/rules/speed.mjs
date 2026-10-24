/**
 * Registers custom movement types with the dnd5e system.
 * Must be called during the "init" hook so the types are in place
 * before actor data models are built.
 */
export function speed() {
	// Values are i18n keys, matching the pattern dnd5e uses for its built-in types.
	// The labels are defined in lang/en.json under elkan5e.movement.
	const MOVEMENT_TYPES = {
		crawl: { label: "elkan5e.movement.crawl" },
	};
	Object.assign(CONFIG.DND5E.movementTypes, MOVEMENT_TYPES);
	letElkanGrapplesSetSpeed();
	useCrawlSpeedForCrawling();
}

/**
 * dnd5e charges double movement for crawling. A creature with a crawl speed crawls at normal cost.
 */
function useCrawlSpeedForCrawling() {
	const crawl = CONFIG.Token.movement.actions.crawl;
	const getCostFunction = crawl?.getCostFunction;
	if (!getCostFunction) return;
	crawl.getCostFunction = (token, ...args) => {
		if (token?.actor?.system.attributes?.movement?.speeds?.crawl > 0) return (cost) => cost;
		return getCostFunction(token, ...args);
	};
}

/**
 * dnd5e always sets a grappled creature's speed to 0. Elkan grapples set the speed themselves
 * (0 when grappled by a same-or-larger creature, half when grappled by a smaller one, unchanged
 * when it's two sizes smaller), so while every grappled effect on the creature comes from an Elkan
 * grapple, dnd5e's rule is skipped and the grapple's own speed multiplier applies.
 */
function letElkanGrapplesSetSpeed() {
	const AttributesFields = globalThis.dnd5e?.dataModels?.actor?.AttributesFields;
	const prepareMovement = AttributesFields?.prepareMovement;
	const noMovement = CONFIG.DND5E.conditionEffects?.noMovement;
	if (!prepareMovement || !noMovement?.has?.("grappled")) return;
	AttributesFields.prepareMovement = function (...args) {
		const actor = this.parent;
		const grappledEffects = (actor?.effects ?? []).filter(
			(e) => e.active && e.statuses?.has("grappled") && !e.flags?.dae?.autoCreated,
		);
		const onlyElkanGrapples =
			grappledEffects.length > 0 &&
			grappledEffects.every((e) => e.flags?.elkan5e?.grapple?.grapplerUuid);
		if (!onlyElkanGrapples || !noMovement.has("grappled")) {
			return prepareMovement.apply(this, args);
		}
		noMovement.delete("grappled");
		try {
			return prepareMovement.apply(this, args);
		} finally {
			noMovement.add("grappled");
		}
	};
}
