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
	// fallback: slugify the name (lowercase, spaces -> dash)
	return item.name.toLowerCase().replace(/\s+/g, "-");
}

export async function savePropertiesForTransfer(items, mode, propKeys) {
	const saved = {};
	for (let item of items) {
		const id = getItemIdentifier(item);
		saved[id] = {
			sourceBook: item.system.source?.book ?? null,
			img: item.img,
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

function getKeyByValue(obj, value) {
	for (const key in obj) {
		if (obj[key].name === value) { // Check if the 'name' matches
			return key;  // Return the key if a match is found
		}
	}
	return null;  // Return null if no match is found
}

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

		const actorItems = actor.items.filter((i) => types.includes(i.type));
		const itemsToRemove = [];
		const itemsToAdd = [];

		// Determine which items to remove and re-add
		for (const actorItem of actorItems) {
			const actorId = getItemIdentifier(actorItem);
			const matchedDocs = docIdMap.get(actorId) ?? [];

			if (matchedDocs.length === 1) {
				const matchedDoc = matchedDocs[0];
				if (mode === "update-Elkan" && matchedDoc.system?.source?.book !== "Elkan 5e")
					continue;
				itemsToRemove.push(actorItem);
				itemsToAdd.push(matchedDoc);
			} else if (matchedDocs.length > 1) {
				if (docNameMap.has(actorItem.name)) {
					const docByName = docNameMap.get(actorItem.name);
					if (mode === "update-Elkan" && docByName.system?.source?.book !== "Elkan 5e")
						continue;
					itemsToRemove.push(actorItem);
					itemsToAdd.push(docByName);
				} else {
					console.warn(
						`Ambiguous identifier '${actorId}' and no name match for actor item '${actorItem.name}', skipping update.`,
					);
					continue;
				}
			} else if (docNameMap.has(actorItem.name)) {
				const docByName = docNameMap.get(actorItem.name);
				if (mode === "update-Elkan" && docByName.system?.source?.book !== "Elkan 5e")
					continue;
				itemsToRemove.push(actorItem);
				itemsToAdd.push(docByName);
			}
		}

		// Save custom properties, then delete old items
		const savedProps = await savePropertiesForTransfer(itemsToRemove, mode, preserveProperties);
		await actor.deleteEmbeddedDocuments(
			"Item",
			itemsToRemove.map((i) => i.id),
		);

		// Re-create each new item
		for (const newItem of itemsToAdd) {
			const newData = structuredClone(newItem.toObject());
			const id = getItemIdentifier(newItem);
			const oldItem = itemsToRemove.find((i) => getItemIdentifier(i) === id);

			console.log(oldItem
					? `Updating item: ${oldItem.name}`
					: `Creating new item: ${newData.name} (${id})`,
			);

			await restorePropertiesToData(newData, savedProps[id], mode, preserveProperties);

			// === Custom 'uses' preservation ===
			if (preserveProperties.includes("uses") && oldItem) {
				const oldActivities = foundry.utils.deepClone(oldItem.system?.activities ?? {});
				const newActivities = newData.system?.activities ?? {};
				// Check if the number of activities is the same
				if (oldActivities.size === Object.keys(newActivities).length) {
					// Check if the names of the activities are the same
					const oldActivityNames = [];
					oldActivities.forEach((activity) => {
						oldActivityNames.push(activity.name);
					});

					const newActivityNames = Object.keys(newActivities).map(key => newActivities[key].name);;

					let activityNamesMatch = true

					for (let i = 0; i < oldActivityNames.length; i++) {
						if (oldActivityNames[i] !== newActivityNames[i] && newActivityNames[i] !== "") {
							activityNamesMatch = false; // Mismatch found
							break; // Stop as soon as a mismatch is found
						}
					}

					if (activityNamesMatch) {
						let newKeys = [];

						// Iterate over the keys of newActivities (assuming it's a plain object)
						Object.keys(newActivities).forEach((key) => {
							const activity = newActivities[key];

							// Find the key by matching activity names
							const newKey = getKeyByValue(newActivities, activity.name);
							newKeys.push(newKey);
						});


						// Now, you can iterate through old and new activities to copy the consumption
						for (let i = 0; i < oldActivityNames.length; i++) {
							// Get the old activity by name from the old Activities Collection

							// Get the corresponding new activity using the new key
							const newKey = newKeys[i];
							const oldActivity = oldActivities.get(newKey);
							const newActivity = newActivities[newKey];

							// If both activities exist, copy the consumption data
							if (oldActivity && newActivity) {
								// New Activity: {"targets":[],"scaling":{"allowed":false,"max":""},"spellSlot":true}
								let same =
									(oldActivity.consumption.targets.length === newActivity.consumption.targets.length) &&
									(oldActivity.consumption.scaling.allowed === newActivity.consumption.scaling.allowed) &&
									(oldActivity.consumption.scaling.max === newActivity.consumption.scaling.max) &&
									(oldActivity.consumption.spellSlot === newActivity.consumption.spellSlot);


								if (!same) {
									newActivity.consumption = { ...oldActivity.consumption };
								}
							}
						}
					}

				}

			}

			const createdItems = await actor.createEmbeddedDocuments("Item", [newData]);
			if (preserveProperties.includes("name") && savedProps[id]?.name) {
				await createdItems[0].update({ name: savedProps[id].name });
			}
		}

		// Update progress
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
