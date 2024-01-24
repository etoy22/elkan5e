# Changelog

## v1.11.0
- Changing style 
  - Module version of module numbers where vX.Y.Z
    - X is the Elkan 5e version
      - Most likely not to change
    - Y is the foundry version
    - Z is the version number in the Foundry version
  - Updating module manifest and download going forward with that specific version module
    - The idea is that people can easily download older versions
- Foundry
  - Fixes
    - Improved Feral Instinct has the proper image
    - Empty Body active feature properly named
    - Lucky Feature Automation
  - Updates
    - Fey Ancestry charmed condition is now tied to the journal
    - Clean up Extra Attacks
    - Echolocation now has ATL vision attached
    - Changes to spells School of Magic has been updated on the spells
  - References
    - Restore Familiar now has the correct reference
- Code Updates
    - Bardic Inspiration Class Features now consume uses of a meta-resource and are now automatically linked to do this properly
    - Fixed spelling in Chanelog

## v1.2.10
- Foundry
  - Deflect Missiles [Throw Back] Added 
  - Patient Defense now gives active effect
  - Removed redundant text explaining how to automate features
  - Fixed broken updates
## v1.2.9
- Foundry Updates
  - Addition/Changes
    - Berserker subclass is now on Foundry (https://www.elkan5e.com/barbarian)
    - Fireball radius has been reduced to 15 feet
  - Updates
    - Barbarian (https://www.elkan5e.com/barbarian)
      - Level 17 is now just Focused Slaughter
      - Focused Slaughter is now automated
      - Stubborn Will now gives proficiency in wisdom saving throws (Whether raged or not)
      - Level 13 has a new feature called Mindless Rage
    - Shifter
      - Durable Form has been made passive with its ability affecting Wild Shapeshifting Directly
    - Feats
      - Supreme Might is now a feat
    - Journals 
      - Weapon Rules Page
      - Class Notes Fighting Style Updated
    - Updated some creatures in Elkan 5e Creatures
      - Gave them the updated weapons
      - Updated some attacks
      - Elkan 5e Notes 
    - Evasion Automated
    - Renamed Dueling to Single Weapon Fighting to better reflect what our version does
    - Rangers Feral Instinct name has been changed to Blindsight
  - Fixing
    - Ancestry Features are now labeled as such
    - Draconic Toughness is now being properly applied
    - Unarmored movement has been fixed and renamed
    - Removed redundant Evasions
  - Sorting
    - Changed permission levels of Compendiums
    - Put Elkan Compendiums into Folders
    - Sorted the Elkan 5e Rules compendium
- Code Updates
  - Foundry Class Features that consume uses of a meta-resource are now automatically linked to do this properly

## v1.2.8
- Foundry Updates
  - Dragon Origin added Sorcerer Subclass (https://www.elkan5e.com/sorcerer)
  - Improved Blasting Noise (College of Noise) provides temporary immunity to muted condition
  - Fixed Cold Iron bypass not working 
  - Moved some of the changing of name hooks here instead
  - Changed all cases of Race appearing and changed it with Ancestry
  - Changed Thunder Damage to Sonic Damage
- Code Updates
  - Added Changelog
  - Updated old releases with what we did in them to the best that I could find
  - Updated module.json
    - Added lang/en.json
    - Description of what Elkan 5e is
    - Updated with all possible information
  - Removed code that didn't do anything 
  - Added Code to make sure that the Elkan Module was initializing in Foundry
  - Added Comments to code for readability
  - Changed js files to mjs
  - Cleaned up Github tags so there are no more 1.1.2-Fixed

## v1.2.7
- Added Missing Conditions (Muted and Dazed)
- Fixed Merge Error that occurred
- Renamed file paths
- Characters can now select spells on level-up
- Fixed warlock spell slot progression
- Automation for the Confusion condition and spell
- Automated Harrying Blow
- Fixed deadlinks in class progression charts 
- Added Animate Dead, Arms of Earth, and Burning Beam spells
- Bardic Inspiration split into two features (mechanically equivalent)
- Druid subclasses start at level 1 for the sake of their expanded spell list
- Monks now have a d10 hit die
- Monk Stunning Strike progression unlinked from proficiency bonus
- Monk Perfect Self now bonus action
- Paladin class progression changed to gain subclass features on 3/6/10/14/20 (but still compatible with old subclasses)
- Paladin's Divine Sense is now a bonus action and 3/long rest
- Paladin Channel Divinity renamed to Channel Conviction, each 1/short rest, gain one option at level 3, the other at level 10
- Paladin: reworked Cleansing Touch as an extension of Lay on Hands, including moving some of the functions of Lay on Hands to Cleansing Touch
- Rangers now have the same number of spells as paladins
- Rogue reverted to always getting Thieves' Tools
- Expertise should no longer reference tools
- Added small shields to starting equipment options for bards, rogues, and warlocks

## v1.2.6
- Added New Relationships with Modules
- Added New Condition Types 
- Paladin Update
- Added Elkan Settings to Foundry 
  - Armor
  - Conditions
  - Features (Renaming Race Feature to Ancestry Feature)
  - Languages
  - Tools
  - Weapons

## v1.2.5
### January 8, 2024
- Backgrounds now give the correct number of skills in all cases.
- Superior Armor Training from the Forge-Bound background and the spells Longstrider and Static Charge now apply the correct automated effect.
- Fixed automated paladin aura scaling to 30 ft.
- Monks now properly gain proficiency in scimitars.
- Wizards no longer gain all 'magical' languages by mistake
- Fixed Mystic Trickster spellcasting being listed as an action.
- Cleaned up redundant Extra Attack features. 
### December 18, 2023
- A lot of minor formatting
- Fighters now get one combat maneuver at levels 2, 7, and 15 instead of two.
- Updated Fireball and Shield spells
- Tieflings now count as Fiends, and Aasimar count as celestials
- Backgrounds now grant a few items based on the proficiencies they grant 
- Added combat maneuver feats and integration with fighters
- Classes and backgrounds now automatically grant items
- Added all weapon descriptions
- Added Changeling ancestry
- Updated descriptions for tools
- Added source URLs to all Foundry features etc.
### December 4, 2023
- Rebalanced weapons
   - Darts now have a range of 30/90 instead of 20/60
   - Greatclubs now deal 1d10 damage instead of 1d8
   - Quarterstaffs are now two-handed weapons with a reach of 10 ft. that deal 1d8 damage, instead of versatile 1d6/1d8 weapons
   - Spears now have a reach of 10 ft. when used as melee weapons
   - Halberds can now deal either piercing or slashing damage (user's choice)
   - Morningstars are now versatile 1d8/1d10 weapons instead of just 1d8 
   - The flail, trident, and war pick were removed for reasons we outline at the bottom of https://www.elkan5e.com/weapons
- Ancestry and Background features were updated to our new formatting (with no changes to their function)
- Added descriptions to each class page, describing what the class is like.
- The Ranger's natural explorer feature is simplified
- Rage now functions in heavy armor
- Re-sorted Ancestries and Backgrounds to be in one compendium folder, while their respective features share a different folder.
  - Ancestries and Backgrounds are in Elkan 5e Ancestries/Backgrounds
  - Ancestries and Backgrounds Feature went to Elkan 5e Ancestries/Backgrounds Features
- Fixed the Laborer background giving all vehicle proficiencies.
- Removed the placeholders for the Artificer and Psion classes, which are in development, from the live version of the module.
### November 27, 2023
- Added the Life Domain for clerics: https://www.elkan5e.com/cleric
- Added the Evoker Tradition for wizards: https://www.elkan5e.com/wizard
- Added an expanded spell list for the Circle of the Shifter druids.
- Streamlined the proficiencies granted by backgrounds.
- An extra tool option for rogues and druids was added.
- Diamond Soul no longer applies to death-saving throws.
- Druid class is now fully automated.
- Updated ancestries to function with the new update. Now, you can drag-drop ancestries, and they will add their benefits to your characters.
- Ancestries, Backgrounds, Classes, and Subclasses will automatically grant or allow you to choose skills, tools, and other proficiencies.
- Default class proficiencies and features that previously granted vision types, speeds, damage resistances, etc., will now be much less cluttered and no longer take up space as passive features in your list.
- Updated all class descriptions and progression charts to have current information.
- Added a table to show spellcasting progression for Mystic Trickster and Spellsword.
- Automated Signature Spell choices for high-level wizards.
### November 20, 2023
- Updated the Character Creation Guide, including ability score generation methods (Elkan 5e standard array, point buy, and rolling for stats)
- The Distant Spell and Extended Spell metamagics were improved.
- Eldritch Blast no longer counts as a spell at all, which allowed us to adjust some features to allow better integration with warlock spellcasting.
- Mystic Tricksters and Spellswords can now choose Warlock as their spellcasting class.
- Fixed Fiend Patron expanded spell list
- Fixed Dragonborn breath weapons to correctly list '1/long rest'
### November 13, 2023
- Added the Circle of the Shifter druid subclass.
- Added 7 Elkan-exclusive spells.
- Spells that require a visible target now say 'visible creature' or somesuch in the target field at the top of spell descriptions.
- Martial Command now targets a single ally and allows them to move up to their speed.
- Silence no longer counts as a ritual spell.
- The 'Spells by Class' journal entry contains links to each description.
- Aasimar and Tiefling's ancestries are now properly complete.
- Added the Bulwark fighter subclass (so all subclasses on the website are now in Foundry).
- Fixed numerous issues with the Ranger class and its subclasses' features.
- Fixed the problem where some cantrips did half damage on a successful saving throw. 
### November 6, 2023
- Added the College of Jesters subclass to Bard
- Added the College of Lore subclass to Bard
- Revised Sorcerer to get subclass features at levels 1/6/10/14
- Standardized capitalization for each class's proficiencies and items
- Added an explanation of how to use recommended ability score arrays
- Improved the Subtle Spell metamagic option
- Removed unfinished monsters and items from compendiums (until completed)
- Added the Restore Familiar feature for Pact of the Chain warlocks
### October 30, 2023
- Added a comprehensive list of changes to cantrips in the rules compendium.
- Song of Rest now affects a maximum of 6 creatures.
- Spells by School of Magic is now fully linked to individual spell descriptions.
- Updated README
### October 23, 2023
- Cleaned up the spells page's design
- Added Way of the Open Hand subclass for monks
- Revised monk to get subclass features at levels 3/6/10/14
- Revised wizard to get access to spells of their chosen school at level 1, moved Arcane Recovery to level 2 and moved their first Arcane Tradition feature(s) to level 3
- Reformatted the sorcerer and monk pages
- Added the expanded spell list for Fiend patron warlocks
- Rogues can now choose not to have proficiency in thieves' tools
- Replaced references to 'shield' with 'large shield' and added links for items on the cleric page
- Replaced the level 10 Commander feature
- Clarified lack of synergy between repelling blast and familiar's blast
- Added all current feats except the Martial Maneuvers
- Finished the Character Creation journal entries
- Backgrounds now automatically add spells where appropriate
- Added Familiar's Blast and Implant Suggestion warlock invocations
- Properly automated the surprised condition
- Made spells that apply the poisoned condition stack
### October 15th, 2023
- Icons for conditions should now be visible
- New ancestries are available
- Ancestries have speed abilities attached for ancestries with speeds other than 30
- Backgrounds give their spells if they are meant to provide spells
- The Fiend Patron and the Elkan Brute rogue, Duelist rogue, and Spellsword fighter have been added.
- Half-cover and three-quarters-cover icons should now function
- Finished Bard
- Updated Cleric
### August 27, 2023
- Fixed Militant background
- Added some instructions to automate the consumption of Ki and Sorcery Points for certain class features
- Updated Commander
- Updated College of Noise
- Added an expanded spell list for Beastmasters
- Improved the Wild and Maritime Backgrounds.
- Fixed darts in the weapon chart and added Unarmed Strikes as a simple weapon
### August 13, 2023
- Items Update

## v1.2.4
- Backgrounds in Foundry with their features
- Added Misc

## v1.2.3
- Cleaned up the code
- Changed Elkan XXX Class or Elkan XXX Subclass to just be called the class or subclass
  - Ex. Elkan Fighter became Fighter

## v1.2.2
- Added discord information for the Authors
- Removed the old database system that Foundry used to use before V11
- Fixed bug with the new Foundry Database so it can actually be used with GitHub

## v1.2.1
### June 2023
- Updated to Foundry V11
- Reorganized module.json alphabetically
- Created Character Creation Rules
### May 2023
- Readded Elkan Spells Compendium
- Changed the Name of the Module from Elkan Dev to Elkan 5e
- Updated Classes
  - Elkan Barbarian
  - Elkan Paladin
  - Elkan Fighter
- Updated Subclasses
  - Elkan Champion
- Added Small Shield
- Added Large Shield
- Fixed Mundane Equipment
- Added Spells by School of Magic
- Added Class Spell Lists 
- Added Custom Spells
  - Discorporate
  - Minor Magic Missile
  - Negative Energy Ray
  - Rend Vigor
  - Town Portal
  - Well of Corruption
  - Wrath of the Reaper
- Updated Spell
 - Animate Dead
 - Fireball

## v1.1.16
- Updated Classes
  - Elkan Barbarian
  - Elkan Fighter
  - Elklan Paladin
  - Elkan Ranger 
- Updated Subclasses
  - Elkan Champion
  - Commander
- Added/Updated Roll Tables
  - Wild Surge Table lv. 1-9

## v1.1.15
- Added Label to Elkan's Background
- Added Elkan Background Features Compendium
- Added/Updated Backgrounds
  - Arcanist
  - Cosmopolitan
  - Devout 
- Updated Classes
  - Elkan Ranger
  - Elkan Wizard
- Added/Updated Subclasses
  - Commander
  - Elkan Champion
- Added Weapon Property Rules
  - Magic Weapon Property
  - Adamantine/Cold Iron/Silver Property
- Updated Rules
  - Armor
  - Class Notes
  - Tools
  - Weapons

## v1.1.14
- Updated Classes
  - Elkan Warlock
    - Added Missing Invocations
- Updated Religion notes

## v1.1.13
- Added links to features, Elkan 5e rules, and weapons
- Also changed the module so that the minimum compatibility with Foundry was v10

## v1.1.12
- Added Commander as a Fighter Subclass
- Updated Features
  - Adrenaline Surge
  - Aura of Courage
  - Aura of Protection
  - Divine Sense 
  - Divine Smite
  - Extra Attack
  - Invocation: Thirsting Blade
  - Keen Sight and Hearing 
  - Mark for Death
  - Mark for Death (Damage)
  - Rage
  - Uncanny Dodge
- Fixed some Magical Items
- Fixed Mundane Item 
  - Notable Error Warhammer was in Magical Item; it has been moved to Mundane Items

## v1.1.11
- Changed Race Features Compendium to Ancestry Features
- Added Background Compendium
- Added Arcanist Background
- Updated Classes
  - Elkan Barbarian
  - Elkan Bard
  - Elkan Sorcerer
- Updated Subclass
  - Elkan Beastmaster
- Updated Ancestry Features
- Updated Roll Table Wild Surge Cantrip

## v1.1.10
- Actually updated to Foundry V10
- Removed Elkan 5e Scene because it wasn't being used
- Updated Classes
  - Elkan Warlock
    - Updated Invocations
  - Elkan Barbarian
  - Elkan Rogue
  - Elkan Bard
  - Elkan Monk
  - Elkan Paladin
  - Elkan Fighter
  - Elkan Sorcerer
  - Elkan Artificer (Shell Doesn't work)
  - Elkan Wizard
  - Elkan Ranger
- Added and Updated Conditions Rules
- Updated Weapon Property Rules
  - Reach
  - Mounted
- Updated Class Notes
- Added New Rules
  - Tools
  - Weapons
  - Armor 
  - Skills
- Updated Beastmaster
- Separated Non-Magical and Magical Items into two compendiums
  - Non-magical went into a compendium called Elkan Mundane Items
  - Magical went into a compendium called Elkan Magical Items
- Added Wild Surge Table Lv. 1 to Elkan 5e Roll Table
- Cleaned Up Compendiums

## v1.1.9
- Updated Module to Foundry V10
- Redid module.json with the new required information
- Updated Classes
  - Elkan Bard (https://www.elkan5e.com/bard)
- Updated Subclasses
  - Elkan Hunter (https://www.elkan5e.com/ranger)
  - College of Noise (https://www.elkan5e.com/bard)
  - Elkan Beastmaster (https://www.elkan5e.com/ranger)

## v1.1.8
- Updated Classes
  - Elkan Warlock
    - Updated and Added Invocations
- Created Classes
  - Elkan Bard (https://www.elkan5e.com/bard)
- Created Subclasses 
  - College of Noise (Bard Subclass)
  - Elkan Beastmaster

## v1.1.7
- Added Elkan Warlock (https://www.elkan5e.com/warlock)
- Added some Invocations
- Spell slots for Warlock need to be manually done

## v1.1.6
- Added Elkan Fighter (https://www.elkan5e.com/fighter)
- Gave Elkan Fighter Default Save
- Updated Features (not Elkan Fighter Based)
  - Barbarian Default Proficiency
  - Monastic Tradition
  - Bardic Inspiration
  - Elkan Paladin
- Item Update
  - Fixed Bugs 
- Notes Update
    - Added Elkan Fighter Notes
    - Updated Elkan Ranger Notes
    - Updated Elkan Paladin Notes
    - Updated Elkan Rogue Notes

## v1.1.5
- Updated Classes:
  - Elkan Sorcerer (Updated Default Save)
  - Elkan Wizard
- Updated Features
  - Rage
  - Divine Smite

## v1.1.4
- Updated Classes by giving them their default saves. This had separate instances for if it is their original class or if it is a multiclass
  - Elkan Barbarian
  - Elkan Monk
  - Elkan Paladin
  - Elkan Ranger
  - Elkan Rogue
  - Elkan Sorcerer
  - Elkan Wizard

## v1.1.3
- Updated module.json info
- Set the system to be dnd5e only
- Set each compendium to be dnd5e only
- Added midi-qol and dae as dependencies
- Fixed small issues everywhere

## v1.1.2
- Updated Elkan Classes
- Updated Elkan Class Features
- Updated Elkan Race Features

## v1.1.1
- Added Compendium Elkan5e Race Features
- Updated Elkan Classes
- Updated Elkan Class Features Compendium
- Updated Elkan Notes
- Updated Elkan Rules
- Removed Spells
- Updated Hunter
- Added Weapons
  - Magic Versions of those Weapons
  - Adamantine Versions of those Weapons (Both Magical and not)
  - Silvered Versions of those Weapons (Both Magical and not)

## v1.1.0
- Updated Elkan 5e in Foundry for DND 1.6.0
- Updated Unrelenting Focus
- Added Elkan 5e subclass compendium
- Changed the compendium Elkan 5e Conditions to Elkan 5e Rules so that it becomes the area for all the Elkan 5e rules
- Changed the backend of the notes to specifically reference Elkan 5e
- Updated Classes
    - Elkan Barbarian
    - Elkan Monk
    - Elkan Paladin
    - Elkan Rogue
    - Elkan Sorcerer
    - Elkan Wizard
- Updated Elkan Hunter
- Added and Updated Notes
    -  Elkan Condition Notes
    -  Elkan Weapon Notes
    -  Notes for the classes
- Added more rules to conditions 
- Added Elkan's Weapon Property Information
- Added the lore of Elkan 5e languages
- New division for languages (Trade Languages, Rare Languages, Magical Languages)
- Even more links

## v1.0.9
- Created Elkan 5e version of Barbarian 
   - Exceptions:
      - Armored Defense
      - Added images to Barbarian Abilities
- Updated Martial Arts
- Updated Bardic Inspiration
- Cleaned Up some work 
- Added the notes that are on the website https://www.elkan5e.com/ for the classes that exist
- Added a lot of links to other pages  (ex., if an ability mentions grappled, there will be a link to the grappled page)

## v1.0.8
- Added a shell of all the classes to Elkan 5e classes
- Updated spells

## v1.0.7
- Updated broken spells

## v1.0.6
- Cleaned up redundant information in the compendium
- Cleaned up databases to follow the same name trend
- Replaced an image
- Added Spells

## v1.0.5
- Updated module description
- Updated Elkan 5e version of Ranger
  - Updated Hunter's Mark
- Added Elkan 5e version of Sorcerer

## v1.0.4
- Added Elkan Hunter 
- Added Elkan Rogue
- Added the Elkan Religion information

## v1.0.3
- Named the compendium after Elkan folders
- Updated Conditions
- Updated Elkan Ranger

## v1.0.2
- Released

## v1.0.1
- A local file