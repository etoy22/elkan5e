// Centralized DND5E reference assignments for Elkan 5e
export function setupCombatReferences() {
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
}

export function setupDamageReferences() {
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

export function setupSpellcastingReferences() {
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
		{ key: "knownspells", id: "qUZNQFDTomNDA9bv" },
		{ key: "preparedspells", id: "tvQAz6EC8cGVKRYi" },
		{ key: "abilityspells", id: "arD4KLvgCPbi1Pl7" },
		{ key: "focusspells", id: "R25K8TvAPK3c4ywr" },
		{ key: "spellscroll", id: "R25K8TvAPK3c4ywr" },
		{ key: "cursed", id: "Vpwu9GQC6HVNZFze" },
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
	try {
		CONFIG.DND5E.itemProperties.concentration.reference =
			"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv";
	} catch (e) {
		console.warn("Elkan 5e | Failed to assign concentration reference:", e);
	}
}

export function setupCreatureTypeReferences() {
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
}


export function setupOtherReferences() {
	CONFIG.DND5E.rules.inspiration = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.nkEPI89CiQnOaLYh"
	CONFIG.DND5E.rules.carryingcapacity = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.1PnjDBKbQJIVyc2t"
	CONFIG.DND5E.rules.push = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.Hni8DjqLzoqsVjb6"
	CONFIG.DND5E.rules.drag = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.RGbChQ710jj63bAq"
	CONFIG.DND5E.rules.lift = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.XeTgxaUtUov8LyAU"
	CONFIG.DND5E.rules.encumbrance = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.JwqYf9qb6gJAWZKs"
	CONFIG.DND5E.rules.hiding = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.plHuoNdS0j3umPNS"
	CONFIG.DND5E.rules.passiveperception = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.988C2hQNyvqkdbND"
	CONFIG.DND5E.rules.time = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.eihqNjwpZ3HM4IqY"
	CONFIG.DND5E.rules.speed = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.HhqeIiSj8sE1v1qZ"
	CONFIG.DND5E.rules.travelpace = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.eFAISahBloR2X8MX"
	CONFIG.DND5E.rules.forcemarch = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.uQWQpRKQ1kWhuvjZ"
	CONFIG.DND5E.rules.difficultterrainpace = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.hFW5BR2yHHwwgurD"
	CONFIG.DND5E.rules.climbing = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.KxUXbMrUCIAhv4AF"
	CONFIG.DND5E.rules.swimming = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.y2Ayoo8l7XvSgZlL"
	CONFIG.DND5E.rules.crawling = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.S3f1b2WGfipAqOhJ"
	CONFIG.DND5E.rules.longjump = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.1U0myNrOvIVBUdJV"
	CONFIG.DND5E.rules.highjump = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.raPwIkqKSv60ELmy"
	CONFIG.DND5E.rules.falling = "Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.kREHL5pgNUOhay9f"
	CONFIG.DND5E.rules.suffocating = "Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.BIlnr0xYhqt4TGsi"
	CONFIG.DND5E.rules.hazards = "Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.5hyEitPd1Kb27fP5"
	CONFIG.DND5E.rules.vision = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.xShb3x5KBuTMzquX"
	CONFIG.DND5E.rules.blindsight = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.sacjsfm9ZXnw4Tqc"
	CONFIG.DND5E.rules.darkvision = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.ldmA1PbnEGVkmE11"
	CONFIG.DND5E.rules.truesight = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.kNa8rJFbtaTM3Rmk"
	CONFIG.DND5E.rules.tremorsense = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.8AIlZ95v54mL531X"
	CONFIG.DND5E.rules.light = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.O6hamUbI9kVASN8b"
	CONFIG.DND5E.rules.brightlight = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.RnMokVPyKGbbL8vi"
	CONFIG.DND5E.rules.dimlight = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.n1Ocpbyhr6HhgbCG"
	CONFIG.DND5E.rules.darkness = "Compendium.elkan5e.elkan5e-rules.JournalEntry.tF77rxp5fPPbE6Vx.JournalEntryPage.4dfREIDjG5N4fvxd"
	CONFIG.DND5E.rules.lightlyobscured = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD"
	CONFIG.DND5E.rules.heavilyobscured = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn"
	CONFIG.DND5E.rules.food = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.jayo7XVgGnRCpTW0"
	CONFIG.DND5E.rules.water = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.iIEI87J7lr2sqtb5"
	CONFIG.DND5E.rules.forcedmarch = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.uQWQpRKQ1kWhuvjZ"
	CONFIG.DND5E.rules.difficultterrain = "Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.hFW5BR2yHHwwgurD"
	CONFIG.DND5E.rules.hitpoints = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.ndoKj9SzjOvxOI3J"
	CONFIG.DND5E.rules.damagerolls = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.mlywbrr1G8qdxbE7"
	CONFIG.DND5E.rules.criticalhits = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.kS19vAy9DQYUpp2X"
	CONFIG.DND5E.rules.damagetypes = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.qsBGDPv1hDjzIPnc"
	CONFIG.DND5E.rules.damageresistance = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.MGw7hOo14k9MWvyy"
	CONFIG.DND5E.rules.damagevulnerability = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.MGw7hOo14k9MWvyy"
	CONFIG.DND5E.rules.healing = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.jLAG02U8x7MGm3u0"
	CONFIG.DND5E.rules.instantdeath = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.EmlapwlGtPJP8US0"
	CONFIG.DND5E.rules.knockingacreatureout = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.Fwd3U6gs6IAybt7Q"
	CONFIG.DND5E.rules.temporaryhitpoints = CONFIG.DND5E.rules.temphp  = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.77jn4POOPOWB3Iq8"
	CONFIG.DND5E.rules.deathsavingthrows = CONFIG.DND5E.rules.deathsaves = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.lr1K8jG4k0ExfWDh"
	CONFIG.DND5E.rules.stabilizing = "Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.fi7JLEcAIaVk9oG2"
}