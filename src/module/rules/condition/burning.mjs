// Burning condition automation for Elkan 5e.
// Grants the "Quench Burning" action item when a creature gains the Burning condition,
// and removes it when the condition ends.

const QUENCH_BURNING_IDENTIFIER = "quench-burning";
const BURNING_STATUS_ID = "burning";

/**
 * Check whether an ActiveEffect represents the Burning condition.
 *
 * @param {ActiveEffect} effect - Active effect to check.
 * @returns {boolean} Whether the effect is the burning condition.
 */
function isBurningEffect(effect) {
	if (!effect) return false;
	// Check the statuses Set (v11+)
	const statuses = effect?.statuses;
	if (statuses instanceof Set && statuses.has(BURNING_STATUS_ID)) return true;
	if (Array.isArray(statuses) && statuses.includes(BURNING_STATUS_ID)) return true;
	// Fallback: check the core statusId flag
	if (effect?.flags?.core?.statusId === BURNING_STATUS_ID) return true;
	return false;
}

/**
 * Build the item data for the "Quench Burning" action feature.
 *
 * @returns {object} Item data object suitable for createEmbeddedDocuments.
 */
function buildQuenchBurningItem() {
	return {
		name: "Quench Burning",
		type: "feat",
		img: "modules/elkan5e/icons/hazards/burning.svg",
		flags: {
			"midi-qol": {
				onUseMacroName: "[postActiveEffects]ItemMacro",
				rollAttackPerTarget: "default",
				removeAttackDamageButtons: "default",
				itemCondition: "",
				effectCondition: "",
				reactionCondition: "",
				otherCondition: "",
			},
			midiProperties: {
				confirmTargets: "default",
				autoFailFriendly: false,
				autoSaveFriendly: false,
				critOther: false,
				offHandWeapon: false,
				magicdam: false,
				magiceffect: false,
				concentration: false,
				noConcentrationCheck: false,
				toggleEffect: false,
				ignoreTotalCover: false,
				idr: false,
				idi: false,
				idv: false,
				ida: false,
			},
			dae: {
				macro: {
					name: "Quench Burning",
					img: "modules/elkan5e/icons/hazards/burning.svg",
					type: "script",
					scope: "global",
					command: "return await elkan5e.macros.features.quenchBurning(workflow);",
				},
			},
		},
		system: {
			description: {
				value: "<p><strong>Action</strong> - Self</p><ul><li><p>Remove the &amp;reference[burning] condition and become &amp;reference[prone].</p></li></ul>",
				chat: "",
			},
			source: {
				custom: "elkan5e.com/burning",
				revision: 1,
				rules: "2024",
				book: "Elkan 5e",
				page: "",
				license: "",
			},
			identifier: QUENCH_BURNING_IDENTIFIER,
			type: { value: "class", subtype: "" },
			uses: { max: "", recovery: [], spent: 0 },
			activities: {
				dnd5eactivity000: {
					_id: "dnd5eactivity000",
					type: "utility",
					activation: {
						type: "action",
						value: 1,
						condition: "",
						override: false,
					},
					consumption: {
						targets: [],
						scaling: { allowed: false, max: "" },
						spellSlot: true,
					},
					description: { chatFlavor: "" },
					duration: {
						concentration: false,
						value: "",
						units: "inst",
						special: "",
						override: false,
					},
					effects: [],
					range: { units: "self", special: "", override: false },
					target: {
						template: {
							count: "",
							contiguous: false,
							type: "",
							size: "",
							width: "",
							height: "",
							units: "ft",
						},
						affects: {
							count: "",
							type: "self",
							choice: false,
							special: "",
						},
						prompt: false,
						override: false,
					},
					uses: { spent: 0, max: "", recovery: [] },
					roll: { formula: "", name: "", prompt: false, visible: false },
					name: "",
					img: "",
				},
			},
			prerequisites: { level: null },
			properties: [],
		},
	};
}

/**
 * Handle the creation of the Burning condition: grant the "Quench Burning" action.
 *
 * @param {ActiveEffect} effect - The newly created active effect.
 * @returns {Promise<void>} Completion.
 */
export async function handleBurningCreate(effect) {
	if (!game.user?.isGM) return;
	if (!isBurningEffect(effect)) return;

	const actor = effect.parent;
	if (!actor || actor.documentName !== "Actor") return;

	// Don't add a duplicate if the item is already there.
	const existing = actor.items.find((i) => i.system?.identifier === QUENCH_BURNING_IDENTIFIER);
	if (existing) return;

	try {
		await actor.createEmbeddedDocuments("Item", [buildQuenchBurningItem()]);
	} catch (err) {
		console.error("Elkan 5e | Failed to create Quench Burning item", err);
	}
}

/**
 * Handle the deletion of the Burning condition: remove the "Quench Burning" action.
 *
 * @param {ActiveEffect} effect - The deleted active effect.
 * @returns {Promise<void>} Completion.
 */
export async function handleBurningDelete(effect) {
	if (!game.user?.isGM) return;
	if (!isBurningEffect(effect)) return;

	const actor = effect.parent;
	if (!actor || actor.documentName !== "Actor") return;

	// If the actor still has another burning effect active, don't remove the item yet.
	const stillBurning = [...(actor.effects ?? [])].some(
		(e) => e.id !== effect.id && isBurningEffect(e),
	);
	if (stillBurning) return;

	const item = actor.items.find((i) => i.system?.identifier === QUENCH_BURNING_IDENTIFIER);
	if (!item) return;

	try {
		await item.delete();
	} catch (err) {
		console.error("Elkan 5e | Failed to delete Quench Burning item", err);
	}
}

/**
 * Execute the "Quench Burning" action macro:
 * removes the burning condition and applies prone.
 * The item removes itself via the handleBurningDelete hook triggered by burning's deletion.
 *
 * @param {object} workflow - midi-qol workflow object.
 * @returns {Promise<void>} Completion.
 */
export async function quenchBurning(workflow) {
	const actor = workflow?.actor;
	if (!actor) return;

	// Remove the burning status effect — this also triggers handleBurningDelete,
	// which will clean up the Quench Burning item.
	const burningEffect = [...(actor.effects ?? [])].find((e) => isBurningEffect(e));
	if (burningEffect) {
		try {
			await burningEffect.delete();
		} catch (err) {
			console.error("Elkan 5e | Quench Burning: failed to remove burning effect", err);
		}
	}

	// Apply prone.
	try {
		await actor.toggleStatusEffect("prone", { active: true });
	} catch (err) {
		console.error("Elkan 5e | Quench Burning: failed to apply prone", err);
	}
}
