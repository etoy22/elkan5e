/* global Roll, foundry, ChatMessage, fromUuid, game */
import { deletedEffectRemovesItem, deletedItemRemovesEffect } from "../global.mjs";
const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Handle the wild surge effect after casting a spell.
 * @param {Activity} activity - The activity performed.
 */
export async function wildSurge(activity) {
	const item = activity.item;
	const level = item.system.level || item.flags.dnd5e?.spellLevel?.value || 1;

	if (
		(item.type === "spell" &&
			level > 0 &&
			(activity.name === "Ritual" || activity.consumption.spellSlot)) ||
		(item.type === "consumable" && item.system.type.value === "scroll")
	) {
		const actor = activity.actor;
		const WILD_SURGE_THRESHOLD = 5;
		const MAX_TABLE_LEVEL = 10;
		const TABLE_UUIDS = [
			null, // No table for level 0 spells
			"GDE5tgmRfX1GiOQs",
			"mxwqgbo7xnNXSnIm",
			"Fwl1JxM19LzeYxjJ",
			"0TDp89O9iGt4zovG",
			"V4BRRp6vWntQNVwa",
			"4TsMG2a2EtcLdgkc",
			"wt2VfjYQyuvwftih",
			"xkUpS2XBuSdyVEah",
			"LV2skOm8hCwM1JRH",
			"O7JYPPoDS7gLGkNj",
		];
		const wild = actor.items.find((i) => i.system.identifier === "random-wild-surge");
		const volen = actor.effects.find((i) => i.system.identifier === "Voluntary Surge");
		const blowout = actor.effects.find((i) => i.system.identifier === "Magical Blowout");
		let rollAbove = false;

		if (wild) {
			try {
				const roll = await new Roll("1d6").roll({ async: true });
				await roll.toMessage({
					flavor: game.i18n.localize("elkan5e.wildMage.randomWildSurge"),
					speaker: ChatMessage.getSpeaker({ actor: actor }),
				});
				if (roll.total >= WILD_SURGE_THRESHOLD) {
					rollAbove = true;
				}
			} catch (error) {
				console.error("Error rolling wild surge: ", error);
				return;
			}
		}

		if (rollAbove || volen || blowout) {
			let count = 0;
			if (rollAbove) count++;
			if (volen) count++;
			if (blowout) count++;
			let tableLevel = Math.min(level - 1 + count, MAX_TABLE_LEVEL);
			let tableUUID = TABLE_UUIDS[tableLevel];
			let rollResult = "";

			if (tableUUID) {
				try {
					const table = await fromUuid(
						`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${tableUUID}`,
					);
					if (table) {
						const results = await table.draw({ displayChat: true });
						rollResult = results.results[0].text;
					}
				} catch (error) {
					console.error("Error drawing from roll table: ", error);
				}

				const avert = actor.items.find((i) => i.system.identifier === "avert-disaster");
				const delay = actor.items.find((i) => i.system.identifier === "delayed-surge");

				let buttons = {};

				if (avert) {
					buttons.avert = {
						label: game.i18n.localize("elkan5e.wildMage.avertDisaster"),
						callback: async () => {
							await avert.update({
								"system.uses.spent": avert.system.uses.spent + 1,
							});
							try {
								const table = await fromUuid(
									`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${tableUUID}`,
								);
								if (table) {
									const results = await table.draw({ displayChat: true });
									rollResult = results.results[0].text;
								}
							} catch (error) {
								console.error("Error drawing from roll table: ", error);
							}
							let innerButtons = {};
							const delayButton = await createDelayButton(actor, rollResult);
							if (delayButton) innerButtons.delay = delayButton;
							innerButtons.cancel = await createCancelButton();

							if (
								Object.keys(innerButtons).length > 1 &&
								delay.system.uses.spent < delay.system.uses.max
							) {
								await new DialogV2({
									window: {
										title: game.i18n.localize(
											"elkan5e.wildMage.wildSurgeAbilities",
										),
										modal: true,
									},
									content: `
										<h2>${game.i18n.localize("elkan5e.wildMage.alterWildSurge")}</h2>
										<p>${game.i18n.localize("elkan5e.wildMage.abilityUsage")}</p>
										${
											delay
												? `<p>${game.i18n.format(
														"elkan5e.wildMage.delayedSurgeUses",
														{
															remaining:
																delay.system.uses.max -
																delay.system.uses.spent,
														},
													)}</p>`
												: ""
										}
									`,
									buttons: Object.entries(innerButtons).map(([action, data]) => ({
										action,
										...data,
									})),
								}).render(true);
							}
						},
						disabled: avert.system.uses.spent >= avert.system.uses.max,
					};
				}

				const delayButton = await createDelayButton(actor, rollResult);
				if (delayButton) buttons.delay = delayButton;
				buttons.cancel = await createCancelButton();

				if (
					Object.keys(buttons).length > 1 &&
					(avert?.system.uses.spent < avert?.system.uses.max ||
						delay?.system.uses.spent < delay?.system.uses.max)
				) {
					await new DialogV2({
						window: {
							title: game.i18n.localize("elkan5e.wildMage.wildSurgeAbilities"),
							modal: true,
						},
						content: `
							<h2>${game.i18n.localize("elkan5e.wildMage.alterWildSurge")}</h2>
							<p>${game.i18n.localize("elkan5e.wildMage.abilityUsage")}</p>
							${
								avert
									? `<p>${game.i18n.format("elkan5e.wildMage.avertDisasterUses", {
											remaining:
												avert.system.uses.max - avert.system.uses.spent,
										})}</p>`
									: ""
							}
							${
								delay
									? `<p>${game.i18n.format("elkan5e.wildMage.delayedSurgeUses", {
											remaining:
												delay.system.uses.max - delay.system.uses.spent,
										})}</p>`
									: ""
							}
						`,
						buttons: Object.entries(buttons).map(([action, data]) => ({
							action,
							...data,
						})),
					}).render(true);
				}
			}
		}
	}
}

/**
 * Creates a delay button for the actor's "Delayed Surge" item.
 *
 * @param {Actor} actor - The actor object containing the items.
 * @param {number} rollResult - The result of the roll to be used in the delayed surge description.
 * @returns {Promise<object|null>} A promise that resolves to the button configuration object or null if the "Delayed Surge" item is not found.
 */
async function createDelayButton(actor, rollResult) {
	const delay = actor.items.find((i) => i.system.identifier === "delayed-surge");
	if (!delay) return null;

	return {
		label: game.i18n.localize("elkan5e.wildMage.delayedSurge"),
		callback: async () => {
			await delay.update({ "system.uses.spent": delay.system.uses.spent + 1 });
			const delayedSurge = {
				name: game.i18n.localize("elkan5e.wildMage.delayedWildSurge"),
				type: "consumable",
				img: "icons/magic/defensive/barrier-shield-dome-deflect-blue.webp",
				system: {
					activities: {
						"4x72PccdTFiNUQqd": {
							type: "utility",
							_id: "4x72PccdTFiNUQqd",
							sort: 0,
							activation: {
								type: "reaction",
								value: null,
								override: false,
								condition: "",
							},
							consumption: {
								scaling: {
									allowed: false,
								},
								spellSlot: true,
								targets: [
									{
										type: "itemUses",
										value: "1",
										scaling: {},
									},
								],
							},
							description: {
								chatFlavor: "",
							},
							duration: {
								units: "inst",
								concentration: false,
								override: false,
							},
							effects: [],
							range: {
								override: false,
								units: "self",
								special: "",
							},
							target: {
								template: {
									contiguous: false,
									units: "ft",
									type: "",
								},
								affects: {
									choice: false,
									type: "",
								},
								override: false,
								prompt: true,
							},
							uses: {
								spent: 0,
								recovery: [],
								max: "",
							},
							roll: {
								prompt: false,
								visible: false,
								formula: "",
								name: "",
							},
							useConditionText: "",
							effectConditionText: "",
							macroData: {
								name: "",
								command: "",
							},
							ignoreTraits: {
								idi: false,
								idr: false,
								idv: false,
								ida: false,
							},
							midiProperties: {
								ignoreTraits: [],
								triggeredActivityId: "none",
								triggeredActivityConditionText: "",
								triggeredActivityTargets: "targets",
								triggeredActivityRollAs: "self",
								forceDialog: false,
								confirmTargets: "default",
								autoTargetType: "any",
								autoTargetAction: "default",
								automationOnly: false,
								otherActivityCompatible: true,
								identifier: "",
							},
							name: "",
						},
					},
					uses: {
						spent: 0,
						max: 1,
						autoDestroy: true,
					},
					description: {
						value: game.i18n.format("elkan5e.wildMage.delayedWildSurgeDescription", {
							result: rollResult,
						}),
					},
					identifier: "delayed-wild-surge",
					source: {
						source: "Elkan5e",
					},
					properties: ["mgc"],
				},
			};

			const delayedSurgeEffect = {
				name: game.i18n.localize("elkan5e.wildMage.delayedWildSurgeDuration"),
				transfer: false,
				img: "icons/magic/defensive/barrier-shield-dome-deflect-blue.webp",
				duration: {
					seconds: 3600,
				},
				flags: {
					dae: {
						selfTarget: true,
						stackable: "multi",
						specialDuration: ["shortRest"],
					},
				},
			};

			await actor.createEmbeddedDocuments("Item", [delayedSurge]);
			await actor.createEmbeddedDocuments("ActiveEffect", [delayedSurgeEffect]);
		},
		disabled: delay.system.uses.spent >= delay.system.uses.max,
	};
}
/**
 * Creates a cancel button for the actor
 *
 */
async function createCancelButton() {
	return {
		label: game.i18n.localize("elkan5e.wildMage.cancel"),
		callback: () => {},
	};
}

/**
 * Handle the delayed wild surge duration effect.
 *
 * @param {ActiveEffect} effect - The effect object to be processed.
 * @returns {Promise<void>} A promise that resolves when the effect has been processed.
 */
export async function delayedDuration(effect) {
	if (effect.name === game.i18n.localize("elkan5e.wildMage.delayedWildSurgeDuration")) {
		await deletedEffectRemovesItem(
			effect,
			game.i18n.localize("elkan5e.wildMage.delayedWildSurge"),
		);
	}
}

/**
 * Handle the delayed wild surge item.
 *
 * @param {Item} item - The item object to be processed.
 * @returns {Promise<void>} A promise that resolves when the item has been processed.
 */
export async function delayedItem(item) {
	if (item.name === game.i18n.localize("elkan5e.wildMage.delayedWildSurge")) {
		await deletedItemRemovesEffect(
			item,
			game.i18n.localize("elkan5e.wildMage.delayedWildSurgeDuration"),
		);
	}
}
