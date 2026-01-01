# v1.13.5
## Bug Fixes

- Well of Corruption now applies drained to all targets with safer token resolution; halves on successful saves.
- v13 update dialog spacing/line breaks cleaned to avoid stray `<br>` artifacts.
- Fixed issues casting Warlock spells.

## Classes
- Made Mounted Combat a fighting style

**[Cleric](https://www.elkan5e.com/cleric)**

- Trickery Domain
    - Added Shadow Refuge reminder on qualifying illusion spells.

**[Wizard](https://www.elkan5e.com/wizard)**

- Necromancer: 
    - Added Soul Conduit reminder for necromancy spells (level >=1).
    - Added Necromantic Surge reminder for necromancy spells (level >=3) with optional dialog prompt.

**[Ranger](https://www.elkan5e.com/ranger)**

- Spellbreaker: 
    - Reworked level 3 features into a single Magic Shackles feature that marks a target and applies half speed, siphoned, and damage effects against that target.
    - Reworked Rend Magic to break concentration, impose blind, and prevent teleportation with a 1/short rest recovery.

## Equipment

- Coinpouch containers now saved under slugged filenames instead of `_container.json`.
- New summoned-creature equipment items introduced with the summoned-creatures pack (e.g., elementals, animated objects, spirit weapons, flying carpets, mounts).
- Broad wave of SRD magical items added or refreshed across equipment packs (wands, rods, rings, staves, decks, spheres, stones, etc.), formatted and normalized for Elkan 5e; no automation added for these items.

## Game Rules

- Revised Mount Rules
- Expanded tool type mappings across SRD/legacy/Elkan modes; retagging utility (`updateToolTypes`) tidied.
- Pack extraction/cleaning now sanitizes HTML, italicizes spell references, prunes empty flags, backfills identifiers, and skips folder metadata.
- Containers are renamed on extract to slugged filenames; folder metadata retained but excluded from clean.
- Aligned the creature workflows with the summoned-creatures updates.
- Updated class spell advancements so subclass spell lists and School of Magic spell lists automatically refresh when their sources change.

## Monsters

- Added new mounts and monsters, keeping their stat blocks synchronized with the summon machinery.

## UI

- Added localized notification strings for Soul Conduit, Necromantic Surge, and Shadow Refuge reminders.
- Minor layout tidy in the v13 update dialog.

## Misc

- New actor pack: `elkan5e-summoned-creatures` with supporting items/spells/folders.
- Added `scripts/validate-packs-json.js` helper.
- Removed legacy helper scripts, logs, caches, and shell helpers.
- General JSON formatting/description cleanup to strip redundant `<br>` and noisy attributes across packs.
- Formatting/identifier cleanup to all features.
- Added name lookups to generic creature features, automated Creature Feature updates so changes cascade to every creature entry, and ensured creatures copied into the summoned-creatures pack stay synchronized with their source data.
