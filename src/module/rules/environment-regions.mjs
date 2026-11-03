// Elkan "Environment" region behavior. A GM adds it to a Region and picks an environment from
// the Hazards and Environmental Effects rules (Blizzard, Dense Forest, Lava, ...). Creatures
// inside get the environment's effects and lose them when they leave, and terrain environments
// count as difficult terrain. Nothing is added to the token HUD.

const DialogV2 = foundry.applications.api.DialogV2;
const { StringField } = foundry.data.fields;

export const ENVIRONMENT_BEHAVIOR_TYPE = "elkan5e.environment";
const ENVIRONMENT_FLAG = "environment";

const EFFECT = (id) => `Compendium.elkan5e.elkan5e-effects.ActiveEffect.${id}`;
const STRONG_WIND = EFFECT("elkanstrongwind0");
const SUCKING_GROUND = EFFECT("elkansuckinggrou");
const SUBMERGED_IN_LAVA = EFFECT("elkansubmergedla");

/**
 * `grants` are status ids (from condition/data.mjs) or effect UUIDs (from the Effects compendium),
 * given while inside and removed on leaving. `terrain` lists dnd5e difficult terrain types.
 * `entryCheck` is rolled when a creature enters; it only gets the grants on a failure, and tokens
 * already inside never get them automatically. Hourly and per-minute saves (Extreme Cold, Frigid
 * Water, ...) aren't area effects and are rolled from the rules journal.
 */
export const ENVIRONMENTS = {
	blizzard: { grants: ["obscuredheavily", STRONG_WIND] },
	deepSnow: { terrain: ["snow"] },
	denseForest: { grants: ["obscuredlightly"], terrain: ["plants"] },
	heavyFog: { grants: ["obscuredheavily"] },
	heavyPrecipitation: { grants: ["obscuredlightly"] },
	heavySnowfall: { grants: ["obscuredheavily"] },
	lava: { grants: [SUBMERGED_IN_LAVA] },
	lightFog: { grants: ["obscuredlightly"] },
	looseSand: { terrain: ["sand"] },
	muddyTerrain: { terrain: ["mud"] },
	plantsUndergrowth: { terrain: ["plants"] },
	rockyTerrain: { terrain: ["rocks"] },
	rubbleRocks: { terrain: ["rocks"] },
	sandstorm: { grants: ["obscuredlightly", STRONG_WIND] },
	shallowBog: { terrain: ["liquid"] },
	slipperyIce: { terrain: ["ice"] },
	strongWind: { grants: [STRONG_WIND] },
	suckingGround: {
		grants: [SUCKING_GROUND],
		entryCheck: { skills: ["ath", "acr"], dc: 10 },
	},
	thinIce: { terrain: ["ice"] },
	thornBush: { terrain: ["plants"] },
	thunderstorm: { grants: ["obscuredlightly", STRONG_WIND] },
};

const isEffectUuid = (grant) => grant.startsWith("Compendium.");

/**
 * Grants the token should have from the Elkan environment regions it is in.
 *
 * @param {TokenDocument} token - Token.
 * @param {object} [options] - Options.
 * @param {RegionDocument} [options.excludeRegion] - Region to ignore (being left or deleted).
 * @param {RegionBehavior} [options.excludeBehavior] - Behavior to ignore (being deleted).
 * @param {boolean} [options.includeEntryChecks] - Include grants that need an entry check.
 * @returns {Set<string>} Status ids and effect UUIDs.
 */
function environmentGrants(token, { excludeRegion, excludeBehavior, includeEntryChecks } = {}) {
	const grants = new Set();
	for (const region of token.regions ?? []) {
		if (region === excludeRegion) continue;
		for (const behavior of region.behaviors ?? []) {
			if (behavior === excludeBehavior || behavior.disabled) continue;
			if (behavior.type !== ENVIRONMENT_BEHAVIOR_TYPE) continue;
			const environment = ENVIRONMENTS[behavior.system.environment];
			if (!environment || (environment.entryCheck && !includeEntryChecks)) continue;
			for (const id of environment.grants ?? []) grants.add(id);
		}
	}
	return grants;
}

/**
 * Gives an actor a status or compendium effect from an environment, unless it already has it.
 * The created effect is flagged with the grant so it can be removed when the token leaves.
 *
 * @param {Actor} actor - Actor.
 * @param {string} id - Status id or effect UUID.
 * @returns {Promise<void>}
 */
async function grant(actor, id) {
	const EffectClass = CONFIG.ActiveEffect.documentClass;
	let data;
	if (isEffectUuid(id)) {
		if (actor.effects.some((e) => e._stats?.compendiumSource === id)) return;
		const source = await fromUuid(id);
		if (!source) return;
		data = source.toObject();
		delete data._id;
		data._stats.compendiumSource = id;
	} else {
		if (actor.statuses.has(id) || !CONFIG.statusEffects[id]) return;
		data = (await EffectClass.fromStatusEffect(id, { parent: actor })).toObject();
	}
	foundry.utils.setProperty(data, `flags.elkan5e.${ENVIRONMENT_FLAG}`, id);
	await EffectClass.create(data, { parent: actor, keepId: !isEffectUuid(id) });
}

/**
 * Removes environment effects the token no longer gets from any region, and optionally adds
 * the ones it should have.
 *
 * @param {TokenDocument} token - Token.
 * @param {object} [options] - Same as environmentGrants, plus `add`.
 * @returns {Promise<void>}
 */
async function syncToken(token, { add = true, ...options } = {}) {
	const actor = token.actor;
	if (!actor) return;
	const kept = environmentGrants(token, { ...options, includeEntryChecks: true });
	const stale = actor.effects.filter((e) => {
		const from = e.getFlag("elkan5e", ENVIRONMENT_FLAG);
		return from && !kept.has(from);
	});
	if (stale.length) {
		await actor.deleteEmbeddedDocuments(
			"ActiveEffect",
			stale.map((e) => e.id),
		);
	}
	if (!add || token.disposition === CONST.TOKEN_DISPOSITIONS.SECRET) return;
	for (const g of environmentGrants(token, options)) await grant(actor, g);
}

/**
 * Resyncs every token in a region, on the active GM only.
 *
 * @param {RegionDocument} region - Region.
 * @param {object} [options] - Passed to syncToken.
 * @returns {Promise<void>}
 */
async function syncRegionTokens(region, options = {}) {
	if (!game.users.activeGM?.isSelf || !region) return;
	for (const token of region.tokens ?? []) await syncToken(token, options);
}

/**
 * Rolls an environment's entry check, letting the player pick the skill when there's a choice.
 *
 * @param {Actor} actor - Actor entering.
 * @param {{skills: string[], dc: number}} check - Entry check.
 * @param {string} label - Environment name.
 * @returns {Promise<boolean>} Whether the check succeeded. Closing the prompt counts as a failure.
 */
async function rollEntryCheck(actor, { skills, dc }, label) {
	let skill = skills[0];
	if (skills.length > 1) {
		skill = await DialogV2.wait({
			window: { title: label },
			content: `<p>${game.i18n.format("elkan5e.environment.entryCheck", { name: actor.name, dc })}</p>`,
			buttons: skills.map((s, i) => ({
				action: s,
				label: CONFIG.DND5E.skills[s]?.label ?? s,
				default: i === 0,
			})),
			rejectClose: false,
		});
		if (!skill) return false;
	}
	const rolls = await actor.rollSkill({ skill, target: dc });
	const roll = Array.isArray(rolls) ? rolls[0] : rolls;
	return Boolean(roll && roll.total >= dc);
}

/**
 * Applies the environment when a token enters, after its entry check if it has one.
 *
 * @param {object} event - Region token enter event.
 * @this {EnvironmentRegionBehaviorType} Behavior system data.
 */
async function onTokenEnter(event) {
	if (!event.user.isSelf) return;
	const { token, movement } = event.data;
	const actor = token.actor;
	const { grants, entryCheck } = this.definition;
	if (!actor || !grants?.length) return;
	if (token.disposition === CONST.TOKEN_DISPOSITIONS.SECRET) return;

	const resume = movement ? token.pauseMovement() : undefined;
	if (entryCheck) {
		const label = game.i18n.localize(`elkan5e.environment.types.${this.environment}`);
		if (await rollEntryCheck(actor, entryCheck, label)) {
			await resume?.();
			return;
		}
		for (const g of grants) await grant(actor, g);
		token.stopMovement?.();
		return;
	}
	for (const g of grants) await grant(actor, g);
	await resume?.();
}

/**
 * Removes the environment's statuses when a token leaves, unless another region still gives them.
 *
 * @param {object} event - Region token exit event.
 * @this {EnvironmentRegionBehaviorType} Behavior system data.
 */
async function onTokenExit(event) {
	if (!event.user.isSelf) return;
	await syncToken(event.data.token, { add: false, excludeRegion: this.region });
}

/**
 * Recalculates planned movement paths when the terrain changes, as dnd5e's Difficult Terrain does.
 *
 * @this {EnvironmentRegionBehaviorType} Behavior system data.
 */
async function onTerrainChanged() {
	if (this.definition.terrain?.length) canvas.tokens?.recalculatePlannedMovementPaths();
}

export class EnvironmentRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {
	/** @override */
	static defineSchema() {
		return {
			environment: new StringField({
				required: true,
				blank: false,
				initial: "strongWind",
				choices: () =>
					Object.fromEntries(
						Object.keys(ENVIRONMENTS)
							.map((key) => [
								key,
								game.i18n.localize(`elkan5e.environment.types.${key}`),
							])
							.sort((a, b) => a[1].localeCompare(b[1], game.i18n.lang)),
					),
			}),
		};
	}

	/** @returns {object} The selected environment's definition. */
	get definition() {
		return ENVIRONMENTS[this.environment] ?? {};
	}

	/** @override */
	_getTerrainEffects(token) {
		const types = new Set(this.definition.terrain ?? []);
		if (!types.size || token.disposition === CONST.TOKEN_DISPOSITIONS.SECRET) return [];
		const ignored =
			token.actor?.system.attributes?.movement?.ignoredDifficultTerrain ?? new Set();
		if (ignored.has("all") || ignored.has("nonmagical") || !types.difference(ignored).size) {
			return [];
		}
		return [{ name: "difficultTerrain" }];
	}

	/** @inheritDoc */
	_onCreate(data, options, userId) {
		super._onCreate(data, options, userId);
		void syncRegionTokens(this.region);
	}

	/** @inheritDoc */
	_onUpdate(changed, options, userId) {
		super._onUpdate(changed, options, userId);
		if (!("system" in changed) && !("disabled" in changed)) return;
		canvas.tokens?.recalculatePlannedMovementPaths();
		void syncRegionTokens(this.region);
	}

	/** @inheritDoc */
	_onDelete(options, userId) {
		super._onDelete(options, userId);
		void syncRegionTokens(this.region, { add: false, excludeBehavior: this.behavior });
	}
}

EnvironmentRegionBehaviorType.LOCALIZATION_PREFIXES = ["elkan5e.environment.behavior"];
EnvironmentRegionBehaviorType.events = {
	[CONST.REGION_EVENTS.TOKEN_ENTER]: onTokenEnter,
	[CONST.REGION_EVENTS.TOKEN_EXIT]: onTokenExit,
	[CONST.REGION_EVENTS.BEHAVIOR_VIEWED]: onTerrainChanged,
	[CONST.REGION_EVENTS.BEHAVIOR_UNVIEWED]: onTerrainChanged,
	[CONST.REGION_EVENTS.REGION_BOUNDARY]: onTerrainChanged,
};

/**
 * Registers the Environment region behavior. Call during init.
 */
export function registerEnvironmentRegions() {
	CONFIG.RegionBehavior.dataModels[ENVIRONMENT_BEHAVIOR_TYPE] = EnvironmentRegionBehaviorType;
	CONFIG.RegionBehavior.typeIcons[ENVIRONMENT_BEHAVIOR_TYPE] = "fa-solid fa-cloud-sun-rain";
}

/**
 * Removes environment statuses from tokens in a deleted region. Hook: deleteRegion.
 *
 * @param {RegionDocument} region - Deleted region.
 * @returns {Promise<void>}
 */
export async function clearEnvironmentRegion(region) {
	await syncRegionTokens(region, { add: false, excludeRegion: region });
}
