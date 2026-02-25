/**
 * Adds the Elkan 5e conditions to Foundry.
 */

import {
	CONDITION_DEFS,
	CONDITION_TYPE_REMOVE,
	FILENAME_OVERRIDE,
	IMAGE_EXCLUSIONS,
	REMOVABLE_CONDITION_KEYS,
	RULES_REF,
	STATUS_DEFS,
	STATUS_EFFECT_REMOVE,
	STATUS_ICON_FOLDER,
	STATUS_ICON_KEYS,
} from "./data.mjs";

function imgFor(key, originalPath, folder = "conditions") {
	// normalize once
	const k = String(key ?? "").trim();

	// Always force icons for advantage / disadvantage
	if (k === "advantage") return "icons/svg/upgrade.svg";
	if (k === "disadvantage") return "icons/svg/downgrade.svg";

	// exclusions should also be checked in normalized form
	const lower = k.toLowerCase();
	if (IMAGE_EXCLUSIONS.has(lower)) return originalPath;

	// allow override lookup by exact key OR lowercase key
	const filename = FILENAME_OVERRIDE[k] ?? FILENAME_OVERRIDE[lower] ?? `${lower}.svg`;

	return `modules/elkan5e/icons/${folder}/${filename}`;
}

function statusIconPath(key) {
	return `modules/elkan5e/icons/${STATUS_ICON_FOLDER}/${key}.svg`;
}

function normalizeStatusEffectEntry(key, existingStatus) {
	if (!existingStatus) return { id: key };
	if (typeof existingStatus === "string") return { id: key, img: existingStatus };
	const normalized = { ...existingStatus };
	if (!normalized.id) normalized.id = key;
	return normalized;
}

function getStatusEffectEntry(key) {
	const list = CONFIG.DND5E.statusEffects;
	if (Array.isArray(list)) {
		return list.find((entry) => {
			if (typeof entry === "string") return entry === key;
			const entryKey = entry?.key ?? entry?.id ?? entry?.statusId ?? entry?.name;
			return entryKey === key;
		});
	}
	return list?.[key];
}

function setStatusEffectEntry(key, data) {
	const list = CONFIG.DND5E.statusEffects;
	if (Array.isArray(list)) {
		const index = list.findIndex((entry) => {
			if (typeof entry === "string") return entry === key;
			const entryKey = entry?.key ?? entry?.id ?? entry?.statusId ?? entry?.name;
			return entryKey === key;
		});
		if (index === -1) list.push(data);
		else list[index] = data;
		return;
	}
	list[key] = data;
}

function removeStatusEffectEntry(key) {
	const list = CONFIG.DND5E.statusEffects;
	if (Array.isArray(list)) {
		for (let i = list.length - 1; i >= 0; i -= 1) {
			const entry = list[i];
			if (typeof entry === "string") {
				if (entry === key) list.splice(i, 1);
				continue;
			}
			const entryKey = entry?.key ?? entry?.id ?? entry?.statusId ?? entry?.name;
			if (entryKey === key) list.splice(i, 1);
		}
		return;
	}
	delete list?.[key];
}

function applyStatusIcons() {
	for (const key of STATUS_ICON_KEYS) {
		const icon = statusIconPath(key);
		const conditionType = CONFIG.DND5E.conditionTypes?.[key];
		if (conditionType) conditionType.img = icon;
		const existingStatus = getStatusEffectEntry(key);
		if (!existingStatus) continue;
		const normalized = normalizeStatusEffectEntry(key, existingStatus);
		setStatusEffectEntry(key, {
			...normalized,
			img: icon,
		});
	}
}

function mergeChanges(existing = [], incoming = []) {
	const sig = (c) => `${c.key}|${c.mode}|${c.value}`;
	const map = new Map();
	for (const c of existing || []) map.set(sig(c), c);
	for (const c of incoming || []) map.set(sig(c), c);
	return [...map.values()];
}

function mergeFlags(a = {}, b = {}) {
	const out = foundry.utils.duplicate(a);
	return foundry.utils.mergeObject(out, b, {
		inplace: true,
		recursive: true,
		insertKeys: true,
		overwrite: true,
	});
}

function mirrorStatusEffect(key, def, ct) {
	if (!ct.statusOnly && !def.mirrorStatusEffect) return;
	const existingStatus = getStatusEffectEntry(key);
	const normalized = normalizeStatusEffectEntry(key, existingStatus);
	setStatusEffectEntry(key, {
		...normalized,
		...ct,
	});
}

function applyConditionDef(def, { statusOnly: forcedStatusOnly } = {}) {
	const key = def.id;
	const statusOnly = forcedStatusOnly ?? def.statusOnly ?? Boolean(def.pseudo);
	const registerConditionType = !statusOnly;
	const ct = registerConditionType ? (CONFIG.DND5E.conditionTypes[key] ??= {}) : {};
	ct.name = game.i18n.localize(`elkan5e.conditions.${key}`);

	const reference = def.reference ?? (def.id ? RULES_REF(def.id) : undefined);
	if (reference) ct.reference = reference;
	if (def.icon) {
		ct.img = def.icon;
	} else if (def.image !== false) {
		ct.img = imgFor(key, ct.img);
	}
	if (def.changes?.length) ct.changes = mergeChanges(ct.changes, def.changes);
	if (def.flags) ct.flags = mergeFlags(ct.flags, def.flags);
	if (Array.isArray(def.statuses) && def.statuses.length) {
		ct.statuses = foundry.utils.duplicate(def.statuses);
	}
	// Pass through any extra definition fields (e.g., id, special) unless explicitly handled above.
	const passthrough = { ...def };
	delete passthrough.icon;
	delete passthrough.image;
	delete passthrough.reference;
	delete passthrough.changes;
	delete passthrough.flags;
	delete passthrough.statuses;
	delete passthrough.exclusiveGroup;
	delete passthrough.coverBonus;
	delete passthrough.pseudo;
	delete passthrough.statusOnly;
	delete passthrough.mirrorStatusEffect;
	foundry.utils.mergeObject(ct, passthrough, {
		inplace: true,
		recursive: true,
		insertKeys: true,
		overwrite: true,
	});

	if (def.pseudo != null) ct.pseudo = def.pseudo;
	if (statusOnly) ct.statusOnly = true;

	if (def.exclusiveGroup != null) ct.exclusiveGroup = def.exclusiveGroup;
	if (def.coverBonus != null) ct.coverBonus = def.coverBonus;

	if (!registerConditionType) {
		if (CONFIG.DND5E.conditionTypes?.[key]) {
			delete CONFIG.DND5E.conditionTypes[key];
		}
	}

	return ct;
}

function ensureMidiInvisibleVisionRule() {
	const midiModule = game.modules.get("midi-qol");
	if (!midiModule?.active) return;

	const applyRule = (cfg) => {
		if (!cfg?.optionalRules) return false;
		if (cfg.optionalRules.invisAdvantage === "vision") return false;
		cfg.optionalRules.invisAdvantage = "vision";
		return true;
	};

	let updated = false;

	const midiConfig = globalThis.MidiQOL?.currentConfigSettings;
	if (midiConfig) updated = applyRule(midiConfig) || updated;

	let storedConfig;
	if (game.user?.isGM && typeof game.settings?.get === "function") {
		try {
			storedConfig = foundry.utils.duplicate(game.settings.get("midi-qol", "ConfigSettings"));
			if (storedConfig) updated = applyRule(storedConfig) || updated;
		} catch (err) {
			console.warn("Elkan 5e | Failed to read midi-qol ConfigSettings", err);
		}
	}

	if (!updated) return;

	if (storedConfig && game.user?.isGM && typeof game.settings?.set === "function") {
		game.settings
			.set("midi-qol", "ConfigSettings", storedConfig)
			.catch((err) =>
				console.warn("Elkan 5e | Failed to persist midi invisibility override", err),
			);
	}
}

export function conditions() {
	const conditionsSetting = game.settings.get("elkan5e", "conditionsSettings");

	// Remove extras (a|d)
	const removeExtras = conditionsSetting === "a" || conditionsSetting === "d";
	const applyElkan = conditionsSetting === "a" || conditionsSetting === "b";

	if (removeExtras) {
		for (const key of CONDITION_TYPE_REMOVE) delete CONFIG.DND5E.conditionTypes[key];
		for (const key of STATUS_EFFECT_REMOVE) removeStatusEffectEntry(key);
	}

	// Augment/tweak (a|b)
	if (applyElkan) {
		// Adjust exhaustion
		if (CONFIG.DND5E.conditionTypes.exhaustion) {
			CONFIG.DND5E.conditionTypes.exhaustion.pseudo = false;
			CONFIG.DND5E.conditionTypes.exhaustion.reduction = { rolls: 2, speed: 5 };
			CONFIG.DND5E.conditionTypes.exhaustion.changes = [
				{ key: "system.bonuses.spell.dc", mode: 0, value: "-2" },
			];
		}

		// Undo some core effects you override with midi flags
		const effects = CONFIG.DND5E.conditionEffects;
		if (effects) {
			effects.abilityCheckDisadvantage?.delete?.("exhaustion-1");
			effects.halfMovement?.delete?.("exhaustion-2");
			effects.abilitySaveDisadvantage?.delete?.("exhaustion-3");
			effects.halfHealth?.delete?.("exhaustion-4");
			effects.noMovement?.delete?.("exhaustion-5");
			effects.attackDisadvantage?.delete?.("blinded");
			effects.dexteritySaveDisadvantage?.delete?.("blinded");
			effects.halfMovement?.delete?.("blinded");
			effects.dexteritySaveDisadvantage?.delete?.("deafened");
		}
	}

	for (const def of CONDITION_DEFS) {
		const key = def.id;
		if (removeExtras && REMOVABLE_CONDITION_KEYS.has(key)) continue;
		const ct = applyConditionDef(def);
		mirrorStatusEffect(key, def, ct);
	}
	for (const def of STATUS_DEFS) {
		const key = def.id;
		const ct = applyConditionDef(def, { statusOnly: true });
		mirrorStatusEffect(key, def, ct);
	}
	applyStatusIcons();
}

export function conditionsReady() {
	for (const def of CONDITION_DEFS) {
		const key = def.id;
		const ct = applyConditionDef(def);

		// Mirror into statusEffects for backwards compat
		mirrorStatusEffect(key, def, ct);
	}
	for (const def of STATUS_DEFS) {
		const key = def.id;
		const ct = applyConditionDef(def);
		mirrorStatusEffect(key, def, ct);
	}
	applyStatusIcons();

	ensureMidiInvisibleVisionRule();
}
