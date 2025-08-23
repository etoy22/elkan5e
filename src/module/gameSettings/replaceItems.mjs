/* global game, foundry, ui */
const { getProperty, setProperty } = foundry.utils;

// Process the form selections from the Elkan update dialog
export async function processElkanUpdateForm(updates) {
	migrateActorItems({
		players: updates.actorItems,
		npcs: updates.npcItems,
	});

	migrateActorSpells({
		players: updates.actorSpells,
		npcs: updates.npcSpells,
	});

	migrateActorFeatures({
		players: updates.actorFeatures,
		npcs: updates.npcFeatures,
	});

	ui.notifications.info("Elkan 5e update process started. See console for details.");
}

class MigrationProgress {
	constructor(typeKey) {
		this.key = typeKey;
		this.total = 0;
		this.current = 0;
		this.progressBar = null;
	}

	init(total) {
		this.total = total;
		this.current = 0;

		const content = document.createElement("div");
		content.classList.add("elkan-migration-progress");
		content.style.padding = "8px 12px";
		content.style.borderRadius = "5px";
		content.style.color = "black";
		content.style.backgroundColor = "rgba(255, 60, 60, 0.85)"; // strong red, less transparent
		content.style.border = "1px solid rgba(0, 0, 0, 0.1)";
		content.style.fontWeight = "bold";
		content.style.marginTop = "6px";

		const startMessage = game.i18n.format("elkan5e.migration.start", {
			type: this.key,
		});
		content.textContent = startMessage;

		const notifContainer = document.getElementById("notifications");
		if (notifContainer) {
			notifContainer.appendChild(content);
			this.progressBar = content;
		} else {
			console.warn("MigrationProgress: #notifications container not found.");
			this.progressBar = null;
		}
	}

	tick(actorType, currentChar, totalChar, currentNPC, totalNPC) {
		this.current++;
		const percent = Math.round((this.current / this.total) * 100);

		const hue = Math.round((percent / 100) * 120);
		// Lighter background with moderate opacity, transitioning red -> green
		const bgColor = `rgba(${255 - hue * 2}, ${hue * 2 + 50}, 50, 0.85)`;

		const details = `${game.i18n.format("elkan5e.migration.details.characters", {
			current: currentChar,
			total: totalChar,
		})}, ${game.i18n.format("elkan5e.migration.details.npcs", {
			current: currentNPC,
			total: totalNPC,
		})}`;

		const label = game.i18n.format("elkan5e.migration.label", {
			percent,
			details,
		});

		if (this.progressBar) {
			this.progressBar.style.backgroundColor = bgColor;
			this.progressBar.textContent = label;
		}
	}

	done() {
		if (this.progressBar) {
			this.progressBar.style.backgroundColor = "rgba(40, 180, 40, 0.85)"; // less transparent green
			this.progressBar.textContent = game.i18n.format("elkan5e.migration.end", {
				type: this.key,
			});
			setTimeout(() => this.progressBar.remove(), 4000);
		}
	}
}

export async function getActorsToProcess(updateMode) {
	return game.actors.filter((actor) => {
		if (actor.type === "character" && updateMode.players !== "none") return true;
		if (actor.type === "npc" && updateMode.npcs !== "none") return true;
		return false;
	});
}

export function filterDocsByMode(docs, mode) {
	if (mode === "update-All") return docs;
	if (mode === "update-Elkan") return docs.filter((d) => d.system.source?.book === "Elkan 5e");
	return [];
}

// Helper to get the identifier for an item or doc
function getItemIdentifier(item) {
	const id = item.system?.identifier;
	if (id && id.trim().length > 0) return id.trim();

	// If no identifier exists, generate one and save it so it persists
	const generated = item.name.toLowerCase().replace(/\s+/g, "-");
	if (item.system) item.system.identifier = generated;
	return generated;
}

export async function savePropertiesForTransfer(items, mode, propKeys) {
	const saved = {};
	for (let item of items) {
		const id = getItemIdentifier(item);
		saved[id] = {
			sourceBook: item.system.source?.book ?? null,
			img: item.img,
			identifier: item.system?.identifier ?? id,
		};
		for (const key of propKeys) {
			if (key === "name") {
				saved[id][key] = item.name;
			} else {
				saved[id][key] = getProperty(item.system, key);
			}
		}
	}
	return saved;
}

export async function restorePropertiesToData(newData, savedProps, mode, preserveProperties = []) {
	if (!savedProps) return;

	newData.img = savedProps.img ?? newData.img;
	newData.system.identifier = savedProps.identifier ?? newData.system?.identifier;
	const originalSource = savedProps.sourceBook ?? null;

	if (
		(mode === "update-Elkan" && originalSource === "Elkan 5e") ||
		(mode === "update-All" && originalSource === "Elkan 5e")
	) {
		for (const key of preserveProperties) {
			if (key !== "img" && key !== "sourceBook" && key in savedProps) {
				if (
					savedProps[key] === undefined ||
					savedProps[key] === null ||
					savedProps[key] === ""
				)
					continue;

				if (key === "name") {
					newData.name = savedProps.name;
				} else {
					setProperty(newData.system, key, savedProps[key]);
				}
			}
		}
	}
}

/* global foundry, game, ui */

// ---------- helpers used by migrateActorByType ----------

function getKeyByValue(obj, value) {
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key]?.name === value) {
			return key;
		}
	}
	return null;
}

/**
 * Deep compare that ignores _stats and ownership everywhere.
 * NOTE: DOES NOT ignore identifier — differences in system.identifier will count.
 */
function deepEqualIgnoringMeta(a, b) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;

	if (a === null || b === null) return a === b;

	// Arrays
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (!deepEqualIgnoringMeta(a[i], b[i])) return false;
		}
		return true;
	}

	// Objects
	if (typeof a === "object" && typeof b === "object") {
		const aKeys = Object.keys(a).filter((k) => k !== "_stats" && k !== "ownership");
		const bKeys = Object.keys(b).filter((k) => k !== "_stats" && k !== "ownership");

		if (aKeys.length !== bKeys.length) return false;
		for (const key of aKeys) {
			if (!bKeys.includes(key)) return false;
			if (!deepEqualIgnoringMeta(a[key], b[key])) return false;
		}
		return true;
	}

	// Primitives
	return a === b;
}

function itemsAreFullyIdentical(oldItem, newItem) {
	return deepEqualIgnoringMeta(oldItem.toObject(), newItem.toObject());
}

// ---------- main migration ----------

export async function migrateActorByType({
	compendiums,
	types,
	updateMode,
	preserveProperties,
	filterDocByType = (docs, types) => docs.filter((d) => types.includes(d.type)),
	progressLabel = "Migration",
}) {
	const docsArrays = await Promise.all(compendiums.map((c) => c?.getDocuments() ?? []));
	const allDocs = docsArrays.flat();
	const filteredDocs = filterDocByType(allDocs, types);
	const actors = await getActorsToProcess(updateMode);

	const progress = new MigrationProgress(progressLabel);
	progress.init(actors.length);

	let currentChar = 0;
	let currentNPC = 0;

	// reporting
	const reportByActor = new Map(); // actorId -> { name, type, updated:[], created:[], skipped:[] }
	const totals = {
		updated: 0,
		created: 0,
		skipped: 0,
		actors: actors.length,
		characters: 0,
		npcs: 0,
	};

	const docNameMap = new Map(filteredDocs.map((d) => [d.name, d]));
	const docIdMap = new Map();
	for (const d of filteredDocs) {
		const id = getItemIdentifier(d);
		if (!docIdMap.has(id)) docIdMap.set(id, []);
		docIdMap.get(id).push(d);
	}

	for (const actor of actors) {
		const isChar = actor.type === "character";
		const mode = isChar ? updateMode.players : updateMode.npcs;
		if (mode === "none") continue;

		if (isChar) totals.characters++;
		else totals.npcs++;
		reportByActor.set(actor.id, {
			name: actor.name,
			type: actor.type,
			updated: [],
			created: [],
			skipped: [],
		});

		const actorItems = actor.items.filter((i) => types.includes(i.type));
		const itemsToRemove = [];
		const itemsToAdd = [];

		for (const actorItem of actorItems) {
			const actorId = getItemIdentifier(actorItem);
			const matchedDocs = docIdMap.get(actorId) ?? [];

			if (matchedDocs.length === 1) {
				const matchedDoc = matchedDocs[0];
				if (mode === "update-Elkan" && matchedDoc.system?.source?.book !== "Elkan 5e")
					continue;

				if (itemsAreFullyIdentical(actorItem, matchedDoc)) {
					reportByActor
						.get(actor.id)
						.skipped.push({ item: actorItem.name, reason: "Item is identical" });
					totals.skipped++;
					continue;
				}

				itemsToRemove.push(actorItem);
				itemsToAdd.push(matchedDoc);
			} else if (matchedDocs.length > 1) {
				if (docNameMap.has(actorItem.name)) {
					const docByName = docNameMap.get(actorItem.name);
					if (mode === "update-Elkan" && docByName.system?.source?.book !== "Elkan 5e")
						continue;

					if (itemsAreFullyIdentical(actorItem, docByName)) {
						reportByActor
							.get(actor.id)
							.skipped.push({ item: actorItem.name, reason: "Item is identical" });
						totals.skipped++;
						continue;
					}

					itemsToRemove.push(actorItem);
					itemsToAdd.push(docByName);
				} else {
					reportByActor.get(actor.id).skipped.push({
						item: actorItem.name,
						reason: `Ambiguous identifier '${actorId}' and no name match`,
					});
					totals.skipped++;
					continue;
				}
			} else {
				// no identifier matches at all
				if (docNameMap.has(actorItem.name)) {
					const docByName = docNameMap.get(actorItem.name);
					if (mode === "update-Elkan" && docByName.system?.source?.book !== "Elkan 5e")
						continue;

					if (itemsAreFullyIdentical(actorItem, docByName)) {
						reportByActor
							.get(actor.id)
							.skipped.push({ item: actorItem.name, reason: "Item is identical" });
						totals.skipped++;
						continue;
					}

					itemsToRemove.push(actorItem);
					itemsToAdd.push(docByName);
				} else {
					reportByActor.get(actor.id).skipped.push({
						item: actorItem.name,
						reason: `No matching doc by id '${actorId}' or name`,
					});
					totals.skipped++;
					continue;
				}
			}
		}

		// Save custom properties, then delete old items
		const savedProps = await savePropertiesForTransfer(itemsToRemove, mode, preserveProperties);
		if (itemsToRemove.length) {
			await actor.deleteEmbeddedDocuments(
				"Item",
				itemsToRemove.map((i) => i.id),
			);
		}

		// Re-create each new item
		for (const newItem of itemsToAdd) {
			const newData = structuredClone(newItem.toObject());
			const id = getItemIdentifier(newItem);
			const oldItem = itemsToRemove.find((i) => getItemIdentifier(i) === id);

			await restorePropertiesToData(newData, savedProps[id], mode, preserveProperties);

			// === Custom 'uses' preservation ===
			if (preserveProperties?.includes?.("uses") && oldItem) {
				const oldActivities = foundry.utils.deepClone(oldItem.system?.activities ?? {});
				const newActivities = newData.system?.activities ?? {};

				if (oldActivities.size === Object.keys(newActivities).length) {
					const oldActivityNames = [];
					oldActivities.forEach((activity) => oldActivityNames.push(activity.name));

					const newActivityNames = Object.keys(newActivities).map(
						(key) => newActivities[key].name,
					);
					let activityNamesMatch = true;
					for (let i = 0; i < oldActivityNames.length; i++) {
						if (
							oldActivityNames[i] !== newActivityNames[i] &&
							newActivityNames[i] !== ""
						) {
							activityNamesMatch = false;
							break;
						}
					}

					if (activityNamesMatch) {
						const newKeys = Object.keys(newActivities).map((key) =>
							getKeyByValue(newActivities, newActivities[key].name),
						);
						for (let i = 0; i < oldActivityNames.length; i++) {
							const newKey = newKeys[i];
							const oldActivity = oldActivities.get(newKey);
							const newActivity = newActivities[newKey];
							if (oldActivity && newActivity) {
								// Check if consumption is the same
								const consumptionIsSame =
									JSON.stringify(oldActivity.consumption) ===
									JSON.stringify(newActivity.consumption);
								if (!consumptionIsSame) {
									newActivity.consumption = { ...oldActivity.consumption };
								}
							}
						}
					}
				}
			}

			const createdItems = await actor.createEmbeddedDocuments("Item", [newData]);
			// Set _stats.compendiumSource after creation to avoid DataModelValidationError
			if (newItem.pack && newItem.id) {
				await createdItems[0].update({
					_stats: {
						...createdItems[0]._stats,
						compendiumSource: `Compendium.${newItem.pack}.Item.${newItem.id}`,
					},
				});
			}

			// Optional: preserve original name
			let namePreserved = false;
			if (preserveProperties?.includes?.("name") && savedProps[id]?.name) {
				await createdItems[0].update({ name: savedProps[id].name });
				namePreserved = true;
			}

			// Post-creation: force a refresh/update for the item
			if (createdItems[0]) {
				if (typeof createdItems[0].refresh === "function") {
					createdItems[0].refresh();
				} else {
					// Fallback: trigger a dummy update to force Foundry to re-link resources
					await createdItems[0].update({});
				}
			}

			// report
			if (oldItem) {
				reportByActor.get(actor.id).updated.push({
					from: oldItem.name,
					to: namePreserved ? savedProps[id].name : newData.name,
					id,
					namePreserved,
				});
				totals.updated++;
			} else {
				reportByActor.get(actor.id).created.push({
					name: namePreserved ? savedProps[id].name : newData.name,
					id,
					namePreserved,
				});
				totals.created++;
			}
		}

		// progress tick
		if (actor.type === "character") currentChar++;
		else currentNPC++;
		progress.tick(
			actor.type,
			currentChar,
			actors.filter((a) => a.type === "character").length,
			currentNPC,
			actors.filter((a) => a.type === "npc").length,
		);
	}

	progress.done();

	// ---- single consolidated summary ----
	console.groupCollapsed(`[${progressLabel}] Elkan 5e Migration Summary`);
	console.info(
		`Actors processed: ${totals.actors} (characters: ${totals.characters}, npcs: ${totals.npcs})`,
	);
	console.info(
		`Items updated: ${totals.updated} | created: ${totals.created} | skipped: ${totals.skipped}`,
	);

	for (const [, rpt] of reportByActor.entries()) {
		const header = `${rpt.name} [${rpt.type}] — updated: ${rpt.updated.length}, created: ${rpt.created.length}, skipped: ${rpt.skipped.length}`;
		console.groupCollapsed(header);

		if (rpt.updated.length) {
			console.groupCollapsed("Updated");
			rpt.updated.forEach((u) => {
				console.log(
					`• ${u.from} → ${u.to}${u.namePreserved ? " (name preserved)" : ""} [id:${u.id}]`,
				);
			});
			console.groupEnd();
		}
		if (rpt.created.length) {
			console.groupCollapsed("Created");
			rpt.created.forEach((c) => {
				console.log(
					`• ${c.name}${c.namePreserved ? " (name preserved)" : ""} [id:${c.id}]`,
				);
			});
			console.groupEnd();
		}
		if (rpt.skipped.length) {
			console.groupCollapsed("Skipped");
			rpt.skipped.forEach((s) => console.warn(`• ${s.item}: ${s.reason}`));
			console.groupEnd();
		}

		console.groupEnd();
	}
	console.groupEnd();

	ui.notifications.info(
		`${progressLabel} finished — Actors: ${totals.actors}, Updated: ${totals.updated}, Created: ${totals.created}, Skipped: ${totals.skipped}. See console for details.`,
	);
}

export async function migrateActorSpells(
	updateMode = { players: "update-Elkan", npcs: "update-Elkan" },
) {
	if (updateMode.players === "none" && updateMode.npcs === "none") return;
	const compFeatures = game.packs.get("elkan5e.elkan5e-class-features");
	const compSpells = game.packs.get("elkan5e.elkan5e-spells");
	if (!compFeatures || !compSpells) return;

	await migrateActorByType({
		compendiums: [compFeatures, compSpells],
		types: ["spell"],
		updateMode,
		preserveProperties: ["name", "uses", "preparation"],
		progressLabel: "Spells",
	});
}

export async function migrateActorItems(
	updateMode = { players: "update-All", npcs: "update-Elkan" },
) {
	if (updateMode.players === "none" && updateMode.npcs === "none") return;
	const compMagic = game.packs.get("elkan5e.elkan5e-magic-items");
	const compEquip = game.packs.get("elkan5e.elkan5e-equipment");
	if (!compMagic || !compEquip) return;

	await migrateActorByType({
		compendiums: [compMagic, compEquip],
		types: ["consumable", "equipment", "loot", "tool", "weapon"],
		updateMode,
		preserveProperties: ["name", "quantity", "attunement", "equipped"],
		progressLabel: "Items",
	});
}

export async function migrateActorFeatures(updateMode = { players: "update-Elkan", npcs: "none" }) {
	if (updateMode.players === "none" && updateMode.npcs === "none") return;
	const compFeatures = game.packs.get("elkan5e.elkan5e-class-features");
	if (!compFeatures) return;

	await migrateActorByType({
		compendiums: [compFeatures],
		types: ["feat"],
		updateMode,
		preserveProperties: ["name"],
		progressLabel: "Features",
	});
}
