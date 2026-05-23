import { drainedEffect } from "../shared/helpers.mjs";

const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Runs life Drain Graveguard class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function lifeDrainGraveguard(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = workflow.token.actor.uuid;

	if (!caster || !casterToken) {
		console.warn("Life Drain aborted: missing actor or actorToken");
		return;
	}
	for (const dmgEntry of workflow.damageList) {
		const damage = (dmgEntry.tempDamage ?? 0) + (dmgEntry.hpDamage ?? 0);
		if (damage <= 0 || !dmgEntry.isHit) continue;

		if (!dmgEntry.targetUuid) {
			console.warn("Life Drain: damageList entry missing targetUuid", dmgEntry);
			continue;
		}

		const parts = dmgEntry.targetUuid.split(".");
		if (parts.length < 4) {
			console.warn("Life Drain: Invalid targetUuid format", dmgEntry.targetUuid);
			continue;
		}
		const tokenId = parts[3];
		const targetToken = canvas.tokens.get(tokenId);
		if (!targetToken) {
			console.warn(`Life Drain: Token with ID ${tokenId} not found on canvas`);
			continue;
		}

		await drainedEffect(
			targetToken.actor,
			damage,
			"Life Drain",
			"icons/magic/unholy/strike-hand-glow-pink.webp",
			casterUuid,
		);
	}
}
/**
 * Runs spectral Empowerment class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function spectralEmpowerment(workflow) {
	const caster = workflow.actor;
	const casterToken = workflow.token;
	const casterUuid = workflow.token.actor.uuid;

	if (!caster || !casterToken) {
		console.warn("Spectral Empowerment aborted: missing actor or actorToken");
		return;
	}
	for (const dmgEntry of workflow.damageList) {
		const damage = (dmgEntry.tempDamage ?? 0) + (dmgEntry.hpDamage ?? 0);
		if (damage <= 0 || !dmgEntry.isHit) continue;

		if (!dmgEntry.targetUuid) {
			console.warn("Spectral Empowerment: damageList entry missing targetUuid", dmgEntry);
			continue;
		}

		const parts = dmgEntry.targetUuid.split(".");
		if (parts.length < 4) {
			console.warn("Spectral Empowerment: Invalid targetUuid format", dmgEntry.targetUuid);
			continue;
		}
		const tokenId = parts[3];
		const targetToken = canvas.tokens.get(tokenId);
		if (!targetToken) {
			console.warn(`Spectral Empowerment: Token with ID ${tokenId} not found on canvas`);
			continue;
		}

		await drainedEffect(
			targetToken.actor,
			damage,
			"Spectral Empowerment",
			"icons/magic/unholy/strike-hand-glow-pink.webp",
			casterUuid,
		);
	}
}

/**
 * Runs soul Conduit class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function soulConduit(workflow) {
	try {
		console.log("Elkan 5e | Soul Conduit check");
		const item = workflow.item ?? workflow;
		if (!item || item.type !== "spell") return;

		const school = (item.system?.school || "").toLowerCase();
		const level = Number(item.system?.level ?? 0);
		if (school !== "necromancy" || level < 1) return;

		const actor = workflow.actor ?? (workflow.token ? workflow.token.actor : null);
		if (!actor) return;
		const hasSoul = actor.items.find(
			(i) => i.system?.identifier === "soul-conduit" || i.name === "Soul Conduit",
		);
		if (hasSoul && actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.SoulConduitReminder", { name: actor.name }),
			);
		}
	} catch (err) {
		console.error("elkan5e | soulConduit error:", err);
	}
}

/**
 * Runs necromantic Surge class feature automation.
 *
 * @param {*} workflow - Workflow payload from the triggering item or activity.
 * @returns {Promise<void>} Promise resolution result.
 */
export async function necromanticSurge(workflow) {
	try {
		console.log("Elkan 5e | Necromantic Surge check");
		const item = workflow.item ?? workflow;
		if (!item || item.type !== "spell") return;

		const school = (item.system?.school || "").toLowerCase();
		const level = Number(item.system?.level ?? 0);
		if (school !== "necromancy" || level < 3) return;

		const actor = workflow.actor ?? (workflow.token ? workflow.token.actor : null);
		if (!actor) return;
		const hasSurge = actor.items.find(
			(i) => i.system?.identifier === "necromantic-surge" || i.name === "Necromantic Surge",
		);
		if (hasSurge && actor.isOwner) {
			ui.notifications.notify(
				game.i18n.format("elkan5e.notifications.NecromanticSurgeReminder", {
					name: actor.name,
				}),
			);
			try {
				const content = `<p>${game.i18n.localize("elkan5e.notifications.NecromanticSurgeOptions") || "Choose an additional Necromantic Surge effect."}</p>`;
				new DialogV2({
					window: {
						title:
							game.i18n.localize(
								"elkan5e.notifications.NecromanticSurgeReminderTitle",
							) || "Necromantic Surge",
					},
					content,
					buttons: [
						{
							action: "ok",
							label: game.i18n.localize("OK") || "OK",
							default: true,
						},
					],
				}).render(true);
			} catch {
				// ignore dialog failures
			}
		}
	} catch (err) {
		console.error("elkan5e | necromanticSurge error:", err);
	}
}


// --- Wizard school spell-pool automation (disabled) ---


// Wizard school spell-pool automation -- commented out, revisit later

// // ---------------------------------------------------------------------------
// // Wizard school spell-pool automation
// // ---------------------------------------------------------------------------

// /**
//  * All Wizard class ItemChoice advancement _ids that present spell selections,
//  * paired with the spell level whose school spells should fill their pool.
//  *
//  * Two entries share spell level 1 and 2 because the Wizard has both a standard
//  * "Spells Known" choice and a "Signature Spells" choice at those levels.
//  *
//  * @type {Array<{advId: string, spellLevel: number}>}
//  */
// const WIZARD_SPELL_ADV_IDS = [
// 	{ advId: "5ZhuAzoQJMlaaco7", spellLevel: 0 }, // Cantrips
// 	{ advId: "datyETELgMFOsKli", spellLevel: 1 }, // Spells Known (1st-level)
// 	{ advId: "FDuVBJEsTd7R78pq", spellLevel: 1 }, // Signature Spells (1st-level)
// 	{ advId: "1VMoFolLunM88mJ1", spellLevel: 2 }, // Spells Known (2nd-level)
// 	{ advId: "JOdJPfltTOCO0Va1", spellLevel: 2 }, // Signature Spells (2nd-level)
// 	{ advId: "DgpltVttdZHNbJ0p", spellLevel: 3 }, // Spells Known (3rd-level)
// 	{ advId: "BO8Tz6rVCPSX8Cb5", spellLevel: 4 }, // Spells Known (4th-level)
// 	{ advId: "GDpp7tUACH7ylZ7k", spellLevel: 5 }, // Spells Known (5th-level)
// 	{ advId: "rB2AhOnRVFlCoDCZ", spellLevel: 6 }, // Spells Known (6th-level)
// 	{ advId: "Ir5ht7kJttSI0dkK", spellLevel: 7 }, // Spells Known (7th-level)
// 	{ advId: "SOG3c64R7MjN3pLC", spellLevel: 8 }, // Spells Known (8th-level)
// 	{ advId: "wBnfG7R07Y6kYKiP", spellLevel: 9 }, // Spells Known (9th-level)
// ];

// /**
//  * Loads spells for a wizard school-specialisation subclass from the
//  * "Spells By Subclass" journal in the elkan5e-rules compendium, returning
//  * them grouped by spell level as pool-entry arrays.
//  *
//  * @param {string} subclassIdentifier - e.g. "abjurer", "evoker", "illusionist", "necromancer".
//  * @returns {Promise<Record<number, Array<{uuid: string, optional: boolean}>>>}
//  */
// async function getWizardSubclassSpells(subclassIdentifier) {
// 	// Load the "Spells By Subclass" journal (ID: PzSXqLYuvUW8TVrM) from elkan5e-rules.
// 	const rulesPack = game.packs.get("elkan5e.elkan5e-rules");
// 	if (!rulesPack) {
// 		console.error("Elkan 5e | Pack elkan5e.elkan5e-rules not found.");
// 		return {};
// 	}
// 	const journal = await rulesPack.getDocument("PzSXqLYuvUW8TVrM");
// 	if (!journal) {
// 		console.error("Elkan 5e | Spells By Subclass journal (PzSXqLYuvUW8TVrM) not found.");
// 		return {};
// 	}

// 	// Find the page whose system.identifier matches this subclass.
// 	const page = journal.pages?.find((p) => p.system?.identifier === subclassIdentifier);
// 	if (!page) {
// 		// Subclass has no curated spell list -- not a school-specialisation subclass.
// 		return {};
// 	}

// 	const spellUuids = page.system?.spells ?? [];
// 	if (!spellUuids.length) {
// 		console.warn(`Elkan 5e | Spells By Subclass page for "${subclassIdentifier}" has no spells.`);
// 		return {};
// 	}

// 	// Build a level-lookup map from the elkan5e-spells index.
// 	const spellsPack = game.packs.get("elkan5e.elkan5e-spells");
// 	if (!spellsPack) {
// 		console.error("Elkan 5e | Pack elkan5e.elkan5e-spells not found.");
// 		return {};
// 	}
// 	const spellsIndex = await spellsPack.getIndex({ fields: ["system.level"] });
// 	const levelById = new Map();
// 	for (const entry of spellsIndex) {
// 		levelById.set(entry._id, entry.system?.level ?? 0);
// 	}

// 	// Group by level, skipping UUIDs not found in the index.
// 	const byLevel = {};
// 	for (const uuid of spellUuids) {
// 		// UUID format: Compendium.elkan5e.elkan5e-spells.Item.<id>
// 		const id = uuid.split(".").at(-1);
// 		if (!id || !levelById.has(id)) {
// 			console.warn(`Elkan 5e | Subclass "${subclassIdentifier}": UUID not in index -- ${uuid}`);
// 			continue;
// 		}
// 		const lvl = levelById.get(id);
// 		if (!byLevel[lvl]) byLevel[lvl] = [];
// 		byLevel[lvl].push({ uuid, optional: false });
// 	}
// 	return byLevel;
// }

// /**
//  * Writes subclass spell UUIDs into every matching Spells Known ItemChoice
//  * advancement pool on a wizard class item via a real DB update.
//  *
//  * @param {Item5e}   wizardClassItem - The wizard class item on the actor.
//  * @param {Record<number, Array<{uuid: string, optional: boolean}>>} spellsByLevel
//  * @returns {Promise<void>}
//  */
// async function populateWizardSpellPools(wizardClassItem, spellsByLevel) {
// 	const rawAdvs = wizardClassItem.system.advancement;
// 	const advancements = (
// 		typeof rawAdvs.toObject === "function"
// 			? rawAdvs.toObject()
// 			: typeof rawAdvs.map === "function"
// 				? rawAdvs.map((a) =>
// 					typeof a.toObject === "function" ? a.toObject() : foundry.utils.deepClone(a),
// 				)
// 				: Object.values(rawAdvs).map((a) =>
// 					typeof a.toObject === "function" ? a.toObject() : foundry.utils.deepClone(a),
// 				)
// 	);

// 	let changed = false;
// 	for (const { advId, spellLevel } of WIZARD_SPELL_ADV_IDS) {
// 		const spells = spellsByLevel[spellLevel];
// 		if (!spells?.length) continue;
// 		const adv = advancements.find((a) => a._id === advId);
// 		if (!adv) continue;
// 		adv.configuration.pool = spells;
// 		changed = true;
// 	}

// 	if (changed) {
// 		await wizardClassItem.update({ "system.advancement": advancements });
// 	}
// }

// /**
//  * WeakSet tracking AdvancementManager instances that have already had their
//  * wizard spell pools populated, so re-renders don't re-run the full load.
//  * @type {WeakSet<Application>}
//  */
// const _wizardManagerSetup = new WeakSet();

// /**
//  * Hook callback for "renderAdvancementManager".  Fires whenever the dnd5e AM
//  * renders.  If the AM is processing a wizard's class advancements and the
//  * wizard has (or is gaining) a school-specialisation subclass, pre-populates
//  * every "Spells Known" ItemChoice pool with school-appropriate spells so they
//  * appear as pre-listed options.  Non-school spells remain accessible via the
//  * AM's drop/search UI because allowDrops is true on those advancements.
//  *
//  * This runs both when the subclass is first added (level-up to 2) and on every
//  * subsequent level-up where the wizard class AM opens -- covering replacement
//  * choices at later levels.
//  *
//  * @param {Application} app - The AdvancementManager instance.
//  * @returns {Promise<void>}
//  */
// export async function onWizardRenderAdvancementManager(app) {
// 	if (_wizardManagerSetup.has(app)) return;

// 	// Resolve the actor this manager is working on.
// 	const actor = app.subject ?? app.actor ?? app.document;
// 	if (!actor || actor.documentName !== "Actor") return;

// 	// Only proceed if the AM is processing a wizard class advancement.
// 	const workingItems = app.clone?.items ?? app.subject?.items ?? actor.items;
// 	const wizardClassItemWorking = workingItems?.find(
// 		(i) => i.type === "class" && i.system?.identifier === "wizard",
// 	);
// 	if (!wizardClassItemWorking) return;

// 	// Guard: only modify pools on the elkan5e version of the Wizard class.
// 	// Other wizard classes (base dnd5e, third-party) use different advancement
// 	// IDs and must not be touched.
// 	const classSource = wizardClassItemWorking.system?.source ?? {};
// 	const isElkan5eWizard =
// 		classSource.book === "Elkan 5e" ||
// 		(typeof classSource.custom === "string" && classSource.custom.includes("elkan5e"));
// 	if (!isElkan5eWizard) return;

// 	// Determine the subclass identifier: prefer a subclass being added in this AM,
// 	// fall back to the subclass that already exists on the actor.
// 	let subclassIdentifier = null;
// 	const subclassInAM = workingItems?.find(
// 		(i) => i.type === "subclass" && i.system?.classIdentifier === "wizard",
// 	);
// 	if (subclassInAM) {
// 		subclassIdentifier = subclassInAM.system?.identifier ?? null;
// 	}
// 	if (!subclassIdentifier) {
// 		const existingSubclass = actor.items?.find(
// 			(i) => i.type === "subclass" && i.system?.classIdentifier === "wizard",
// 		);
// 		if (existingSubclass) {
// 			subclassIdentifier = existingSubclass.system?.identifier ?? null;
// 		}
// 	}
// 	if (!subclassIdentifier) return; // No wizard subclass active or being added.

// 	// Mark this AM instance before any await so we never double-trigger.
// 	_wizardManagerSetup.add(app);

// 	// Load all spells for this subclass from the journal, grouped by spell level.
// 	const spellsByLevel = await getWizardSubclassSpells(subclassIdentifier);
// 	if (!Object.keys(spellsByLevel).length) {
// 		// No journal entry for this subclass -- nothing to populate.
// 		return;
// 	}

// 	// --- Layer 1: DB write on real wizard class item ---
// 	// Same technique that reliably populates Bloodrager pools at levels 6/10/14.
// 	const realWizardClassItem = actor.items?.find(
// 		(i) => i.type === "class" && i.system?.identifier === "wizard",
// 	);
// 	if (realWizardClassItem) {
// 		await populateWizardSpellPools(realWizardClassItem, spellsByLevel);
// 	}

// 	// --- Layer 2: updateSource on the AM's clone wizard class item ---
// 	// The AM works on a clone actor; the DB write above does not update the clone.
// 	if (wizardClassItemWorking) {
// 		const rawAdvs = wizardClassItemWorking.system.advancement;
// 		const cloneAdvs = foundry.utils.deepClone(
// 			typeof rawAdvs.toObject === "function"
// 				? rawAdvs.toObject()
// 				: typeof rawAdvs.map === "function"
// 					? rawAdvs.map((a) =>
// 						typeof a.toObject === "function" ? a.toObject() : foundry.utils.deepClone(a),
// 					)
// 					: Object.values(rawAdvs).map((a) =>
// 						typeof a.toObject === "function" ? a.toObject() : foundry.utils.deepClone(a),
// 					),
// 		);
// 		let changed = false;
// 		for (const { advId, spellLevel } of WIZARD_SPELL_ADV_IDS) {
// 			const spells = spellsByLevel[spellLevel];
// 			if (!spells?.length) continue;
// 			const adv = cloneAdvs.find?.((a) => a._id === advId)
// 				?? Object.values(cloneAdvs).find?.((a) => a._id === advId);
// 			if (adv) { adv.configuration.pool = spells; changed = true; }
// 		}
// 		if (changed) {
// 			wizardClassItemWorking.updateSource({ "system.advancement": cloneAdvs });
// 		}
// 	}

// 	// --- Layer 3: Direct-patch cached step advancement objects ---
// 	// The step objects hold advancement instances snapshotted at AM-init time.
// 	// Mutating their pool directly ensures ItemChoiceAdvancement.apply() validates
// 	// selections correctly even when the snapshot predates our DB/source update.
// 	const steps = app.steps ?? [];
// 	for (const step of steps) {
// 		const adv =
// 			step.advancement ??
// 			step.flow?.advancement ??
// 			step.config?.advancement;
// 		if (!adv?._id) continue;
// 		const match = WIZARD_SPELL_ADV_IDS.find((e) => e.advId === adv._id);
// 		if (!match) continue;
// 		const spells = spellsByLevel[match.spellLevel];
// 		if (!spells?.length) continue;
// 		try { if (adv.configuration) adv.configuration.pool = spells; } catch (_) {}
// 		try { if (adv._source?.configuration) adv._source.configuration.pool = spells; } catch (_) {}
// 	}

// 	// Re-render the AM so the updated pools are shown to the player.
// 	try {
// 		if (app.options?.classes?.includes?.("application-v2")) {
// 			app.render({ force: true });
// 		} else {
// 			app.render(true);
// 		}
// 	} catch (_) {
// 		// Non-fatal -- the player can navigate back/forward to refresh the current step.
// 	}
// }
/** No-op stub -- automation above is disabled. */
export async function onWizardRenderAdvancementManager(_app) { /* disabled */ }
