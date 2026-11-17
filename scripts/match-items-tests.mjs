import { test } from "node:test";
import assert from "node:assert/strict";
import {
	buildIndex,
	carryAdvancementValues,
	describeBuildChanges,
	deepEqualIgnoringMeta,
	differingFields,
	identifierOf,
	pairActivities,
	planEffectSync,
	resolveMatch,
	suggestVariantOf,
	toComparable,
} from "../src/module/settings/match-items.mjs";

const doc = (name, type, identifier) => ({ name, type, system: identifier ? { identifier } : {} });
const index = (...packs) => buildIndex(packs.map(([pack, docs]) => ({ pack, docs })));

test("identifierOf falls back to a slug of the name", () => {
	assert.equal(identifierOf({ name: "Fire Bolt" }), "fire-bolt");
	assert.equal(identifierOf({ name: "X", system: { identifier: " custom " } }), "custom");
});

test("resolveMatch prefers identifier plus name", () => {
	const idx = index([
		"feat",
		[
			doc("Channel Conviction: Howl of Terror", "feat", "avengers-leap"),
			doc("Channel Conviction: Avenger's Leap", "feat", "avengers-leap"),
		],
	]);
	const m = resolveMatch(doc("Channel Conviction: Avenger's Leap", "feat", "avengers-leap"), idx);
	assert.equal(m.status, "match");
	assert.equal(m.doc.name, "Channel Conviction: Avenger's Leap");
});

test("resolveMatch resolves a shared identifier by name", () => {
	const idx = index(["feat", [doc("Howl", "feat", "shared"), doc("Leap", "feat", "shared")]]);
	const m = resolveMatch(doc("Howl", "feat", "shared"), idx);
	assert.equal(m.status, "match");
	assert.equal(m.doc.name, "Howl");
});

test("resolveMatch still finds a renamed item by a unique identifier", () => {
	const idx = index(["spell", [doc("Fireball", "spell", "fireball")]]);
	const m = resolveMatch(doc("My Fireball", "spell", "fireball"), idx);
	assert.deepEqual([m.status, m.by], ["match", "identifier"]);
});

test("resolveMatch reports a custom item sharing an identifier as ambiguous", () => {
	const idx = index([
		"eq",
		[doc("Dagger (2)", "weapon", "dagger"), doc("Dagger", "weapon", "dagger")],
	]);
	const m = resolveMatch(doc("Bloodletting Dagger", "weapon", "dagger"), idx);
	assert.equal(m.status, "ambiguous");
	assert.equal(m.count, 2);
});

test("resolveMatch reports none when nothing matches", () => {
	const idx = index(["eq", [doc("Dagger", "weapon")]]);
	assert.equal(resolveMatch(doc("Spoon", "loot"), idx).status, "none");
});

test("resolveMatch uses pack priority when the same name is in two packs", () => {
	const idx = index(
		["class", [doc("Extra Attack", "feat", "extra-attack")]],
		["feats", [doc("Extra Attack", "feat", "extra-attack")]],
	);
	const m = resolveMatch(doc("Extra Attack", "feat", "extra-attack"), idx);
	assert.equal(m.status, "match");
	assert.equal(m.doc, idx.byName.get("Extra Attack")[0].doc);
});

test("resolveMatch matches across item types when only one candidate exists", () => {
	const idx = index(["eq", [doc("Ink Pen", "equipment")]]);
	assert.equal(resolveMatch(doc("Ink Pen", "loot"), idx).status, "match");
});

test("deepEqualIgnoringMeta ignores ids, stats, ownership and effect origins", () => {
	const a = {
		_id: "a",
		name: "X",
		_stats: { v: 1 },
		effects: [{ _id: "e1", origin: "Actor.1.Item.2", name: "E" }],
	};
	const b = {
		_id: "b",
		name: "X",
		_stats: { v: 2 },
		effects: [{ _id: "e2", origin: null, name: "E" }],
	};
	assert.equal(deepEqualIgnoringMeta(a, b), true);
	assert.equal(deepEqualIgnoringMeta({ q: 1 }, { q: 2 }), false);
	assert.equal(deepEqualIgnoringMeta([1, 2], [1, 2, 3]), false);
	assert.equal(deepEqualIgnoringMeta(["a", "b"], ["b", "a"]), true);
	assert.equal(deepEqualIgnoringMeta([{ n: 1 }, { n: 2 }], [{ n: 2 }, { n: 1 }]), false);
});

test("toComparable drops relationship flags and placement", () => {
	const out = toComparable({
		sort: 5,
		folder: "f",
		flags: { dnd5e: { advancementOrigin: "x", cachedFor: "y" } },
		name: "N",
	});
	assert.deepEqual(out, { flags: {}, name: "N" });
});

test("differingFields names the changed system fields", () => {
	const oldData = { name: "A", img: "a.png", system: { description: "old", quantity: 1 } };
	const newData = { name: "A", img: "a.png", system: { description: "new", quantity: 1 } };
	assert.deepEqual(differingFields(oldData, newData), ["system.description"]);
});

test("planEffectSync keeps effects that still exist and reports the rest", () => {
	const plan = planEffectSync(
		[
			{ _id: "1", name: "Keep" },
			{ _id: "2", name: "Gone" },
		],
		[{ name: "Keep" }, { name: "New" }],
	);
	assert.deepEqual(
		plan.updates.map((u) => u.id),
		["1"],
	);
	assert.deepEqual(
		plan.creates.map((c) => c.name),
		["New"],
	);
	assert.deepEqual(plan.deletes, ["2"]);
});

test("pairActivities matches by unique name, then by position", () => {
	const oldA = [
		{ type: "attack", name: "Hit" },
		{ type: "save", name: "" },
	];
	const newA = [
		{ type: "attack", name: "Hit" },
		{ type: "save", name: "" },
	];
	assert.deepEqual(
		[...pairActivities(oldA, newA)],
		[
			[0, 0],
			[1, 1],
		],
	);
	const reshaped = pairActivities(
		[{ type: "attack", name: "Hit" }],
		[
			{ type: "attack", name: "Strike" },
			{ type: "save", name: "" },
		],
	);
	assert.equal(reshaped.size, 0);
});

test("resolveMatch tells same-named subclass features apart by requirements", () => {
	const variant = (requirements) => ({
		name: "Elemental Infusion",
		type: "feat",
		system: { identifier: "elemental-infusion", requirements },
	});
	const idx = index(["feat", [variant("Earth Savant 6"), variant("Fire Savant 6")]]);
	const m = resolveMatch(variant("Fire Savant 6"), idx);
	assert.equal(m.status, "match");
	assert.equal(m.doc.system.requirements, "Fire Savant 6");
	assert.equal(resolveMatch(variant("Water Savant 6"), idx).status, "ambiguous");
});

test("resolveMatch matches an item whose type changed, preferring the same type when there is one", () => {
	const idx = index(["a", [doc("Ki-Empowered Strikes", "feat", "ki-empowered-strikes")]]);
	const m = resolveMatch(doc("Ki-Empowered Strikes", "weapon", "ki-empowered-strikes"), idx);
	assert.equal(m.status, "match");
	assert.equal(m.doc.type, "feat");

	const both = index([
		"a",
		[doc("Shield", "spell", "shield"), doc("Shield", "equipment", "shield")],
	]);
	assert.equal(resolveMatch(doc("Shield", "equipment", "shield"), both).doc.type, "equipment");
});

test("suggestVariantOf hints at the base item for suffixed names but never matches them", () => {
	const idx = index(["a", [doc("Dart", "weapon", "dart"), doc("Barkskin", "spell", "barkskin")]]);
	assert.deepEqual(suggestVariantOf(doc("Dart (10)", "weapon"), idx), ["Dart"]);
	assert.deepEqual(suggestVariantOf(doc("Barkskin (Short Rest)", "spell"), idx), ["Barkskin"]);
	assert.deepEqual(suggestVariantOf(doc("Barkskin (Short Rest)", "weapon"), idx), []);
	assert.deepEqual(suggestVariantOf(doc("Dart", "weapon"), idx), []);
	assert.equal(resolveMatch(doc("Dart (10)", "weapon", "dart-10"), idx).status, "none");
});

test("resolveMatch follows Elkan's recorded renames, even when the old item still exists", () => {
	const idx = index(
		["a", [doc("Unarmed Strike (Monk)", "weapon", "unarmed-strike-monk")]],
		["b", [doc("Unarmed Strike", "weapon", "unarmed-strike")]],
	);
	const m = resolveMatch(doc("Unarmed Strike (Monk)", "weapon", "unarmed-strike-monk"), idx);
	assert.equal(m.status, "match");
	assert.equal(m.by, "renamed");
	assert.equal(m.doc.name, "Unarmed Strike");

	const idx2 = index(["a", [doc("Ambidexterity", "feat", "ambidexterity")]]);
	assert.equal(resolveMatch(doc("Ambidextrous Might", "feat", "ambidextrous-might"), idx2).doc.name, "Ambidexterity");
	// With renames switched off (other-modules runs) the old name is simply unmatched.
	assert.equal(
		resolveMatch(doc("Ambidextrous Might", "feat", "ambidextrous-might"), idx2, { renames: {} }).status,
		"none",
	);
});

test("weak sources match by name but never by identifier alone", () => {
	const idx = buildIndex([
		{ pack: "main", docs: [] },
		{ pack: "extra", weak: true, docs: [doc("Unarmed Strike", "weapon", "unarmed-strike")] },
	]);
	assert.equal(resolveMatch(doc("Hooves", "weapon", "unarmed-strike"), idx).status, "none");
	assert.equal(resolveMatch(doc("Unarmed Strike", "weapon", "other"), idx).status, "match");
});

test("carryAdvancementValues matches by id, then by type, title and level, and reports the rest", () => {
	const old = [
		{ _id: "a", type: "Trait", title: "Skills", level: 1, value: { chosen: ["skills:arc"] } },
		{ _id: "b", type: "ItemGrant", title: "Features", level: 1, value: { added: { x: "uuid" } } },
		{ _id: "c", type: "ItemChoice", title: "Pick", level: 3, value: { added: { y: "uuid" } } },
		{ _id: "d", type: "Trait", title: "Tools", level: 1, value: {} },
	];
	const fresh = [
		{ _id: "a", type: "Trait", title: "Skills", level: 1 },
		{ _id: "z", type: "ItemGrant", title: "Features", level: 1 },
		{ _id: "q", type: "HitPoints", title: "", level: 1 },
	];
	const { carried, lost } = carryAdvancementValues(old, fresh);
	assert.equal(carried, 2);
	assert.deepEqual(fresh[0].value, { chosen: ["skills:arc"] });
	assert.deepEqual(fresh[1].value, { added: { x: "uuid" } });
	assert.equal(fresh[2].value, undefined);
	assert.deepEqual(lost, [{ type: "ItemChoice", title: "Pick", level: 3 }]);
});

test("toComparable ignores <br /> versus <br> in descriptions", () => {
	const a = { system: { description: { value: "<p>a<br /></p>" } } };
	const b = { system: { description: { value: "<p>a<br></p>" } } };
	assert.deepEqual(toComparable(a), toComparable(b));
});

test("describeBuildChanges reports replaced, added and removed features by level", () => {
	const names = { a: "Fire Savant", b: "Fire Specialist", c: "Keep", d: "New One", e: "Dropped" };
	const nameOf = (u) => names[u];
	const grant = (level, ...uuids) => ({
		type: "ItemGrant",
		level,
		configuration: { items: uuids.map((uuid) => ({ uuid })) },
	});
	const oldSide = { hitDie: "d8", advancement: [grant(3, "a", "c"), grant(6, "e")] };
	const newSide = { hitDie: "d10", advancement: [grant(3, "b", "c"), grant(6, "d", "e")] };
	const { lines, unchanged } = describeBuildChanges(oldSide, newSide, nameOf);
	assert.deepEqual(lines, [
		"Hit die d8 -> d10",
		"Level 3: Fire Savant replaced by Fire Specialist",
		"Level 6: New One added",
	]);
	assert.equal(unchanged, 2);
});

test("describeBuildChanges reports nothing when the grants are the same", () => {
	const adv = [{ type: "ItemGrant", level: 1, configuration: { items: [{ uuid: "x" }] } }];
	const { lines, unchanged } = describeBuildChanges(
		{ advancement: adv },
		{ advancement: structuredClone(adv) },
		() => "X",
	);
	assert.deepEqual(lines, []);
	assert.equal(unchanged, 1);
});
