const DialogV2 = foundry.applications.api.DialogV2;

const SEETHING_BLOOD_PACK = "Compendium.elkan5e.elkan5e-class-features.Item.";
const WILD_BLOOD_UUID = "Compendium.elkan5e.elkan5e-class-features.Item.KQRBbG42MjUiR6im";

/**
 * Returns every sorcerer subclass in the elkan5e-class compendium, sorted by name.
 * Includes _id, name, and system.identifier so callers never need to load full documents.
 *
 * @returns {Promise<Array<{_id: string, name: string, identifier: string}>>}
 */
async function getSorcererSubclasses() {
	const pack = game.packs.get("elkan5e.elkan5e-class");
	if (!pack) {
		console.error("Elkan 5e | Pack elkan5e.elkan5e-class not found.");
		return [];
	}
	const index = await pack.getIndex({
		fields: ["type", "system.classIdentifier", "system.identifier"],
	});
	return index
		.filter((e) => e.type === "subclass" && e.system?.classIdentifier === "sorcerer")
		.map((e) => ({ _id: e._id, name: e.name, identifier: e.system?.identifier ?? "" }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns every Seething Blood variant in the elkan5e-class-features compendium,
 * identified by the "seething-blood-" identifier prefix, sorted by name.
 *
 * @returns {Promise<Array<{_id: string, name: string}>>}
 */
async function getSeethingBloodVariants() {
	const pack = game.packs.get("elkan5e.elkan5e-class-features");
	if (!pack) {
		console.error("Elkan 5e | Pack elkan5e.elkan5e-class-features not found.");
		return [];
	}
	const index = await pack.getIndex({ fields: ["system.identifier"] });
	return index
		.filter((e) => e.system?.identifier?.startsWith("seething-blood-"))
		.map((e) => ({ _id: e._id, name: e.name }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Per-origin config for auto-granting Seething Blood and Wild Blood.
 *
 * - `seethingBloodId`      Direct item ID when only one damage type applies.
 * - `seethingBloodChoices` Shown in a dialog when multiple types are valid
 *                          (Draconic dragon colour, Water Savant acid vs cold).
 * - `wildBlood`            When true, Wild Blood is also auto-granted.
 *
 * @type {Record<string, {name: string, seethingBloodId?: string, seethingBloodChoices?: Array<{label: string, id: string}>, wildBlood?: boolean}>}
 */
const BLOODRAGER_ORIGIN_CONFIG = {
	"air-savant": {
		name: "Air Savant",
		seethingBloodId: "RKDK2wY0gQ5AZwhl", // Electric
	},
	draconic: {
		name: "Draconic",
		seethingBloodChoices: [
			{ label: "Acid (Black Dragon / Copper Dragon)", id: "5F1s1v4KV38cuGGc" },
			{ label: "Cold (Silver Dragon / White Dragon)", id: "jvdWHOFY6rLvcHiF" },
			{ label: "Fire (Red Dragon)", id: "MnbsIswRTHbhzwQf" },
			{ label: "Lightning (Blue Dragon)", id: "RKDK2wY0gQ5AZwhl" },
			{ label: "Necrotic", id: "fYqI43veyIOTozP6" },
			{ label: "Poison (Gold Dragon / Green Dragon)", id: "fnSUIhgUgATyzU5r" },
			{ label: "Psychic (Brass Dragon)", id: "5ooYzCYY96MQPsOM" },
			{ label: "Radiant", id: "abB7gM8ejbOSsDWI" },
			{ label: "Sonic (Bronze Dragon)", id: "q9C6oHZUB2smNC4n" },
		],
	},
	"earth-savant": {
		name: "Earth Savant",
		seethingBloodId: "q9C6oHZUB2smNC4n", // Sonic
	},
	"fire-savant": {
		name: "Fire Savant",
		seethingBloodId: "MnbsIswRTHbhzwQf", // Fire
	},
	"water-savant": {
		name: "Water Savant",
		seethingBloodChoices: [
			{ label: "Acid", id: "5F1s1v4KV38cuGGc" },
			{ label: "Cold", id: "jvdWHOFY6rLvcHiF" },
		],
	},
	"wild-mage": {
		name: "Wild Mage",
		seethingBloodId: "6Ls83XZoDAFwcDT6", // Force
		wildBlood: true,
	},
};

const WILD_BLOOD_SPELL_IDENTIFIERS = new Set([
	"chromatic-orb",
	"prismatic-bolt",
	"blink",
	"confusion",
	"prismatic-spray",
]);

/**
 * Registers Bloodrager-specific hooks.
 *
 * Fires when the Bloodrager subclass item itself is created on an actor
 * (i.e. the player just picked Bloodrager during advancement or dragged it
 * onto the sheet).  The hook then:
 *
 *   1. Queries the elkan5e-class compendium at runtime for every sorcerer
 *      subclass and presents a live origin picker — so any new sorcerer
 *      subclass you add to the module appears automatically with no extra
 *      configuration needed.
 *
 *   2. Renames the Bloodrager subclass item to "<Origin> Bloodrager".
 *
 *   3. Auto-grants the correct Seething Blood feat.
 *      - Known origins with one damage type: granted immediately.
 *      - Known origins with multiple types (Draconic, Water Savant): a short
 *        element picker appears.
 *      - Unknown origins: falls back to a full picker built dynamically from
 *        every "seething-blood-*" item in the elkan5e-class-features compendium.
 *
 *   4. Auto-grants Wild Blood for Wild Mage origins.
 */
export function registerBloodragerHooks() {
	Hooks.on("createItem", async (item, _options, userId) => {
		if (game.user.id !== userId) return;
		const actor = item.parent;
		if (!actor || actor.documentName !== "Actor") return;

		// Only trigger when the Bloodrager subclass item is added.
		if (item.type !== "subclass" || item.system?.identifier !== "bloodrager") return;

		// --- 1. Build dynamic origin list from compendium ---
		const origins = await getSorcererSubclasses();
		if (!origins.length) {
			console.warn(
				"Elkan 5e | No sorcerer subclasses found; skipping Bloodrager origin setup.",
			);
			return;
		}

		// --- 2. Show origin picker ---
		const originOptions = origins
			.map((o) => `<option value="${o._id}">${o.name}</option>`)
			.join("");
		const chosenId = await DialogV2.prompt({
			window: { title: "Bloodrager — Choose Sorcerous Origin" },
			content: `<p>Choose the Sorcerous Origin that flows through your blood.
			           This determines your Seething Blood damage, your spells, and
			           whether you gain Wild Blood at level 6.</p>
			          <select name="origin" style="width:100%;margin-top:4px">${originOptions}</select>`,
			ok: {
				label: "Confirm",
				callback: (_event, button) => button.form.elements.origin.value,
			},
			rejectClose: false,
		});
		if (!chosenId) return;

		const chosenOrigin = origins.find((o) => o._id === chosenId);
		if (!chosenOrigin) return;

		// --- 3. Rename subclass ---
		const newName = `${chosenOrigin.name} Bloodrager`;
		await item.update({ name: newName });

		// --- 4. Determine and grant Seething Blood ---
		const config = BLOODRAGER_ORIGIN_CONFIG[chosenOrigin.identifier];
		let seethingBloodId = config?.seethingBloodId;

		if (!seethingBloodId) {
			// Build option list: narrowed for known multi-type origins, full list for unknowns.
			const choices = config?.seethingBloodChoices?.length
				? config.seethingBloodChoices.map((c) => ({ _id: c.id, name: c.label }))
				: await getSeethingBloodVariants();

			if (choices.length) {
				const sbOptions = choices
					.map((c) => `<option value="${c._id}">${c.name}</option>`)
					.join("");
				seethingBloodId = await DialogV2.prompt({
					window: { title: `${chosenOrigin.name} Bloodrager — Choose Element` },
					content: `<p>Choose the damage type for your Seething Blood:</p>
					          <select name="element" style="width:100%;margin-top:4px">${sbOptions}</select>`,
					ok: {
						label: "Confirm",
						callback: (_event, button) => button.form.elements.element.value,
					},
					rejectClose: false,
				});
			}
		}

		if (seethingBloodId) {
			try {
				const sbItem = await fromUuid(`${SEETHING_BLOOD_PACK}${seethingBloodId}`);
				if (sbItem) await actor.createEmbeddedDocuments("Item", [sbItem.toObject()]);
			} catch (err) {
				console.error("Elkan 5e | Error granting Seething Blood:", err);
			}
		}

		// --- 5. Wild Mage: auto-grant Wild Blood ---
		if (config?.wildBlood) {
			try {
				const wbItem = await fromUuid(WILD_BLOOD_UUID);
				if (wbItem) await actor.createEmbeddedDocuments("Item", [wbItem.toObject()]);
			} catch (err) {
				console.error("Elkan 5e | Error granting Wild Blood:", err);
			}
		}

		ui.notifications.info(
			`Bloodrager origin set — subclass renamed to "${newName}" and Seething Blood granted.`,
		);
	});
}

/**
 * Runs rage class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function rage(workflow) {
	console.log("Elkan 5e | Rage triggered");
	const actor = workflow.actor;
	let notification = "elkan5e.notifications.FeralInstinctsMove";

	// Use system.identifier instead of name
	const hasFeral = actor.items.find((i) => i.system.identifier === "feral-instinct");
	const hasImproved = actor.items.find((i) => i.system.identifier === "improved-feral-instincts");

	if (hasFeral || hasImproved) {
		if (hasImproved) {
			notification = "elkan5e.notifications.ImprovedFeralInstinctsMove";
		}
		if (actor.isOwner) {
			ui.notifications.notify(game.i18n.format(notification, { name: actor.name }));
		}
	}
}

/**
 * Runs wild Blood class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function wildBlood(workflow) {
	const item = workflow.item;
	const scope = workflow.scope;
	if (!game.modules.get("elkan5e")?.active) return;

	if (item.type !== "spell" || !item.system.activities) return;

	const activityId = scope.workflow.uuid?.split(".").pop();
	const activity =
		item.system.activities?.[activityId] ??
		Object.values(item.system.activities ?? {}).find((a) => a?.id === activityId);
	if (!activity) return;

	const type = activity.type;
	const level = item.system.level;
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

	const identifier = item.system?.identifier;

	if (!identifier || !WILD_BLOOD_SPELL_IDENTIFIERS.has(identifier)) return;

	let confirmed = await DialogV2.confirm({
		window: { title: game.i18n.localize("elkan5e.barbarian.wildBloodTitle") },
		content: `<p>${game.i18n.localize("elkan5e.barbarian.wildBloodContent")}</p>?`,
		rejectClose: false,
		modal: true,
	});

	if (!confirmed) return;
	if (type !== "utility" || identifier === "blink") {
		let tableUUID = TABLE_UUIDS[level];
		if (tableUUID) {
			try {
				const table = await fromUuid(
					`Compendium.elkan5e.elkan5e-roll-tables.RollTable.${tableUUID}`,
				);
				if (table) {
					table.draw({ displayChat: true });
				}
			} catch (error) {
				console.error("Error drawing from Wild Blood table: ", error);
			}
		}
	}
}
