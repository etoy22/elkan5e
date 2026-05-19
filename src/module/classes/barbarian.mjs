const DialogV2 = foundry.applications.api.DialogV2;

const SEETHING_BLOOD_PACK = "Compendium.elkan5e.elkan5e-class-features.Item.";
const WILD_BLOOD_UUID = "Compendium.elkan5e.elkan5e-class-features.Item.KQRBbG42MjUiR6im";

/**
 * Maps sorcerer subclass "Origin Spells" level → Bloodrager spell ItemChoice advancement ID.
 *
 * Sorcerer subclasses grant origin spells at sorcerer levels 1, 3, 5, (7), and 9.
 * These map directly to spell levels 1–5 and to the corresponding Bloodrager
 * ItemChoice advancements that are unlocked at barbarian levels 3, 3, 6, 10, and 14.
 *
 * @type {Record<number, string>}
 */
const SORC_LEVEL_TO_ADV_ID = {
	1: "PMJ0bGS8Uu1A5A9T", // Barbarian 3  — 1st-level spell
	3: "JB55YY5KxtyBr1BL", // Barbarian 3  — 2nd-level spell
	5: "iqPa7l0unpdAf8dD", // Barbarian 6  — 3rd-level spell
	7: "yCEOFfmapnP9nnTm", // Barbarian 10 — 4th-level spell
	9: "nH3gtuDMDUPnHECo", // Barbarian 14 — 5th-level spell
};

/**
 * Maps barbarian class level to the sorcerer origin level whose spell pool should be
 * populated at that barbarian level-up.  Used by the level-up hook for late-level spells.
 *
 * @type {Record<number, number>}
 */
const BARB_LEVEL_TO_SORC_ORIGIN_LEVEL = {
	6: 5,
	10: 7,
	14: 9,
};

/**
 * Extracts origin spell UUIDs from a sorcerer subclass document, keyed by sorcerer level.
 *
 * @param {Item5e} subclassDoc - Fully-loaded sorcerer subclass item from the compendium.
 * @returns {Record<number, string>} e.g. { 1: "Compendium.…", 3: "Compendium.…", … }
 */
function extractOriginSpells(subclassDoc) {
	const result = {};
	for (const adv of subclassDoc.system?.advancement ?? []) {
		if (adv.title !== "Origin Spells" || adv.type !== "ItemGrant") continue;
		const uuid = adv.configuration?.items?.[0]?.uuid;
		if (uuid) result[adv.level] = uuid;
	}
	return result;
}

/**
 * Writes spell UUIDs into the matching ItemChoice advancement pools on the Bloodrager
 * subclass item that lives on an actor.
 *
 * @param {Item5e}               bloodragerItem - The bloodrager subclass item on the actor.
 * @param {Record<number,string>} originSpells  - { sorcLevel: uuid } map.
 * @param {number[]}             [sorcLevels]   - Subset of levels to update; defaults to all.
 * @returns {Promise<void>}
 */
async function populateBloodragerSpellPools(bloodragerItem, originSpells, sorcLevels) {
	const levels = sorcLevels ?? Object.keys(SORC_LEVEL_TO_ADV_ID).map(Number);
	const advancements = bloodragerItem.system.advancement.map((a) =>
		foundry.utils.deepClone(a),
	);

	let changed = false;
	for (const sorcLevel of levels) {
		const uuid = originSpells[sorcLevel];
		const advId = SORC_LEVEL_TO_ADV_ID[sorcLevel];
		if (!uuid || !advId) continue;

		const idx = advancements.findIndex((a) => a._id === advId);
		if (idx === -1) continue;

		advancements[idx].configuration.pool = [{ uuid, optional: false }];
		changed = true;
	}

	if (changed) {
		await bloodragerItem.update({ "system.advancement": advancements });
	}
}

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
 * Hook callback for "createItem". Fires when the Bloodrager subclass item is
 * created on an actor and handles origin selection, subclass rename, spell pool
 * population, and Seething Blood / Wild Blood grants.
 *
 * @param {Item5e} item      - The newly created item document.
 * @param {object} _options  - Creation options (unused).
 * @param {string} userId    - The ID of the user who triggered the creation.
 * @returns {Promise<void>}
 */
export async function onBloodragerCreateItem(item, _options, userId) {
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

	// --- 2. Show origin picker (modal so AdvancementManager is blocked until confirmed) ---
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
		modal: true,
	});
	if (!chosenId) return;

	const chosenOrigin = origins.find((o) => o._id === chosenId);
	if (!chosenOrigin) return;

	// --- 3. Rename subclass ---
	const newName = `${chosenOrigin.name} Bloodrager`;
	await item.update({ name: newName });

	// --- 4. Populate spell pools from origin's "Origin Spells" advancements ---
	try {
		const pack = game.packs.get("elkan5e.elkan5e-class");
		if (pack) {
			const subclassDoc = await pack.getDocument(chosenOrigin._id);
			if (subclassDoc) {
				const originSpells = extractOriginSpells(subclassDoc);
				// Store on actor so the level-up hook can access them later.
				await actor.update({
					"flags.elkan5e.bloodrager": { originSpells },
				});
				// Pre-populate all pools now (covers levels 3, 6, 10, 14 in one shot).
				await populateBloodragerSpellPools(item, originSpells);
			}
		}
	} catch (err) {
		console.error("Elkan 5e | Error populating Bloodrager spell pools:", err);
	}

	// --- 5. Determine and grant Seething Blood ---
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
				modal: true,
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

	// --- 6. Wild Mage: auto-grant Wild Blood ---
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
}

/**
 * Called from the updateActor hook.  When a Bloodrager's barbarian level reaches
 * 6, 10, or 14, re-verifies (and if needed re-populates) the spell pool for that
 * level's ItemChoice advancement using the origin spells stored on the actor.
 *
 * This acts as a safety net: the createItem hook pre-populates all pools, but this
 * ensures pools are correct even if the character was created before this feature
 * existed or if the flag was set in a previous session.
 *
 * @param {Actor5e} actor   - Updated actor document.
 * @param {object}  changes - Delta object passed by the updateActor hook.
 * @returns {Promise<void>}
 */
export async function updateBloodragerOnLevelup(actor, changes) {
	const newBarbLevel = changes.system?.classes?.barbarian?.levels;
	if (!newBarbLevel) return; // barbarian level didn't change in this update

	const sorcOriginLevel = BARB_LEVEL_TO_SORC_ORIGIN_LEVEL[newBarbLevel];
	if (!sorcOriginLevel) return; // not a level that unlocks a new spell pool

	// Only applies to Bloodrager subclass.
	const bloodragerItem = actor.items.find(
		(i) => i.type === "subclass" && i.system?.identifier === "bloodrager",
	);
	if (!bloodragerItem) return;

	const originSpells = actor.flags?.elkan5e?.bloodrager?.originSpells;
	if (!originSpells) return; // origin was never set (shouldn't happen in normal use)

	try {
		await populateBloodragerSpellPools(bloodragerItem, originSpells, [sorcOriginLevel]);
	} catch (err) {
		console.error("Elkan 5e | Error updating Bloodrager spell pool on level-up:", err);
	}
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

/**
 * Called from the deleteItem hook.  When the Bloodrager subclass item is removed from
 * an actor (e.g. the player delevels below 3 or uses the advancement manager to undo),
 * this function:
 *
 *   1. Removes the stored origin data from the actor's flags so a fresh origin can be
 *      chosen the next time the Bloodrager subclass is added.
 *
 *   2. Removes any Seething Blood item that was auto-granted by the module
 *      (identified by a "seething-blood-" identifier prefix).
 *
 *   3. Removes the Wild Blood item if it was auto-granted (identifier "wild-blood").
 *
 * Items that were granted through the AdvancementManager's own tracking are left to
 * the system to handle; only the hook-granted items need manual cleanup here.
 *
 * @param {Item5e} item    - The item being deleted.
 * @param {object} _options
 * @param {string} userId  - ID of the user performing the deletion.
 * @returns {Promise<void>}
 */
export async function handleBloodragerDelete(item, _options, userId) {
	if (game.user.id !== userId) return;
	const actor = item.parent;
	if (!actor || actor.documentName !== "Actor") return;
	if (item.type !== "subclass" || item.system?.identifier !== "bloodrager") return;

	// --- 1. Clear stored origin flag so the next subclass add starts fresh ---
	try {
		await actor.unsetFlag("elkan5e", "bloodrager");
	} catch (err) {
		console.error("Elkan 5e | Error clearing Bloodrager origin flag:", err);
	}

	// Collect actor item IDs to delete.
	const toDelete = [];

	// --- 2. Remove all Seething Blood variants (any "seething-blood-*" identifier) ---
	for (const i of actor.items) {
		if (i.system?.identifier?.startsWith("seething-blood-")) toDelete.push(i.id);
	}

	// --- 3. Remove Wild Blood if present ---
	const wildBloodItem = actor.items.find((i) => i.system?.identifier === "wild-blood");
	if (wildBloodItem) toDelete.push(wildBloodItem.id);

	if (toDelete.length) {
		try {
			await actor.deleteEmbeddedDocuments("Item", toDelete);
		} catch (err) {
			console.error("Elkan 5e | Error removing Bloodrager granted items:", err);
		}
	}

	if (actor.isOwner) {
		ui.notifications.info(
			`${actor.name}'s Bloodrager origin has been cleared. Seething Blood and Wild Blood removed.`,
		);
	}
}

/**
 * Called from the preDeleteItem hook (fires BEFORE the item is removed from the DB).
 * Resets the Bloodrager subclass name back to "Bloodrager" so that if the document
 * object is cached or re-used anywhere after deletion it carries the canonical name,
 * and so any advancement-manager redo path that clones the existing item gets the
 * clean base name rather than the origin-prefixed one.
 *
 * In normal play the re-created compendium copy already has the base name, so this
 * is a defensive belt-and-braces step.
 *
 * @param {Item5e} item    - The item about to be deleted.
 * @param {object} _options
 * @param {string} userId  - ID of the user performing the deletion.
 * @returns {Promise<void>}
 */
export async function preHandleBloodragerDelete(item, _options, userId) {
	if (game.user.id !== userId) return;
	const actor = item.parent;
	if (!actor || actor.documentName !== "Actor") return;
	if (item.type !== "subclass" || item.system?.identifier !== "bloodrager") return;
	if (item.name === "Bloodrager") return; // already clean

	try {
		await item.update({ name: "Bloodrager" });
	} catch (err) {
		// Non-fatal — item is being deleted anyway.
		console.warn("Elkan 5e | Could not reset Bloodrager name before deletion:", err);
	}
}
