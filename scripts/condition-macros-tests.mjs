import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

const macroPath = (name) => resolve("packs/_source/elkan5e-macros/conditions", `${name}.json`);

function runConditionMacro(name, workflow, actor) {
	const command = JSON.parse(readFileSync(macroPath(name), "utf8")).command;
	const math = Object.create(Math);
	math.clamp = (value, min, max) => Math.min(max, Math.max(min, value));
	return runInNewContext(`(function () {\n${command}\n})()`, {
		workflow,
		fromUuidSync: () => actor,
		Math: math,
	});
}

function actorWithHP({ value = 10, damage = 0, temp = 0, tempmax = 0 } = {}) {
	return {
		system: {
			attributes: {
				hp: { value, damage, temp, tempmax },
			},
		},
	};
}

function damageWorkflow(damageDetail, { type = "spell", actionType = "msak" } = {}) {
	return {
		item: { type },
		activity: { actionType, midiProperties: {} },
		damageItem: {
			actorUuid: "Actor.target",
			damageDetail,
		},
	};
}

test("Siphoned halves the combined damage total across damage types", () => {
	const actor = actorWithHP();
	const workflow = damageWorkflow([
		{ type: "fire", value: 1, damage: 1 },
		{ type: "cold", value: 1, damage: 1 },
	]);

	runConditionMacro("siphoned", workflow, actor);

	assert.deepEqual(
		workflow.damageItem.damageDetail.map((entry) => entry.value),
		[0.5, 0.5],
	);
	assert.equal(workflow.damageItem.totalDamage, 1);
	assert.equal(workflow.damageItem.hpDamage, 1);
	assert.equal(workflow.damageItem.newHP, 9);
});

test("Siphoned halves healing but leaves temporary hit points unchanged", () => {
	const actor = actorWithHP({ value: 8, damage: 2 });
	const workflow = damageWorkflow([
		{ type: "healing", value: -3, damage: -3 },
		{ type: "temphp", value: 4, damage: 4 },
	]);

	runConditionMacro("siphoned", workflow, actor);

	assert.equal(workflow.damageItem.damageDetail[0].value, -1.5);
	assert.equal(workflow.damageItem.damageDetail[1].value, 4);
	assert.equal(workflow.damageItem.healingAdjustedTotalDamage, -1);
	assert.equal(workflow.damageItem.newHP, 9);
	assert.equal(workflow.damageItem.newTempHP, 4);
});

test("Weakened halves combined weapon damage across damage types", () => {
	const actor = actorWithHP();
	const workflow = damageWorkflow(
		[
			{ type: "slashing", value: 1, damage: 1 },
			{ type: "fire", value: 1, damage: 1 },
		],
		{ type: "weapon", actionType: "mwak" },
	);

	runConditionMacro("weakened", workflow, actor);

	assert.deepEqual(
		workflow.damageItem.damageDetail.map((entry) => entry.value),
		[0.5, 0.5],
	);
	assert.equal(workflow.damageItem.totalDamage, 1);
	assert.equal(workflow.damageItem.hpDamage, 1);
	assert.equal(workflow.damageItem.newHP, 9);
});

test("Weakened does not reduce a weapon attack's healing component", () => {
	const actor = actorWithHP();
	const workflow = damageWorkflow(
		[
			{ type: "slashing", value: 4, damage: 4 },
			{ type: "healing", value: -4, damage: -4 },
		],
		{ type: "weapon", actionType: "mwak" },
	);

	runConditionMacro("weakened", workflow, actor);

	assert.deepEqual(
		workflow.damageItem.damageDetail.map((entry) => entry.value),
		[2, -4],
	);
});
