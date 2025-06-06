// Reusable progress bar functions

// Process the form selections from the Elkan update dialog
export async function processElkanUpdateForm(updates) {

  // console.log("Elkan 5e Update Options:", updates);

  // Translate UI selections into specific update modes
  migrateActorItems({
    players: updates.playerItems,
    npcs: updates.npcItems
  });

  migrateActorSpells({
    players: updates.playerSpells,
    npcs: updates.npcSpells
  });

  ui.notifications.info("Elkan 5e update process started. See console for details.");
}


// Utility: Filter actors by update mode and type
export async function getActorsToProcess(updateMode) {
  return game.actors.filter(actor => {
    if (actor.type === "character" && updateMode.players !== "none") return true;
    if (actor.type === "npc" && updateMode.npcs !== "none") return true;
    return false;
  });
}

// Utility: Filter documents by update mode and Elkan source if needed
export function filterDocsByMode(docs, mode) {
  if (!Array.isArray(docs)) {
    console.warn("filterDocsByMode received non-array docs:", docs);
    return [];
  }

  if (mode === "update-All"){
    // console.log("Updating all items, no filtering applied.");
    return docs;
  } 
  if (mode === "update-Elkan") {
    // console.log("Filtering for Elkan 5e items only.");
    return docs.filter(d => d.system.source?.book === "Elkan 5e");
  }

  // Warn if mode is unrecognized
  console.warn(`Unknown update mode "${mode}". Returning empty list.`);
  return [];
}

export async function savePropertiesForTransfer(items, mode, propKeys) {
  const saved = {};
  for (let item of items) {
    saved[item.name] = {};
    saved[item.name].sourceBook = item.system.source?.book ?? null;
    saved[item.name].img = item.img;
    for (const key of propKeys) {
      saved[item.name][key] = getProperty(item.system, key);
    }
  }
  // console.log(`Saved properties for transfer in mode '${mode}':`, saved);
  return saved;
}


export async function restorePropertiesToData(newData, savedProps, mode) {
  if (!savedProps) {
    // console.log(`No saved properties found for '${newData.name}', skipping restoration.`);
    return;
  }
  // console.log(`Restoring properties for '${newData.name}' in mode '${mode}':`, savedProps);

  // Always restore image if different
  if (savedProps.img && newData.img !== savedProps.img) {
    newData.img = savedProps.img;
  } 
  // else {
  //   console.log(`Image already matches saved image or saved image missing for '${newData.name}', skipping image restore.`);
  // }

  const originalSource = savedProps.sourceBook ?? null;

  // Determine if we should restore other properties beyond image
  let restoreOtherProps = false;

  if (mode === "update-Elkan" && originalSource === "Elkan 5e") {
    restoreOtherProps = true;
  } else if (mode === "update-All" && originalSource === "Elkan 5e") {
    restoreOtherProps = true;
  } 

  if (restoreOtherProps) {
    for (const [key, value] of Object.entries(savedProps)) {
      if (key === "img" || key === "sourceBook") continue;
      // console.log(`Restoring property '${key}' for '${newData.name}' with value:`, value);
      setProperty(newData.system, key, value);
    }
  }
}




// Generic migration function for actor items by type(s)
export async function migrateActorByType({
  compendiums,
  types,
  updateMode,
  preserveProperties,
  filterDocByType = (docs, types) => docs.filter(d => types.includes(d.type)),
  progressLabel = "Updating items..."
}) {
  ui.notifications.notify(`Start Migration: ${progressLabel}`);

  const docsArrays = await Promise.all(
    compendiums.map(c => c?.getDocuments() ?? [])
  );
  const allDocs = docsArrays.flat();
  const filteredDocs = filterDocByType(allDocs, types);

  const actorsToProcess = await getActorsToProcess(updateMode);
  const totalActors = actorsToProcess.length;

  const changeLog = {};
  const changeLogIssues = {};

  for (let i = 0; i < totalActors; i++) {
    const actor = actorsToProcess[i];

    changeLog[actor.name] = {
      replaced: [],
      removed: [],
      added: [],
      skipped: [],
      missingReplacements: [],
      error: null
    };

    try {
      const isPlayer = actor.type === "character";
      const mode = isPlayer ? updateMode.players : updateMode.npcs;

      const docsToUse = filterDocsByMode(filteredDocs, mode);
      const docNames = docsToUse.map(d => d.name);

      const actorItems = actor.items.filter(i => types.includes(i.type));
      const actorItemNames = actorItems.map(i => i.name);

      const itemsToRemove = actorItems.filter(i => {
        const nameMatch = docNames.includes(i.name);
        const isElkan = i.system?.source?.book === "Elkan 5e";
        return nameMatch && (mode === "update-All" || (mode === "update-Elkan" && isElkan));
      });

      const savedProps = await savePropertiesForTransfer(itemsToRemove, mode, preserveProperties);
      const newItemsToAdd = docsToUse.filter(d => actorItemNames.includes(d.name));

      const missingReplacements = itemsToRemove
        .map(i => i.name)
        .filter(name => !newItemsToAdd.some(d => d.name === name));

      if (missingReplacements.length > 0) {
        changeLog[actor.name].missingReplacements = missingReplacements;
        console.warn(`Missing replacements for ${actor.name}: ${missingReplacements.join(", ")}`);
        continue;
      }

      await actor.deleteEmbeddedDocuments("Item", itemsToRemove.map(i => i.id));

      const added = [];
      for (let newItem of newItemsToAdd) {
        if (mode === "update-Elkan" && newItem.system.source?.book !== "Elkan 5e") {
          changeLog[actor.name].skipped.push(newItem.name);
          continue;
        }

        const newData = newItem.toObject();
        await restorePropertiesToData(newData, savedProps[newItem.name], mode);
        await actor.createEmbeddedDocuments("Item", [newData]);
        added.push(newItem.name);
      }

      const removedNames = itemsToRemove.map(i => i.name);
      const replaced = [];

      for (let name of added) {
        if (removedNames.includes(name)) {
          replaced.push(name);
        } else {
          changeLog[actor.name].added.push(name);
        }
      }

      for (let name of removedNames) {
        if (!replaced.includes(name)) {
          changeLog[actor.name].removed.push(name);
        }
      }

      changeLog[actor.name].replaced = replaced;

    } catch (err) {
      console.error(`Failed updating items for ${actor.name}`, err);
      changeLog[actor.name].error = err.message ?? err;
    }
  }

  // Populate changeLogIssues with entries that have any issues (non-replaced changes or errors)
  for (const [actorName, entry] of Object.entries(changeLog)) {
    const hasIssues =
      entry.removed.length > 0 ||
      entry.added.length > 0 ||
      entry.skipped.length > 0 ||
      entry.missingReplacements.length > 0 ||
      entry.error !== null;

    if (hasIssues) {
      changeLogIssues[actorName] = entry;
    }
  }

  ui.notifications.notify(`End Migration: ${progressLabel}`);
  console.log(`Migration ChangeLog for ${progressLabel}:`, changeLog);
  console.log(`Migration ChangeLog Issues for ${progressLabel}:`, changeLogIssues);
}



// Then, you can implement the specific calls like this:

export async function migrateActorFeatures(updateMode = { players: "update-All", npcs: "none" }) {
  if (updateMode.players === "none" && updateMode.npcs === "none") {
    return;
  }
  const compFeatures = game.packs.get("elkan5e.elkan5e-class-features");
  const compClasses = game.packs.get("elkan5e.elkan5e-class");
  const compSubclasses = game.packs.get("elkan5e.elkan5e-subclass");
  if (!compFeatures || !compClasses || !compSubclasses) {
    console.error("Required compendiums missing for features/classes/subclasses");
    return;
  }
  await migrateActorByType({
    compendiums: [compFeatures, compClasses, compSubclasses],
    types: ["feat", "class", "subclass"],
    updateMode,
    preserveProperties: [
      "uses", "recharge", "activation", "consume", "save", "duration", "target"
    ],
    progressLabel: "Features, Classes, and Subclasses"
  });
}

export async function migrateActorItems(updateMode = { players: "update-All", npcs: "update-Elkan" }) {
  if (updateMode.players === "none" && updateMode.npcs === "none") {
    return;
  }
  const compMagic = game.packs.get("elkan5e.elkan5e-magic-items");
  const compEquip = game.packs.get("elkan5e.elkan5e-equipment");
  if (!compMagic || !compEquip) {
    console.error("Required compendiums missing for magic items/equipment");
    return;
  }

  await migrateActorByType({
    compendiums: [compMagic, compEquip],
    types: ["consumable","container","equipment","loot","tool","weapon"],
    updateMode,
    preserveProperties: ["quantity", "attunement", "equipped", "uses.max", "uses.spent", "uses.recovery", "activities"],
    progressLabel: "Items"
  });
}

export async function migrateActorSpells(updateMode = { players: "update-All", npcs: "update-Elkan" }) {
  if (updateMode.players === "none" && updateMode.npcs === "none") {
    return;
  }
  const compFeatures = game.packs.get("elkan5e.elkan5e-class-features");
  const compSpells = game.packs.get("elkan5e.elkan5e-spells");
  if (!compFeatures || !compSpells) {
    console.error("Compendium missing for class feaetures and spells");
    return;
  }

  await migrateActorByType({
    compendiums: [compFeatures, compSpells],
    types: ["spell"],
    updateMode,
    preserveProperties: ["uses.max", "uses.spent", "uses.recovery", "preparation", "activities"],
    progressLabel: "Spells",
    filterDocByType: (docs, types) => docs.filter(d => types.includes(d.type))
  });
}
