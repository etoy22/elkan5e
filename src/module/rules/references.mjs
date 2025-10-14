// Centralized DND5E reference assignments for Elkan 5e
function pluralizeKey(key) {
	if (!key) return key;
	const irregular = new Map([
		["fey", "fey"],
		["undead", "undead"],
	]);
	if (irregular.has(key)) return irregular.get(key);
	// y -> ies (monstrosity -> monstrosities)
	if (/[^aeiou]y$/i.test(key)) return key.slice(0, -1) + "ies";
	// es endings for s/x/z/ch/sh
	if (/(s|x|z|ch|sh)$/i.test(key)) return key + "es";
	return key + "s";
}

function addPluralAliasesForRules(dict) {
	if (!dict) return;
	for (const [k, v] of Object.entries(dict)) {
		try {
			if (!v || (typeof v !== "object" && typeof v !== "string")) continue;
			const pk = pluralizeKey(k);
			if (pk === k || dict[pk]) continue;
			// v may be an object like { reference: url } or { reference: url, ... }
			dict[pk] = v;
		} catch (e) {
			console.warn(`Elkan 5e | Failed to add plural alias for rules '${k}':`, e);
		}
	}
}

function addPluralAliasesForReferenceField(dict) {
	// for maps like damageTypes, creatureTypes, itemProperties where value has .reference
	if (!dict) return;
	for (const [k, v] of Object.entries(dict)) {
		try {
			if (!v || typeof v !== "object" || !v.reference) continue;
			const pk = pluralizeKey(k);
			if (pk === k) continue;
			if (!dict[pk]) dict[pk] = {};
			if (!dict[pk].reference) dict[pk].reference = v.reference;
		} catch (e) {
			console.warn(`Elkan 5e | Failed to add plural alias for reference '${k}':`, e);
		}
	}
}

export function addPluralReferenceAliases() {
	try { addPluralAliasesForRules(CONFIG.DND5E?.rules); } catch {}
	try { addPluralAliasesForReferenceField(CONFIG.DND5E?.damageTypes); } catch {}
	try { addPluralAliasesForReferenceField(CONFIG.DND5E?.creatureTypes); } catch {}
	try { addPluralAliasesForReferenceField(CONFIG.DND5E?.itemProperties); } catch {}
	try {
		// skills: use enrichmentLookup.skills if present
		const skills = CONFIG.DND5E?.enrichmentLookup?.skills;
		if (skills) addPluralAliasesForReferenceField(skills);
	} catch {}
}

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
		{ key: "aberration", id: "166a07288fc85326" },
		{ key: "beast", id: "8681a3328ac16192" },
		{ key: "celestial", id: "331e0da28ccaed70" },
		{ key: "construct", id: "959dda3eedb9e181" },
		{ key: "dragon", id: "aa4cc70979f32dfb" },
		{ key: "elemental", id: "0434870bf8dbc29e" },
		{ key: "fey", id: "901264f563365fa9" },
		{ key: "fiend", id: "72bd2de4b001eac1" },
		{ key: "giant", id: "4fac89a1a3af62cc" },
		{ key: "humanoid", id: "a2cb6c9f0244d2fd" },
		{ key: "monstrosity", id: "fe1300765a5aba0f" },
		{ key: "ooze", id: "297e7beedc2516a2" },
		{ key: "plant", id: "e1396f07ec5e0b96" },
		{ key: "undead", id: "7b922c97b8a8f237" },
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
	CONFIG.DND5E.rules.inspiration =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.nkEPI89CiQnOaLYh";
	CONFIG.DND5E.rules.carryingcapacity =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.1PnjDBKbQJIVyc2t";
	CONFIG.DND5E.rules.push =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.Hni8DjqLzoqsVjb6";
	CONFIG.DND5E.rules.drag =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.RGbChQ710jj63bAq";
	CONFIG.DND5E.rules.lift =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.XeTgxaUtUov8LyAU";
	CONFIG.DND5E.rules.encumbrance =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.JwqYf9qb6gJAWZKs";
	CONFIG.DND5E.rules.hiding =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.plHuoNdS0j3umPNS";
	CONFIG.DND5E.rules.passiveperception =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.988C2hQNyvqkdbND";
	CONFIG.DND5E.rules.time =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.eihqNjwpZ3HM4IqY";
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
	CONFIG.DND5E.rules.suffocating =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.BIlnr0xYhqt4TGsi";
	CONFIG.DND5E.rules.hazards =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.e7rUhwl4HkTVE0Qs.JournalEntryPage.5hyEitPd1Kb27fP5";
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
	CONFIG.DND5E.rules.lightlyobscured =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD";
	CONFIG.DND5E.rules.heavilyobscured =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn";
	CONFIG.DND5E.rules.food =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.jayo7XVgGnRCpTW0";
	CONFIG.DND5E.rules.water =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.iIEI87J7lr2sqtb5";
	CONFIG.DND5E.rules.forcedmarch =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.uQWQpRKQ1kWhuvjZ";
	CONFIG.DND5E.rules.difficultterrain =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.hFW5BR2yHHwwgurD";
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
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.Fwd3U6gs6IAybt7Q";
	CONFIG.DND5E.rules.temporaryhitpoints = CONFIG.DND5E.rules.temphp =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.77jn4POOPOWB3Iq8";
	CONFIG.DND5E.rules.deathsavingthrows = CONFIG.DND5E.rules.deathsaves =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.lr1K8jG4k0ExfWDh";
	CONFIG.DND5E.rules.stabilizing =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.fi7JLEcAIaVk9oG2";
	CONFIG.DND5E.rules.bonusaction =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.Cx12WCR9KlNL9o8d";
	CONFIG.DND5E.rules.reaction =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.EkKBA3oaiy1Kvs3c";
	CONFIG.DND5E.rules.flying =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.0B1fxfmw0a48tPsc";
	CONFIG.DND5E.rules.movingaroundothercreatures =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.9ZWCknaXCOdhyOrX";
	CONFIG.DND5E.rules.jumping =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.zt8Y2LavXmFfCg6k.JournalEntryPage.aaJOlRhI1H6vAxt9";
	CONFIG.DND5E.rules.cover =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.d2hBqe6EYHX2mxKD";
	CONFIG.DND5E.rules.halfcover =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq";
	CONFIG.DND5E.rules.threequarterscover =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.82ph4sMqvhxjLbiw";
	CONFIG.DND5E.rules.totalcover =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.hY5s70xMeG5ISFUA";
	CONFIG.DND5E.rules.components =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.kyqu4XQqGZqDCPXk";
	CONFIG.DND5E.rules.armorclass =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.C3b7Ref9xEVn34Gf.JournalEntryPage.WtFgf9tz3JffM9eW";
	CONFIG.DND5E.rules.rituals =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.CMI1OFzBkvjEmlj7";
	CONFIG.DND5E.rules.schoolsofmagic =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.sCJqoQlaDzseYmXn";
	CONFIG.DND5E.rules.resistance =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.S6GEsFTCc9Dj8d30.JournalEntryPage.MGw7hOo14k9MWvyy";
	CONFIG.DND5E.rules.size =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.HWHRQVBVG7K0RVVW";
	CONFIG.DND5E.rules.space =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.WIA5bs3P45PmO3OS";
	CONFIG.DND5E.rules.squeezing =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.wKtOwagDAiNfVoPS";
	CONFIG.DND5E.rules.concentrating =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv";
	CONFIG.DND5E.rules.creaturetags =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.ZJX2hgglCq6NyNSD.JournalEntryPage.1ZgNrOURIMuR0CnH";
	CONFIG.DND5E.rules.multipleitemsofthesamekind = CONFIG.DND5E.rules.combiningmagicaleffects =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.uWa3L8lGJKgICYHt";
	CONFIG.DND5E.rules.resting =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.dpHJXYLigIdEseIb";
	CONFIG.DND5E.rules.shortrest =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.1s2swI3UsjUUgbt2";
	CONFIG.DND5E.rules.longrest =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.6cLtjbHn4KV2R7G9";
	CONFIG.DND5E.rules.initiative =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.RcwElV4GAcVXKWxo";
	CONFIG.DND5E.rules.beingprone =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.bV8akkBdVUUG21CO";
	CONFIG.DND5E.rules.droppingprone = CONFIG.DND5E.rules.standingup =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.hwTLpAtSS5OqQsI1";
	CONFIG.DND5E.rules.poisontypes =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.I6OMMWUaYCWR9xip";
	CONFIG.DND5E.rules.contactpoison =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.kXnCEqqGUWRZeZDj";
	CONFIG.DND5E.rules.ingestedpoison =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.KUyN4eK1xTBzXsjP";
	CONFIG.DND5E.rules.inhaledpoison =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.KUyN4eK1xTBzXsjP";
	CONFIG.DND5E.rules.injury =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.LUL48OUq6SJeMGc7";
	CONFIG.DND5E.rules.grappling =
		CONFIG.DND5E.rules.movingagrappledcreature =
		CONFIG.DND5E.rules.escapingagrapple =
		"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.zaI1nuc41wANKoFX";
	CONFIG.DND5E.rules.bloodied = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.shZaSIlFPpHufPFn"
	CONFIG.DND5E.rules.breakingobjects = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.RXTLVpAwcGm1qtKf"
	CONFIG.DND5E.rules.attitude = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.ahMxQJTGDhq08GWQ"
	CONFIG.DND5E.rules.friendly = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.RVcWSqblHIs7SUzn"
	CONFIG.DND5E.rules.indifferent = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.eYX5eimGuYhHPoj4"
	CONFIG.DND5E.rules.hostile = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.BNxLbtJofbNGzjsp"
	CONFIG.DND5E.rules.attunement = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eebpST0RhXxhyCZO.JournalEntryPage.CpD1zLLviYjS9FBX"


	//TODO: Not done yet but leaving these here as placeholders
	// CONFIG.DND5E.rules.castaspell = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.GLwN36E4WXn3Cp4Z";
	// CONFIG.DND5E.rules.useanobject = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ljqhJx8Qxu2ivo69";
	// CONFIG.DND5E.rules.attackrolls = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5wkqEqhbBD5kDeE7";
	// CONFIG.DND5E.rules.unseenattackers = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5ZJNwEPlsGurecg5";
	// CONFIG.DND5E.rules.unseentargets = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5ZJNwEPlsGurecg5";
	// CONFIG.DND5E.rules.rangedattacks = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.S9aclVOCbusLE3kC";
	// CONFIG.DND5E.rules.range = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.HjKXuB8ndjcqOds7";
	// CONFIG.DND5E.rules.rangedattacksinclosecombat = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.qEZvxW0NM7ixSQP5";
	// CONFIG.DND5E.rules.meleeattacks = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.GTk6emvzNxl8Oosl";
	// CONFIG.DND5E.rules.escapingagrapple = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.2TZKy9YbMN3ZY3h8";
	// CONFIG.DND5E.rules.shoving = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hrdqMF8hRXJdNzJx";
	// CONFIG.DND5E.rules.mounting = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.MFpyvUIdcBpC9kIE";
	// CONFIG.DND5E.rules.dismounting = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.MFpyvUIdcBpC9kIE";
	// CONFIG.DND5E.rules.controllingamount = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.khmR2xFk1NxoQUgZ";
	// CONFIG.DND5E.rules.underwatercombat = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6zVOeLyq4iMnrQT4";
	// CONFIG.DND5E.rules.bonusactioncasting = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.RP1WL9FXI3aknlxZ";
	// CONFIG.DND5E.rules.reactioncasting = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.t62lCfinwU9H7Lji";
	// CONFIG.DND5E.rules.longercastingtimes = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.gOAIRFCyPUx42axn";
	// CONFIG.DND5E.rules.instantaneous = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.kdlgZOpRMB6bGCod";
	// CONFIG.DND5E.rules.areaofeffect = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.wvtCeGHgnUmh0cuj";
	// CONFIG.DND5E.rules.pointoforigin = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.8HxbRceQQUAhyWRt";
	// CONFIG.DND5E.rules.spellsavingthrows = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.8DajfNll90eeKcmB";
	// CONFIG.DND5E.rules.spellattackrolls = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.qAFzmGZKhVvAEUF3";
	// CONFIG.DND5E.rules.detectingtraps = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.DZ7AhdQ94xggG4bj";
	// CONFIG.DND5E.rules.disablingtraps = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.DZ7AhdQ94xggG4bj";
	// CONFIG.DND5E.rules.curingmadness = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6Icem7G3CICdNOkM";
	// CONFIG.DND5E.rules.damagethreshold = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9LJZhqvCburpags3";
	// CONFIG.DND5E.rules.wearingitems = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iPB8mGKuQx3X0Z2J";
	// CONFIG.DND5E.rules.wieldingitems = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iPB8mGKuQx3X0Z2J";
	// CONFIG.DND5E.rules.paireditems = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.rd9pCH8yFraSGN34";
	// CONFIG.DND5E.rules.commandword = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.HiXixxLYesv6Ff3t";
	// CONFIG.DND5E.rules.consumables = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.UEPAcZFzQ5x196zE";
	// CONFIG.DND5E.rules.itemspells = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.DABoaeeF6w31UCsj";
	// CONFIG.DND5E.rules.charges = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.NLRXcgrpRCfsA5mO";
	// CONFIG.DND5E.rules.telepathy = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.geTidcFIYWuUvD2L";
	// CONFIG.DND5E.rules.legendaryactions = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.C1awOyZh78pq1xmY";
	// CONFIG.DND5E.rules.lairactions = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.07PtjpMxiRIhkBEp";
	// CONFIG.DND5E.rules.regionaleffects = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.uj8W27NKFyzygPUd";
	// CONFIG.DND5E.rules.disease = "Compendium.dnd5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.oNQWvyRZkTOJ8PBq";
	// CONFIG.DND5E.rules.d20test = "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.nxPH59t3iNtWJxnU";
	// CONFIG.DND5E.rules.advantage = "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.lvs9RRDi1UA1Lff8";
	// CONFIG.DND5E.rules.disadvantage = "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.fFrHBgqKUMY0Nnco";
	// CONFIG.DND5E.rules.difficultyclass = "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.afnB0KZZk2hKtjv4";
	// CONFIG.DND5E.rules.abilitycheck = "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.XBQqXCoTbvp5Dika";
	// CONFIG.DND5E.rules.savingthrow = "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.Vlri6Mp6grn9wt3g";
	// CONFIG.DND5E.rules.challengerating = "Compendium.dnd5e.content24.JournalEntry.phbAppendixCRule.JournalEntryPage.BMoxmXB8pX6bOBus";
}
