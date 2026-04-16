/**
 * Applies refs rule behavior.
 *
 */
export function refs() {
	setupGeneralRefs();
	setupCombatRefs();
	setupDamageRefs();
	setupSpellRefs();
	setupCreatureTypeRefs();
	setupMovementRefs();
	setupActionsRefs();
	setupVisionLightRefs();
	setupSizeTagsItemRefs();
	setupPoisonsRef();
	setupD20Refs();
	setupConditionRefs();
	setupRestRefs();
	setupSocialMechanicsRefs();
	setuptrapsRefs();
	setupHazardRefs();
	setupItemsRefs();
	setupMonsterRefs();
}

/**
 * Registers setup Combat Refs configuration.
 *
 */
function setupCombatRefs() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.";
	const COMBAT_REFS = [
		{ key: "attack", id: "IauYsEM9MxyZCIdc" },
		{ key: "opportunityattacks", id: "5zEWVU1yw2Sv3hSI" },
		{ key: "dodge", id: "2Fxm6ATuDUyDIrt7" },
		{ key: "dash", id: "6UWCRY83phLnc7cF" },
		{ key: "disengage", id: "bYoY0gZQArDraXRs" },
		{ key: "help", id: "ZdoIWQgcoqcHlZSf" },
		{ key: "hide", id: "57VIppmrOewNVKF5" },
		{ key: "influence", id: "tQyGfgGBXBSz2UBe" },
		{ key: "ready", id: "Uo0qriXzk4YInJrl" },
		{ key: "search", id: "bRo3ci56JJiuxYk8" },
		{ key: "study", id: "LAZotCjxu5Y9BIkK" },
		{ key: "surprise", id: "QOZeW0m8RCdVg6UE" },
		{ key: "unarmedstrike", id: "pRDNsHpNLLk1Qq58" },
		{ key: "twoweaponfighting", id: "XLZbNEhoayCw5bk8" },
	];
	if (!CONFIG.DND5E.rules) CONFIG.DND5E.rules = {};
	COMBAT_REFS.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.rules[key] = { reference: base + id };
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign combat reference for key '${key}':`, e);
		}
	});
	CONFIG.DND5E.rules.hitpoints =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.ndoKj9SzjOvxOI3J";
	CONFIG.DND5E.rules.damagerolls =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.mlywbrr1G8qdxbE7";
	CONFIG.DND5E.rules.criticalhits =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.kS19vAy9DQYUpp2X";
	CONFIG.DND5E.rules.damagetypes =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.qsBGDPv1hDjzIPnc";
	CONFIG.DND5E.rules.damageresistance =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.MGw7hOo14k9MWvyy";
	CONFIG.DND5E.rules.damagevulnerability =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.TBWKBQBOoRASIEsC";
	CONFIG.DND5E.rules.healing =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.jLAG02U8x7MGm3u0";
	CONFIG.DND5E.rules.instantdeath =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.EmlapwlGtPJP8US0";
	CONFIG.DND5E.rules.knockingacreatureout =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.unGgf3TA3iSawYAn";
	CONFIG.DND5E.rules.temporaryhitpoints = CONFIG.DND5E.rules.temphp =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.77jn4POOPOWB3Iq8";
	CONFIG.DND5E.rules.deathsavingthrows = CONFIG.DND5E.rules.deathsaves =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.lr1K8jG4k0ExfWDh";
	CONFIG.DND5E.rules.stabilizing =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.fi7JLEcAIaVk9oG2";
	CONFIG.DND5E.rules.initiative =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.RcwElV4GAcVXKWxo";
	CONFIG.DND5E.rules.push =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.Hni8DjqLzoqsVjb6";
	CONFIG.DND5E.rules.armorclass =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.WtFgf9tz3JffM9eW";
	CONFIG.DND5E.rules.resistance =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.MGw7hOo14k9MWvyy";

	CONFIG.DND5E.rules.attackrolls =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.U0l9yEH5nKJLmEk4";
	CONFIG.DND5E.rules.unseenattackers =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.957495fd15c2442c";
	CONFIG.DND5E.rules.unseentargets =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.42024d517ed74343";
	CONFIG.DND5E.rules.rangedattacks =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.968ecabc00da46a6";
	CONFIG.DND5E.rules.range =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.bb8bf45ae58b4b93";
	CONFIG.DND5E.rules.rangedattacksinclosecombat =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.8b81f04c94844fe8";
	CONFIG.DND5E.rules.meleeattacks =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.b8dedcdc5391436e";
	CONFIG.DND5E.rules.underwatercombat =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.4431441097204ba4";
	CONFIG.DND5E.rules.shoving =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.f8e1abf1567a428d";
	CONFIG.DND5E.rules.damagethreshold =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.e177956853ce4a88";
}

/**
 * Registers setup Damage Refs configuration.
 *
 */
function setupDamageRefs() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.";
	const DAMAGE_TYPES = [
		{ key: "acid", id: "VKYjrEO909FEbScG" },
		{ key: "bludgeoning", id: "DLkhjyAJK6R1lPrA" },
		{ key: "cold", id: "qnctn4Gcve0px0wU" },
		{ key: "lightning", id: "inNJv5hIxFOb0atF" },
		{ key: "fire", id: "8ZmYsUdejP3wal1K" },
		{ key: "force", id: "hnbcchv13gA0ev8j" },
		{ key: "necrotic", id: "3WAI4TbrSC8FS637" },
		{ key: "piercing", id: "cEnkMbQascSe6lKU" },
		{ key: "poison", id: "Mh0WKYgypPl7hKSo" },
		{ key: "psychic", id: "DiUkrQVun34pAK4Z" },
		{ key: "radiant", id: "1iv5sIBnKoFJrhMH" },
		{ key: "slashing", id: "yxrHRnhVdSzKtzyZ" },
		{ key: "thunder", id: "kPmCUWoSWv3lEW3t" },
	];
	if (!CONFIG.DND5E.damageTypes) CONFIG.DND5E.damageTypes = {};
	DAMAGE_TYPES.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.damageTypes[key].reference = base + id;
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign damage reference for key '${key}':`, e);
		}
	});
}

/**
 * Registers setup Spell Refs configuration.
 *
 */
function setupSpellRefs() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.";
	const SPELL_REFS = [
		{ key: "spellslots", id: "RAatADW6Izlm9yu6" },
		{ key: "spelllevel", id: "RAatADW6Izlm9yu6" },
		{ key: "cantrips", id: "UnQ8KUMYK3a6BWwu" },
		{ key: "upcasting", id: "wvECxDLurbCDec4h" },
		{ key: "castingatahigherlevel", id: "wvECxDLurbCDec4h" },
		{ key: "multiplespellsinaturn", id: "Rxjj26a4VyVnZYk9" },
		{ key: "duplicatemagicaleffects", id: "uWa3L8lGJKgICYHt" },
		{ key: "lineofsight", id: "5V7gVZ9fe5AWawwb" },
		{ key: "coverandwalls", id: "2QBRvP0XH1PBboSs" },
		{ key: "castinginarmor", id: "kwjLwbgZuqdcj17X" },
		{ key: "castingtime", id: "1H5OBLq2k7EmNowe" },
		{ key: "spelltargets", id: "HHfnotH75EXQ9zsP" },
		{ key: "spellrange", id: "rM1U1uAq2GD0ls8a" },
		{ key: "verbal", id: "wvyS2GRHioSYrMW0" },
		{ key: "spellduration", id: "KywepPZfytUpWKql" },
		{ key: "illusoryimages", id: "GtUH7c2Spk6XpU3B" },
		{ key: "illusionchecks", id: "GtUH7c2Spk6XpU3B" },
		{ key: "knownspells", id: "qUZNQFDTomNDA9bv" },
		{ key: "preparedspells", id: "tvQAz6EC8cGVKRYi" },
		{ key: "abilityspells", id: "arD4KLvgCPbi1Pl7" },
		{ key: "focusspells", id: "R25K8TvAPK3c4ywr" },
		{ key: "spellscroll", id: "R25K8TvAPK3c4ywr" },
		{ key: "cursed", id: "Vpwu9GQC6HVNZFze" },
		{ key: "curses", id: "Vpwu9GQC6HVNZFze" },
	];
	if (!CONFIG.DND5E.rules) CONFIG.DND5E.rules = {};
	SPELL_REFS.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.rules[key] = { reference: base + id };
		} catch (e) {
			console.warn(`Elkan 5e | Failed to assign spellcasting reference for key '${key}':`, e);
		}
	});
	const ITEM_PROPERTIES = [
		{ key: "material", id: "gdVkgCiREuukVhLb" },
		{ key: "ritual", id: "CMI1OFzBkvjEmlj7" },
		{ key: "vocal", id: "wvyS2GRHioSYrMW0" },
		{ key: "somatic", id: "ooFAPmKTS7Cd6YXp" },
	];
	if (!CONFIG.DND5E.itemProperties) CONFIG.DND5E.itemProperties = {};
	ITEM_PROPERTIES.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.itemProperties[key].reference = base + id;
		} catch (e) {
			console.warn(
				`Elkan 5e | Failed to assign spellcasting item property for key '${key}':`,
				e,
			);
		}
	});
	CONFIG.DND5E.rules.components =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.kyqu4XQqGZqDCPXk";
	CONFIG.DND5E.rules.rituals =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.CMI1OFzBkvjEmlj7";
	CONFIG.DND5E.rules.schoolsofmagic =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.sCJqoQlaDzseYmXn";

	CONFIG.DND5E.rules.castaspell =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.828ee027436f41bc";
	CONFIG.DND5E.rules.bonusactioncasting =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.bc1522abf9ea49e6";
	CONFIG.DND5E.rules.reactioncasting =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.469656e160c446ef";
	CONFIG.DND5E.rules.longercastingtimes =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.28a57fd736314002";
	CONFIG.DND5E.rules.instantaneous =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.b2ddf771c3224652";
	CONFIG.DND5E.rules.areaofeffect =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.6cd6ae7b9a85475e";
	CONFIG.DND5E.rules.pointoforigin =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.c4e7fedf8c704a64";
	CONFIG.DND5E.rules.spellsavingthrows =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.00913e9d018149d8";
	CONFIG.DND5E.rules.spellattackrolls =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.9c41fb3701a043f8";
	CONFIG.DND5E.rules.itemspells =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.Vb2ZZXVGAa2KkPrG.JournalEntryPage.224baeb99c3b48a7";
}

/**
 * Registers setup Creature Type Refs configuration.
 *
 */
function setupCreatureTypeRefs() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.ZJX2hgglCq6NyNSD.JournalEntryPage.";
	const CREATURE_REFS = [
		{ key: "aberration", id: "s654bq7hgEOCdSal" },
		{ key: "beast", id: "u3JShAq2ZxnVV2yV" },
		{ key: "celestial", id: "ZZwFqDb6FC9Z3XkD" },
		{ key: "construct", id: "rcp9DD1ydtLTIRhn" },
		{ key: "dragon", id: "pIZXeLpJ5fCozA1H" },
		{ key: "elemental", id: "QYh9NqKgmt6Hhj8c" },
		{ key: "fey", id: "XfgpzHZJ84H0sYVh" },
		{ key: "fiend", id: "EBIlihpWmZWGkC45" },
		{ key: "giant", id: "OGbTyzGQUuttmGfS" },
		{ key: "humanoid", id: "rdY46Jtmqi2OMGwJ" },
		{ key: "monstrosity", id: "eKwEjCvWliZqkyOL" },
		{ key: "ooze", id: "joRNgGxKjOYH3gMu" },
		{ key: "plant", id: "UYIBDnkcxC2BjHgm" },
		{ key: "undead", id: "R1lM7n8ZgXzgc1K3" },
	];
	if (!CONFIG.DND5E.creatureTypes) CONFIG.DND5E.creatureTypes = {};
	CREATURE_REFS.forEach(({ key, id }) => {
		try {
			CONFIG.DND5E.creatureTypes[key].reference = base + id;
		} catch (e) {
			console.warn(
				`Elkan 5e | Failed to assign creature type reference for key '${key}':`,
				e,
			);
		}
	});
	CONFIG.DND5E.rules.creaturetags =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.ZJX2hgglCq6NyNSD.JournalEntryPage.1ZgNrOURIMuR0CnH";
}

/**
 * Registers setup Movement Refs configuration.
 *
 */
function setupMovementRefs() {
	// Travel and movement

	CONFIG.DND5E.rules.speed =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.HhqeIiSj8sE1v1qZ";
	CONFIG.DND5E.rules.travelpace =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.eFAISahBloR2X8MX";
	CONFIG.DND5E.rules.forcemarch =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.uQWQpRKQ1kWhuvjZ";
	CONFIG.DND5E.rules.difficultterrainpace =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.hFW5BR2yHHwwgurD";
	CONFIG.DND5E.rules.climbing =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.KxUXbMrUCIAhv4AF";
	CONFIG.DND5E.rules.swimming =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.y2Ayoo8l7XvSgZlL";
	CONFIG.DND5E.rules.crawling =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.S3f1b2WGfipAqOhJ";
	CONFIG.DND5E.rules.longjump =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.1U0myNrOvIVBUdJV";
	CONFIG.DND5E.rules.highjump =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.raPwIkqKSv60ELmy";
	CONFIG.DND5E.rules.falling =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.kREHL5pgNUOhay9f";
	CONFIG.DND5E.rules.difficultterrain =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.hFW5BR2yHHwwgurD";
	CONFIG.DND5E.rules.forcedmarch =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.uQWQpRKQ1kWhuvjZ";
	CONFIG.DND5E.rules.carryingcapacity =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.1PnjDBKbQJIVyc2t";
	CONFIG.DND5E.rules.drag =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.RGbChQ710jj63bAq";
	CONFIG.DND5E.rules.lift =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.XeTgxaUtUov8LyAU";
	CONFIG.DND5E.rules.flying =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.0B1fxfmw0a48tPsc";
	CONFIG.DND5E.rules.movingaroundothercreatures =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.9ZWCknaXCOdhyOrX";
	CONFIG.DND5E.rules.jumping =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.aaJOlRhI1H6vAxt9";
	CONFIG.DND5E.rules.movingagrappledcreature =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zaI1nuc41wANKoFX";
	CONFIG.DND5E.rules.squeezing =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.wKtOwagDAiNfVoPS";
	CONFIG.DND5E.rules.mounting =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.bcd53499242f4261";
	CONFIG.DND5E.rules.dismounting =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.b8e2f49414f542e2";
	CONFIG.DND5E.rules.controllingamount =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.f6db56ff5ad94d85";
}

/**
 * Registers setup Vision Light Refs configuration.
 *
 */
function setupVisionLightRefs() {
	// Vision and light
	CONFIG.DND5E.rules.vision =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.xShb3x5KBuTMzquX";
	CONFIG.DND5E.rules.blindsight =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.sacjsfm9ZXnw4Tqc";
	CONFIG.DND5E.rules.darkvision =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.ldmA1PbnEGVkmE11";
	CONFIG.DND5E.rules.truesight =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.kNa8rJFbtaTM3Rmk";
	CONFIG.DND5E.rules.tremorsense =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.8AIlZ95v54mL531X";
	CONFIG.DND5E.rules.light =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.O6hamUbI9kVASN8b";
	CONFIG.DND5E.rules.brightlight =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.RnMokVPyKGbbL8vi";
	CONFIG.DND5E.rules.dimlight =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.n1Ocpbyhr6HhgbCG";
	CONFIG.DND5E.rules.darkness =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.4dfREIDjG5N4fvxd";
}

/**
 * Registers setup General Refs configuration.
 *
 */
function setupGeneralRefs() {
	CONFIG.DND5E.rules.inspiration =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.nkEPI89CiQnOaLYh";
	CONFIG.DND5E.rules.encumbrance =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.JwqYf9qb6gJAWZKs";
	CONFIG.DND5E.rules.hiding =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.plHuoNdS0j3umPNS";
	CONFIG.DND5E.rules.passiveperception =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.988C2hQNyvqkdbND";
	CONFIG.DND5E.rules.time =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.eihqNjwpZ3HM4IqY";
	CONFIG.DND5E.rules.food =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.jayo7XVgGnRCpTW0";
	CONFIG.DND5E.rules.water =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.iIEI87J7lr2sqtb5";
	CONFIG.DND5E.rules.advantage =
		"Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.lvs9RRDi1UA1Lff8";
	CONFIG.DND5E.rules.disadvantage =
		"Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.fFrHBgqKUMY0Nnco";
	CONFIG.DND5E.rules.size =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.HWHRQVBVG7K0RVVW";
	CONFIG.DND5E.rules.space =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.WIA5bs3P45PmO3OS";
	CONFIG.DND5E.rules.curingmadness =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.2d4693dfe3114873";
	CONFIG.DND5E.rules.telepathy =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.5l8QNlgPDPOHpGID.JournalEntryPage.f17e4a3b7e024eb0";
}

/**
 * Registers setup Actions Refs configuration.
 *
 */
function setupActionsRefs() {
	CONFIG.DND5E.rules.bonusaction =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.Cx12WCR9KlNL9o8d";
	CONFIG.DND5E.rules.reaction =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.EkKBA3oaiy1Kvs3c";
}

/**
 * Registers setup Size Tags Item Refs configuration.
 *
 */
function setupSizeTagsItemRefs() {}

/**
 * Registers setup Poisons Ref configuration.
 *
 */
function setupPoisonsRef() {
	CONFIG.DND5E.rules.contactpoison =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.kXnCEqqGUWRZeZDj";
	CONFIG.DND5E.rules.ingestedpoison =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.KUyN4eK1xTBzXsjP";
	CONFIG.DND5E.rules.inhaledpoison =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.KUyN4eK1xTBzXsjP";
	CONFIG.DND5E.rules.injury =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.LUL48OUq6SJeMGc7";
	CONFIG.DND5E.rules.poisontypes =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.I6OMMWUaYCWR9xip";
}

/**
 * Registers setup Condition Refs configuration.
 *
 */
function setupConditionRefs() {
	CONFIG.DND5E.rules.beingprone =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.bV8akkBdVUUG21CO";
	CONFIG.DND5E.rules.droppingprone = CONFIG.DND5E.rules.standingup =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.hwTLpAtSS5OqQsI1";
	CONFIG.DND5E.rules.lightlyobscured =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD";
	CONFIG.DND5E.rules.heavilyobscured =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn";
	CONFIG.DND5E.rules.grappling =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zaI1nuc41wANKoFX";
	CONFIG.DND5E.rules.escapingagrapple =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zaI1nuc41wANKoFX";
	CONFIG.DND5E.itemProperties.concentration.reference =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv";
	CONFIG.DND5E.rules.cover =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.d2hBqe6EYHX2mxKD";
	CONFIG.DND5E.rules.halfcover =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq";
	CONFIG.DND5E.rules.threequarterscover =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.82ph4sMqvhxjLbiw";
	CONFIG.DND5E.rules.totalcover =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.hY5s70xMeG5ISFUA";
	CONFIG.DND5E.rules.concentrating =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv";

	CONFIG.DND5E.rules.disease =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.8344a52d39b0429a.JournalEntryPage.232cb157e7054330";
	CONFIG.DND5E.rules.bloodied =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.2YZgnTbeQ4rGG6t9";
	CONFIG.DND5E.rules.obscurred =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.FuFWdz6zw9P9VrON";
	CONFIG.DND5E.rules.diseased = CONFIG.DND5E.rules.disease =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.C1uE5H2DfghUGEID";
}

/**
 * Registers setup D20 Refs configuration.
 *
 */
function setupD20Refs() {
	CONFIG.DND5E.rules.d20test =
		"Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.nxPH59t3iNtWJxnU";
	CONFIG.DND5E.rules.difficultyclass =
		"Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.afnB0KZZk2hKtjv4";
	CONFIG.DND5E.rules.abilitycheck =
		"Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.XBQqXCoTbvp5Dika";
	CONFIG.DND5E.rules.savingthrow =
		"Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.Vlri6Mp6grn9wt3g";
}

/**
 * Registers setup Hazard Refs configuration.
 *
 */
function setupHazardRefs() {
	const base = "Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.";
	const HAZARD_PAGES = [
		{ key: "hazards", id: "WEVQOPQ2c5j0bSTD" },
		{ key: "environmentaleffects", id: "ZMfiHUPKTh8oYnk5" },
		{ key: "blizzard", id: "dzPV4R746FCId3fb" },
		{ key: "burning", id: "znHHmhO6vGjmeugR" },
		{ key: "dehydration", id: "xZRo576gFkVzqTAA" },
		{ key: "deepsnow", id: "XccX8ApfoV0pLjBN" },
		{ key: "deepwater", id: "0i25Urgz8wWCf02q" },
		{ key: "denseforest", id: "XxWh2q3PQ74ozzZb" },
		{ key: "exposedlava", id: "N8OF4NNXEILTxSh0" },
		{ key: "extremecold", id: "99czUtGCZD2ZTXVy" },
		{ key: "extremeheat", id: "jXNT3HSmoecSmE47" },
		{ key: "falling", id: "TDbwlHfW1Kd4sLIZ" },
		{ key: "frigidwater", id: "VainaneWo3z1UvdD" },
		{ key: "heavyfog", id: "UCIP87y4WF8mZZaM" },
		{ key: "heavyprecipitation", id: "Cxrt8iQnflR7rNXu" },
		{ key: "highaltitude", id: "y1BYEyDSsWcCxd9l" },
		{ key: "lightfog", id: "vFzSsBIlzNASDVMg" },
		{ key: "loosesand", id: "C6U0KPMCU05Q6LpC" },
		{ key: "malnutrition", id: "IxUkC78G9mRb3xQO" },
		{ key: "muddyterrain", id: "Q5mBAYRUw8Xbb6fj" },
		{ key: "plantsundergrowth", id: "vHkK402DiJ3WS956" },
		{ key: "poisonousfumes", id: "nXrA1SrhzvFfERkH" },
		{ key: "pollutedwater", id: "ujicgbpVFbZ9XMfo" },
		{ key: "rubblerocks", id: "ZftAr7nx6CNMxyCS" },
		{ key: "rockyterrain", id: "hrFhtm1nUpBCE4us" },
		{ key: "sandstorm", id: "u5ugGezm5QzpDOC6" },
		{ key: "shallowbog", id: "sanzrKa5XI3QToAU" },
		{ key: "slipperyice", id: "X8bksncR7EcaV0ov" },
		{ key: "strongwind", id: "BsWkNDqruDAuGwZU" },
		{ key: "suffocating", id: "NJdquJJIddZbeKdw" },
		{ key: "suffocation", id: "NJdquJJIddZbeKdw" },
		{ key: "suckingground", id: "Ar30uhkDfcespn3h" },
		{ key: "thinice", id: "xK13cz7y8NL4nKk5" },
		{ key: "thornbush", id: "R2sqqN0gWw8XKR47" },
		{ key: "thunderstorm", id: "EtQNW6ECR6xpGsjk" },
	];
	if (!CONFIG.DND5E.rules) CONFIG.DND5E.rules = {};
	for (const { key, id } of HAZARD_PAGES) {
		CONFIG.DND5E.rules[key] = `${base}${id}`;
	}
}

/**
 * Registers setup Rest Refs configuration.
 *
 */
function setupRestRefs() {
	CONFIG.DND5E.rules.resting =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.dpHJXYLigIdEseIb";
	CONFIG.DND5E.rules.shortrest =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.1s2swI3UsjUUgbt2";
	CONFIG.DND5E.rules.longrest =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.6cLtjbHn4KV2R7G9";
}

/**
 * Registers setup Social Mechanics Refs configuration.
 *
 */
function setupSocialMechanicsRefs() {
	CONFIG.DND5E.rules.attitude =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.ahMxQJTGDhq08GWQ";
	CONFIG.DND5E.rules.friendly =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.RVcWSqblHIs7SUzn";
	CONFIG.DND5E.rules.indifferent =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.eYX5eimGuYhHPoj4";
	CONFIG.DND5E.rules.hostile =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.BNxLbtJofbNGzjsp";
}

/**
 * Registers setup Items Refs configuration.
 *
 */
function setupItemsRefs() {
	CONFIG.DND5E.rules.multipleitemsofthesamekind = CONFIG.DND5E.rules.combiningmagicaleffects =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.uWa3L8lGJKgICYHt";
	CONFIG.DND5E.rules.attunement =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.CpD1zLLviYjS9FBX";
	CONFIG.DND5E.rules.useanobject =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.c08aeaf7c9e04e98";
	CONFIG.DND5E.rules.wearingitems =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.Vb2ZZXVGAa2KkPrG.JournalEntryPage.429ea2f1cf784a3b";
	CONFIG.DND5E.rules.wieldingitems =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.Vb2ZZXVGAa2KkPrG.JournalEntryPage.cc60f237b5754854";
	CONFIG.DND5E.rules.paireditems =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.Vb2ZZXVGAa2KkPrG.JournalEntryPage.041d0dedb4e14ca2";
	CONFIG.DND5E.rules.commandword =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.Vb2ZZXVGAa2KkPrG.JournalEntryPage.916a18cd4a4e4319";
	CONFIG.DND5E.rules.consumables =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.Vb2ZZXVGAa2KkPrG.JournalEntryPage.f900894c7bb5404d";
	CONFIG.DND5E.rules.charges =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.Vb2ZZXVGAa2KkPrG.JournalEntryPage.cc2f4f7442e84939";
}

/**
 * Registers setup Monster Refs configuration.
 *
 */
function setupMonsterRefs() {
	CONFIG.DND5E.rules.legendaryactions =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.ZJX2hgglCq6NyNSD.JournalEntryPage.d653531e5e58444e";
	CONFIG.DND5E.rules.lairactions =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.ZJX2hgglCq6NyNSD.JournalEntryPage.e0929bd8b30f4f03";
	CONFIG.DND5E.rules.regionaleffects =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.ZJX2hgglCq6NyNSD.JournalEntryPage.1c29183561314620";
	CONFIG.DND5E.rules.challengerating =
		"Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.BMoxmXB8pX6bOBus";
}

/**
 * Registers setuptraps Refs configuration.
 *
 */
function setuptrapsRefs() {
	CONFIG.DND5E.rules.detectingtraps =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.0df9567e7f23426a";
	CONFIG.DND5E.rules.disablingtraps =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.e85ccb217b174ae8";
}
