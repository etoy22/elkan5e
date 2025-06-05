// Reusable progress bar functions

// Create or retrieve the progress bar element
function getOrCreateProgressBar() {
  let container = document.getElementById("elkan-progress-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "elkan-progress-container";
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "6px";
    container.style.zIndex = "10000";
    container.style.backgroundColor = "#222";

    const bar = document.createElement("div");
    bar.id = "elkan-progress-bar";
    bar.style.height = "100%";
    bar.style.width = "0%";
    bar.style.backgroundColor = "red";
    bar.style.transition = "width 0.3s ease, background-color 0.3s ease";

    container.appendChild(bar);
    document.body.appendChild(container);
  }
  return {
    container,
    bar: document.getElementById("elkan-progress-bar")
  };
}

// Update progress bar fill percentage and transition color from red to green
function updateProgressBar(progress) {
  const { bar } = getOrCreateProgressBar();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  bar.style.width = `${clampedProgress * 100}%`;
  const red = Math.floor(255 * (1 - clampedProgress));
  const green = Math.floor(255 * clampedProgress);
  bar.style.backgroundColor = `rgb(${red},${green},0)`;
}

// Remove progress bar from the document
function removeProgressBar() {
  const container = document.getElementById("elkan-progress-container");
  if (container) container.remove();
}

// Process the form selections from the Elkan update dialog
function processElkanUpdateForm(html) {
  const updates = {
    actor: {
      features: html.find("#actor-features").is(":checked"),
      items: html.find("input[name='actor-items']:checked").val(),
      spells: html.find("input[name='actor-spells']:checked").val()
    },
    npc: {
      features: html.find("#npc-features").is(":checked"),
      items: html.find("input[name='npc-items']:checked").val(),
      spells: html.find("input[name='npc-spells']:checked").val()
    }
  };

  console.log("Elkan 5e Update Options:", updates);

  // Translate UI selections into specific update modes
migrateActorItems({
    players: updates.actor.items,
    npcs: updates.npc.inventory
  });

  migrateActorSpells({
    players: updates.actor.spells,
    npcs: updates.npc.spells
  });

  ui.notifications.info("Elkan 5e update process started. See console for details.");
}


// Utility: Filter actors by update mode and type
function getActorsToProcess(updateMode) {
  return game.actors.filter(actor => {
    if (actor.type === "character" && updateMode.players !== "None") return true;
    if (actor.type === "npc" && updateMode.npcs !== "None") return true;
    return false;
  });
}

// Utility: Filter documents by update mode and Elkan source if needed
function filterDocsByMode(docs, mode) {
  if (mode === "update-All") return docs;
  if (mode === "update-Elkan") {
    return docs.filter(d => d.system.source?.book === "Elkan 5e");
  }
  return [];
}

// Utility: Save relevant properties for usage transfer (customizable per item type)
function savePropertiesForTransfer(items, mode, propKeys) {
  const saved = {};
  for (let item of items) {
    if (mode === "update-Elkan" && item.system.source?.book !== "Elkan 5e") continue;
    saved[item.name] = {};
    for (const key of propKeys) {
      saved[item.name][key] = getProperty(item.system, key);
    }
    saved[item.name].img = item.img; // always save img
  }
  return saved;
}

// Utility: Restore saved properties back to new data
function restorePropertiesToData(newData, savedProps) {
  if (!savedProps) return;
  if (savedProps.img) newData.img = savedProps.img;
  for (const [key, value] of Object.entries(savedProps)) {
    if (key === "img") continue;
    setProperty(newData.system, key, value);
  }
}

// Generic migration function for actor items by type(s)
async function migrateActorByType({
  compendiums,
  types,
  updateMode,
  preserveProperties,
  filterDocByType = (docs, types) => docs.filter(d => types.includes(d.type)),
  progressLabel = "Updating items..."
}) {
  ui.notifications.notify(`Start Migration: ${progressLabel}`);

  // Load all documents from compendiums
  const docsArrays = await Promise.all(
    compendiums.map(c => c?.getDocuments() ?? [])
  );
  const allDocs = docsArrays.flat();
  const filteredDocs = filterDocByType(allDocs, types);

  const actorsToProcess = getActorsToProcess(updateMode);
  const totalActors = actorsToProcess.length;

  setProgressBarLabel(progressLabel);

  for (let i = 0; i < totalActors; i++) {
    const actor = actorsToProcess[i];
    try {
      const isPlayer = actor.type === "character";
      const mode = isPlayer ? updateMode.players : updateMode.npcs;

      // Filter documents by mode (all or Elkan only)
      const docsToUse = filterDocsByMode(filteredDocs, mode);

      const docNames = docsToUse.map(d => d.name);
      const actorItems = actor.items.filter(i => types.includes(i.type));
      const actorItemNames = actorItems.map(i => i.name);

      // Items to remove: those that exist in docsToUse by name
      const itemsToRemove = actorItems.filter(i => docNames.includes(i.name));

      // Save properties for transfer before deletion
      const savedProps = savePropertiesForTransfer(itemsToRemove, mode, preserveProperties);

      // New items to add: those docs which actor already has by name
      const newItemsToAdd = docsToUse.filter(d => actorItemNames.includes(d.name));

      // Check for missing replacements
      const missingReplacements = itemsToRemove
        .map(i => i.name)
        .filter(name => !newItemsToAdd.some(i => i.name === name));

      if (missingReplacements.length > 0) {
        console.warn(`Missing replacements for ${actor.name}: ${missingReplacements.join(", ")}`);
        continue;
      }

      // Remove old items
      await actor.deleteEmbeddedDocuments("Item", itemsToRemove.map(i => i.id));

      // Add new items with restored properties
      for (let newItem of newItemsToAdd) {
        if (mode === "update-Elkan" && newItem.system.source?.book !== "Elkan 5e") continue;

        const newData = newItem.toObject();
        restorePropertiesToData(newData, savedProps[newItem.name]);
        await actor.createEmbeddedDocuments("Item", [newData]);
      }
    } catch (err) {
      console.error(`Failed updating items for ${actor.name}`, err);
    }
    updateProgressBar((i + 1) / totalActors, i + 1, totalActors);
  }

  setTimeout(() => removeProgressBar(), 1500);
  ui.notifications.notify(`End Migration: ${progressLabel}`);
}

// Then, you can implement the specific calls like this:

async function migrateActorFeatures(updateMode = { players: "update-All", npcs: "update-Elkan" }) {
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

async function migrateActorItems(updateMode = { players: "update-All", npcs: "update-Elkan" }) {
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

async function migrateActorSpells(updateMode = { players: "update-All", npcs: "update-Elkan" }) {
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


export async function getSharedFormContent() {
  return `
    <form id="update-form">
      <div class="form-group">
        <strong>Actor Updates</strong><br>

        <label><strong>Features</strong></label><br>
        <label><input type="radio" name="actor-features" value="none" checked> None</label><br>
        <label><input type="radio" name="actor-features" value="update-All"> Elkan Features + Class and Subclass</label><br>
        <label><input type="radio" name="actor-features" value="update-Elkan"> Elkan Features</label><br>

        <label><strong>Items in Inventory</strong></label><br>
        <label><input type="radio" name="actor-items" value="none" checked> None</label><br>
        <label><input type="radio" name="actor-items" value="update-All"> Update All</label><br>
        <label><input type="radio" name="actor-items" value="update-Elkan"> Replace Only Elkan Version</label><br>

        <label><strong>Spells</strong></label><br>
        <label><input type="radio" name="actor-spells" value="none" checked> None</label><br>
        <label><input type="radio" name="actor-spells" value="update-All"> Update All</label><br>
        <label><input type="radio" name="actor-spells" value="update-Elkan"> Replace Only Elkan Version</label><br>
      </div>

      <p style="margin: 1em 0; font-style: italic; color: #a00;">
        Please note: If you have NPCs with Tokens on the board—especially if those tokens are unlinked—you may see duplicates of some abilities.
      </p>

      <div class="form-group" style="margin-top:15px;">
        <strong>NPC Updates</strong><br>

        <label><strong>Features</strong></label><br>
        <label><input type="radio" name="npc-features" value="none" checked> None</label><br>
        <label><input type="radio" name="npc-features" value="update-Elkan"> Elkan Features</label><br>

        <label><strong>Items in Inventory</strong></label><br>
        <label><input type="radio" name="npc-items" value="none" checked> None</label><br>
        <label><input type="radio" name="npc-items" value="update-All"> Update All</label><br>
        <label><input type="radio" name="npc-items" value="update-Elkan"> Replace Only Elkan Version</label><br>

        <label><strong>Spells</strong></label><br>
        <label><input type="radio" name="npc-spells" value="none" checked> None</label><br>
        <label><input type="radio" name="npc-spells" value="update-All"> Update All</label><br>
        <label><input type="radio" name="npc-spells" value="update-Elkan"> Replace Only Elkan Version</label><br>
      </div>
    </form>`;
}
