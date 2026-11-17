import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyConditionDamage } from "../src/module/rules/condition/damage.mjs";

const discorporate = JSON.parse(
	readFileSync(resolve("packs/_source/elkan5e-spells/level-4/discorporate.json"), "utf8"),
);

function actorWithHP({ value = 10, damage = 0, temp = 0, tempmax = 0, statuses = [] } = {}) {
	return {
		statuses: new Set(statuses),
		system: {
			attributes: {
				hp: { value, damage, temp, tempmax },
			},
		},
	};
}

function damageWorkflow(
	damageDetail,
	{ type = "spell", actionType = "msak", midiProperties = {} } = {},
) {
	const workflow = {
		item: { type },
		activity: { actionType, midiProperties },
		damageItem: {
			damageDetail,
		},
	};
	return workflow;
}

test("Siphoned halves the combined damage total across damage types", () => {
	const actor = actorWithHP({ statuses: ["siphoned"] });
	const workflow = damageWorkflow([
		{ type: "fire", value: 1, damage: 1 },
		{ type: "cold", value: 1, damage: 1 },
	]);

	applyConditionDamage(workflow, workflow.damageItem, actor);

	assert.deepEqual(
		workflow.damageItem.damageDetail.map((entry) => entry.value),
		[0.5, 0.5],
	);
	assert.equal(workflow.damageItem.totalDamage, 1);
	assert.equal(workflow.damageItem.hpDamage, 1);
	assert.equal(workflow.damageItem.newHP, 9);
});

test("Siphoned halves healing but leaves temporary hit points unchanged", () => {
	const actor = actorWithHP({ value: 8, damage: 2, statuses: ["siphoned"] });
	const workflow = damageWorkflow([
		{ type: "healing", value: -3, damage: -3 },
		{ type: "temphp", value: 4, damage: 4 },
	]);

	applyConditionDamage(workflow, workflow.damageItem, actor);

	assert.equal(workflow.damageItem.damageDetail[0].value, -1.5);
	assert.equal(workflow.damageItem.damageDetail[1].value, 4);
	assert.equal(workflow.damageItem.healingAdjustedTotalDamage, -1);
	assert.equal(workflow.damageItem.newHP, 9);
	assert.equal(workflow.damageItem.newTempHP, 4);
});

test("Weakened halves combined weapon damage across damage types", () => {
	const actor = actorWithHP({ statuses: ["weakened"] });
	const workflow = damageWorkflow(
		[
			{ type: "slashing", value: 1, damage: 1 },
			{ type: "fire", value: 1, damage: 1 },
		],
		{ type: "weapon", actionType: "mwak" },
	);

	applyConditionDamage(workflow, workflow.damageItem, actor);

	assert.deepEqual(
		workflow.damageItem.damageDetail.map((entry) => entry.value),
		[0.5, 0.5],
	);
	assert.equal(workflow.damageItem.totalDamage, 1);
	assert.equal(workflow.damageItem.hpDamage, 1);
	assert.equal(workflow.damageItem.newHP, 9);
});

test("Weakened does not reduce a weapon attack's healing component", () => {
	const actor = actorWithHP({ statuses: ["weakened"] });
	const workflow = damageWorkflow(
		[
			{ type: "slashing", value: 4, damage: 4 },
			{ type: "healing", value: -4, damage: -4 },
		],
		{ type: "weapon", actionType: "mwak" },
	);

	applyConditionDamage(workflow, workflow.damageItem, actor);

	assert.deepEqual(
		workflow.damageItem.damageDetail.map((entry) => entry.value),
		[2, -4],
	);
});

test("Weakened and Siphoned each apply when both conditions match", () => {
	const actor = actorWithHP({ statuses: ["weakened", "siphoned"] });
	const workflow = damageWorkflow([{ type: "slashing", value: 8, damage: 8 }], {
		type: "weapon",
		actionType: "mwak",
		midiProperties: { magicdam: true },
	});

	applyConditionDamage(workflow, workflow.damageItem, actor);

	assert.equal(workflow.damageItem.damageDetail[0].value, 2);
	assert.equal(workflow.damageItem.totalDamage, 2);
});

test("Condition automation ignores inactive effects", () => {
	const actor = actorWithHP();
	actor.effects = [{ disabled: true, flags: { core: { statusId: "weakened" } } }];
	const workflow = damageWorkflow([{ type: "slashing", value: 4, damage: 4 }], {
		type: "weapon",
		actionType: "mwak",
	});

	applyConditionDamage(workflow, workflow.damageItem, actor);

	assert.equal(workflow.damageItem.damageDetail[0].value, 4);
});

test("Discorporate applies the Weakened status and halves weapon damage", () => {
	const actor = actorWithHP();
	actor.effects = [{ statuses: new Set(discorporate.effects[0].statuses) }];
	const workflow = damageWorkflow([{ type: "slashing", value: 4, damage: 4 }], {
		type: "weapon",
		actionType: "mwak",
	});

	applyConditionDamage(workflow, workflow.damageItem, actor);

	assert.equal(workflow.damageItem.damageDetail[0].value, 2);
});

test("Discorporate uses the Weakened status instead of a private automation flag", () => {
	assert.ok(discorporate.effects[0].statuses.includes("weakened"));
	assert.equal(discorporate.effects[0].flags?.elkan5e?.weakenedWeaponDamage, undefined);
});

test("Existing Discorporate effects keep working until replaced", () => {
	const actor = actorWithHP();
	actor.effects = [
		{
			changes: [
				{
					key: "flags.midi-qol.onUseMacroName",
					value: "Compendium.elkan5e.elkan5e-macros.Macro.1NtnoPvTQj1IEHCa, preDamageApplication",
				},
			],
		},
	];
	const workflow = damageWorkflow([{ type: "slashing", value: 4, damage: 4 }], {
		type: "weapon",
		actionType: "mwak",
	});

	applyConditionDamage(workflow, workflow.damageItem, actor);

	assert.equal(workflow.damageItem.damageDetail[0].value, 2);
});
