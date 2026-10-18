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
	keepCrawlSpeedWhileProne();
	applyJumpMultiplier();
	letElkanGrapplesSetSpeed();
	useCrawlSpeedForCrawling();
}

/**
 * dnd5e derives the jump distance from Strength during data preparation, after active effects
 * apply, so an effect can't multiply it directly. Effects set flags.elkan5e.jumpMultiplier
 * instead (e.g. the Jump spell triples it), and it's applied once movement is prepared.
 */
function applyJumpMultiplier() {
	const AttributesFields = globalThis.dnd5e?.dataModels?.actor?.AttributesFields;
	const prepareMovement = AttributesFields?.prepareMovement;
	if (!prepareMovement) return;
	AttributesFields.prepareMovement = function (...args) {
		prepareMovement.apply(this, args);
		const multiplier = Number(this.parent?.flags?.elkan5e?.jumpMultiplier);
		if (!(multiplier > 0) || multiplier === 1) return;
		const speeds = this.attributes.movement.speeds;
		if (typeof speeds.jump === "number") speeds.jump *= multiplier;
	};
}

/**
 * dnd5e sets every speed except walking to 0 while a creature is prone (its "crawl" condition
 * effect), which would also zero a crawl speed. Restores the crawl speed, capped at the
 * creature's walking speed so it keeps the same reductions.
 */
function keepCrawlSpeedWhileProne() {
	const AttributesFields = globalThis.dnd5e?.dataModels?.actor?.AttributesFields;
	const prepareMovement = AttributesFields?.prepareMovement;
	if (!prepareMovement) return;
	AttributesFields.prepareMovement = function (rollData = this.parent.getRollData()) {
		const crawl = this.attributes.movement.speeds.crawl;
		prepareMovement.call(this, rollData);
		const actor = this.parent;
		if (!actor.hasConditionEffect("crawl") || actor.hasConditionEffect("noMovement")) return;
		const base = dnd5e.utils.simplifyBonus(crawl, rollData);
		if (!(base > 0)) return;
		const movement = this.attributes.movement;
		movement.speeds.crawl = Math.min(base, movement.speeds.walk);
		movement.max = Math.max(movement.max, movement.speeds.crawl);
	};
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
