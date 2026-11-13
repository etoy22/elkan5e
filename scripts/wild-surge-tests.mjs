/* global URL */
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let choose;
let nextId = 0;
globalThis.foundry = {
	applications: { api: { DialogV2: { wait: () => choose() } } },
	utils: {
		randomID: () => `pair${++nextId}`,
		mergeObject: (base, options) => ({ ...base, ...options }),
		setProperty(object, path, value) {
			const parts = path.split(".");
			const key = parts.pop();
			for (const part of parts) object = object[part] ??= {};
			object[key] = value;
		},
	},
};
globalThis.game = { packs: new Map(), i18n: { localize: (key) => key, format: (key) => key } };
globalThis.ChatMessage = { getSpeaker: () => ({}), create: async () => {} };
let wildSurge, delayedDuration, delayedItem, drawWildSurge, resolveWildSurge, SURGE_SOURCE;
let wildSurgeEffectEnded, resolveWildSurges, delayedSurgeUse;
before(async () => {
	({ wildSurge, delayedDuration, delayedItem, delayedSurgeUse } =
		await import("../src/module/classes/sorcerer.mjs"));
	({ drawWildSurge, resolveWildSurge, resolveWildSurges, SURGE_SOURCE, wildSurgeEffectEnded } =
		await import("../src/module/shared/wild-surge.mjs"));
});
const result = (special = {}, extra = {}) => ({
	uuid: "surge-result",
	flags: { elkan5e: { wildSurge: { special, ...extra } } },
});
function feature(identifier) {
	return {
		system: { identifier, uses: { max: 1, spent: 0 } },
		async update(data) {
			this.system.uses.spent = data["system.uses.spent"];
		},
	};
}
function setup(...features) {
	const actor = {
		uuid: "actor",
		items: features,
		effects: [{ name: "Voluntary Surge" }],
		updates: [],
		async update(data) {
			this.updates.push(data);
		},
	};
	const activity = {
		actor,
		item: { type: "spell", system: { level: 1 } },
		consumption: { spellSlot: true },
	};
	globalThis.fromUuid = async () => ({
		draw: async () => ({ results: [result({ inspiration: true })] }),
	});
	choose = () => "accept";
	return { actor, activity };
}

test("synthetic and OverTime casts are excluded; spells and scrolls remain eligible", async () => {
	for (const mode of ["synthetic", "overtime", "spell", "scroll", "cantrip"]) {
		const { actor, activity } = setup();
		if (mode === "synthetic") activity.item.flags = { "midi-qol": { syntheticItem: true } };
		if (mode === "overtime") activity.isOverTimeFlag = true;
		if (mode === "scroll")
			activity.item = { type: "consumable", system: { type: { value: "scroll" }, level: 1 } };
		if (mode === "cantrip") activity.item.system.level = 0;
		await wildSurge(activity);
		assert.equal(actor.updates.length, ["spell", "scroll"].includes(mode) ? 1 : 0, mode);
	}
});

test("exhaustion or removal during the dialog prevents feature spending and benefits", async () => {
	for (const choice of ["avert", "delay"]) {
		for (const removed of [false, true]) {
			const ability = feature(choice === "avert" ? "avert-disaster" : "delayed-surge");
			const { actor, activity } = setup(ability);
			let draws = 0;
			globalThis.fromUuid = async () => ({
				draw: async () => {
					draws++;
					return { results: [result({ inspiration: true })] };
				},
			});
			choose = () => {
				if (removed) actor.items = [];
				else ability.system.uses.spent = 1;
				return choice;
			};
			await wildSurge(activity);
			assert.equal(draws, 1);
			assert.equal(actor.updates.length, 1);
			assert.equal(ability.system.uses.spent, removed ? 0 : 1);
		}
	}
});

test("failed Avert redraw applies original surge without spending and returns failure", async () => {
	const avert = feature("avert-disaster");
	const { actor, activity } = setup(avert);
	let draws = 0;
	globalThis.fromUuid = async () => ({
		draw: async () => ({ results: ++draws === 1 ? [result({ inspiration: true })] : [] }),
	});
	choose = () => "avert";
	assert.equal(await wildSurge(activity), false);
	assert.equal(avert.system.uses.spent, 0);
	assert.equal(actor.updates.length, 1);
});

test("Avert rechecks availability after redraw and spends only after success", async () => {
	for (const exhausted of [false, true]) {
		const avert = feature("avert-disaster");
		const { actor, activity } = setup(avert);
		let draws = 0;
		globalThis.fromUuid = async () => ({
			draw: async () => {
				assert.equal(avert.system.uses.spent, 0);
				if (++draws === 2 && exhausted) avert.system.uses.spent = 1;
				return {
					results: [result(draws === 1 ? { inspiration: true } : { healFull: true })],
				};
			},
		});
		actor.system = { attributes: { hp: { max: 20 } } };
		choose = () => "avert";
		await wildSurge(activity);
		assert.equal(avert.system.uses.spent, 1);
		assert.deepEqual(actor.updates, [
			exhausted
				? { "system.attributes.inspiration": true }
				: { "system.attributes.hp.value": 20 },
		]);
	}
});

test("delayed storage refunds rejected or cancelled creation and preserves successful pairs", async () => {
	for (const failure of ["Item", "ActiveEffect", "cancel", null]) {
		const delay = feature("delayed-surge");
		const { actor, activity } = setup(delay);
		const stored = [];
		let deleted = false;
		actor.createEmbeddedDocuments = async (type, data) => {
			if (failure === type) throw new Error("synthetic creation failure");
			if (failure === "cancel") return [];
			const doc = {
				...data[0],
				delete: async () => {
					deleted = true;
				},
			};
			stored.push(doc);
			return [doc];
		};
		choose = () => "delay";
		await wildSurge(activity);
		assert.equal(delay.system.uses.spent, failure ? 0 : 1);
		assert.equal(actor.updates.length, failure ? 1 : 0);
		if (failure === "ActiveEffect") assert.equal(deleted, true);
		if (!failure)
			assert.equal(
				stored[0].flags.elkan5e.delayedSurgePair,
				stored[1].flags.elkan5e.delayedSurgePair,
			);
	}
});

test("cleanup follows pair IDs despite renamed documents and repeated hook calls", async () => {
	const actor = { items: [], effects: [] };
	for (const id of ["a", "b"]) {
		const item = {
			name: "renamed",
			parent: actor,
			flags: { elkan5e: { delayedSurgePair: id } },
			async delete() {
				actor.items = actor.items.filter((doc) => doc !== this);
				await delayedItem(this);
			},
		};
		const effect = {
			parent: actor,
			flags: item.flags,
			async delete() {
				actor.effects = actor.effects.filter((doc) => doc !== this);
				await delayedDuration(this);
			},
		};
		actor.items.push(item);
		actor.effects.push(effect);
	}
	await actor.effects[0].delete();
	assert.equal(actor.items.length, 1);
	assert.equal(actor.effects.length, 1);
	await actor.items[0].delete();
	assert.equal(actor.effects.length, 0);
});

test("one shared budget bounds linked table cycles and branching subtable cycles", async () => {
	let draws = 0;
	const table = {
		documentName: "RollTable",
		async draw(options) {
			assert.equal(options.recursive, false);
			draws++;
			return { results: [{ documentUuid: "cycle" }] };
		},
	};
	globalThis.fromUuid = async () => table;
	assert.equal(await drawWildSurge(1, { remaining: 7 }), null);
	assert.equal(draws, 7);
	draws = 0;
	table.draw = async () => {
		draws++;
		return { results: [result({}, { subTables: [1, 1] })] };
	};
	const budget = { remaining: 8 };
	const drawn = await drawWildSurge(1, budget);
	await resolveWildSurge({}, drawn.result, { budget: drawn.budget });
	assert.equal(draws, 8);
	assert.equal(budget.remaining, 0);
});

test("dispel includes transferred magical temporary effects and deletes through their documents", async () => {
	const removed = [];
	const effects = [
		[true, true, true],
		[true, true, false],
		[false, true, true],
		[true, false, false],
	].map(([temporary, magical, transfer], i) => ({
		isTemporary: temporary,
		system: { magical },
		transfer,
		delete: async () => removed.push(i),
	}));
	await resolveWildSurge(
		{
			*allApplicableEffects() {
				yield* effects;
			},
		},
		result({ dispelMagic: true }),
	);
	assert.deepEqual(removed, [0, 1]);
});

test("level 2 roll 10 restores Bloodrager Rage and leaves sorcerer result unchanged", async () => {
	const table = JSON.parse(
		readFileSync(
			new URL(
				"../packs/_source/elkan5e-roll-tables/wild-surge/wild-surge-table-lv-2.json",
				import.meta.url,
			),
		),
	);
	const entry = table.results.find((row) => row.range[0] === 10);
	assert.equal(entry.flags.elkan5e.wildSurge.sorcererOnly, true);
	const rage = feature("rage");
	rage.system.uses.spent = 1;
	await resolveWildSurge({ items: [rage] }, entry, { source: SURGE_SOURCE.bloodrager });
	assert.equal(rage.system.uses.spent, 0);
	await resolveWildSurge({}, entry);
});

function daydream() {
	const table = JSON.parse(
		readFileSync(
			new URL(
				"../packs/_source/elkan5e-roll-tables/wild-surge/wild-surge-table-lv-10.json",
				import.meta.url,
			),
		),
	);
	return table.results.find((row) => /daydream/i.test(row.description));
}

function surgingActor(...features) {
	const actor = {
		uuid: "actor",
		documentName: "Actor",
		isOwner: true,
		items: features,
		created: [],
		updates: [],
		system: { attributes: { hp: { value: 3, max: 40 } } },
		async createEmbeddedDocuments(type, data) {
			for (const effect of data) effect.parent = this;
			this.created.push(...data);
			return data;
		},
		async update(data) {
			this.updates.push(data);
		},
	};
	globalThis.fromUuid = async (uuid) =>
		uuid === "actor" ? actor : { toObject: () => ({ _id: "x", name: "Daydream", flags: {} }) };
	return actor;
}

test("Daydream restores hit points and sorcery points when the sorcerer returns", async () => {
	globalThis.game.user = { id: "me" };
	const points = feature("sorcery-points");
	points.system.uses = { max: 10, spent: 6 };
	const actor = surgingActor(points);
	await resolveWildSurge(actor, daydream());
	assert.equal(actor.created.length, 1);
	assert.equal(actor.updates.length, 0, "nothing is restored while ethereal");
	assert.equal(points.system.uses.spent, 6);

	await wildSurgeEffectEnded(actor.created[0], "someone-else");
	assert.equal(actor.updates.length, 0, "only the deleting client applies the return");

	await wildSurgeEffectEnded(actor.created[0], "me");
	assert.deepEqual(actor.updates, [{ "system.attributes.hp.value": 40 }]);
	assert.equal(points.system.uses.spent, 0);
});

test("Daydream gives a Bloodrager a use of Rage on return in place of sorcery points", async () => {
	globalThis.game.user = { id: "me" };
	const rage = feature("rage");
	rage.system.uses.spent = 2;
	const actor = surgingActor(rage);
	await resolveWildSurge(actor, daydream(), { source: SURGE_SOURCE.bloodrager });
	const onEnd = actor.created[0].flags.elkan5e.wildSurgeOnEnd;
	assert.deepEqual(onEnd, { healFull: true, refundRage: true });
	assert.equal(rage.system.uses.spent, 2);

	await wildSurgeEffectEnded(actor.created[0], "me");
	assert.equal(rage.system.uses.spent, 1);
	assert.deepEqual(actor.updates, [{ "system.attributes.hp.value": 40 }]);
});

test("every result of a draw with overlapping ranges is applied", async () => {
	globalThis.fromUuid = async () => ({
		draw: async () => ({
			results: [result({ inspiration: true }), result({ healFull: true })],
		}),
	});
	const drawn = await drawWildSurge(1);
	assert.equal(drawn.results.length, 2);
	const actor = {
		updates: [],
		system: { attributes: { hp: { value: 1, max: 9 } } },
		async update(data) {
			this.updates.push(data);
		},
	};
	await resolveWildSurges(actor, drawn.results, { budget: drawn.budget });
	assert.deepEqual(actor.updates, [
		{ "system.attributes.inspiration": true },
		{ "system.attributes.hp.value": 9 },
	]);
});

test("a delayed surge refunds the slot of the spell that triggered it", async () => {
	const stored = result({ refundSlot: true });
	globalThis.fromUuid = async (uuid) => (uuid === "surge-result" ? stored : null);
	const actor = {
		updates: [],
		system: { spells: { spell3: { value: 0, max: 2 } } },
		async update(data) {
			this.updates.push(data);
		},
	};
	await delayedSurgeUse({
		actor,
		item: {
			system: { identifier: "delayed-wild-surge" },
			flags: { elkan5e: { wildSurgeResults: ["surge-result"], wildSurgeSlot: "spell3" } },
		},
	});
	assert.deepEqual(actor.updates, [{ "system.spells.spell3.value": 1 }]);
});
