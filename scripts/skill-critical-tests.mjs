import { test } from "node:test";
import assert from "node:assert/strict";

const { registerSkillCriticalRule } = await import("../src/module/rules/skills.mjs");

function makeRoll(natural, flavor = "") {
	return {
		dice: [{ faces: 20, total: natural }],
		terms: [],
		_formula: "1d20 + 4",
		_total: natural + 4,
		options: { flavor },
		async evaluate() {
			return this;
		},
	};
}

test("skill critical adjustments are visible in chat flavor and preserve the skill label", async () => {
	const previous = {
		Hooks: globalThis.Hooks,
		game: globalThis.game,
		foundry: globalThis.foundry,
	};
	let callback;
	globalThis.Hooks = {
		on(event, handler) {
			if (event === "dnd5e.postSkillRollConfiguration") callback = handler;
		},
	};
	globalThis.game = {
		settings: { get: () => true },
		i18n: { localize: (key) => key },
	};
	globalThis.foundry = {
		...previous.foundry,
		dice: {
			terms: {
				OperatorTerm: class {
					constructor(data) {
						Object.assign(this, data);
					}
				},
				NumericTerm: class {
					constructor(data) {
						Object.assign(this, data);
					}
				},
			},
		},
	};

	try {
		registerSkillCriticalRule();
		const naturalTwenty = makeRoll(20, "Acrobatics");
		const naturalOne = makeRoll(1);
		callback([naturalTwenty, naturalOne]);

		await naturalTwenty.evaluate();
		await naturalOne.evaluate();

		assert.equal(naturalTwenty._total, 29);
		assert.equal(
			naturalTwenty.options.flavor,
			"Acrobatics — elkan5e.skillCriticalAdjustment.naturalTwenty",
		);
		assert.match(naturalTwenty._formula, /Natural 20 Bonus/);
		assert.equal(naturalOne._total, 0);
		assert.equal(naturalOne.options.flavor, "elkan5e.skillCriticalAdjustment.naturalOne");
	} finally {
		for (const [key, value] of Object.entries(previous)) {
			if (value === undefined) delete globalThis[key];
			else globalThis[key] = value;
		}
	}
});
