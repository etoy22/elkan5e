import os
import json
import logging
from updateTime import load_and_update_json
from htmlSimplifier import simplify_html

# Setup logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

folder_paths = [
    'src\packs\elkan5e-ancestries',
    'src\packs\elkan5e-backgrounds',
    'src\packs\elkan5e-class',
    'src\packs\elkan5e-class-features',
    'src\packs\elkan5e-creature-features',
    'src\packs\elkan5e-creatures',
    'src\packs\elkan5e-equipment',
    'src\packs\elkan5e-feats',
    'src\packs\elkan5e-lore',
    'src\packs\elkan5e-macros',
    'src\packs\elkan5e-magic-items',
    'src\packs\elkan5e-roll-tables',
    'src\packs\elkan5e-rules',
    'src\packs\elkan5e-spells',
    'src\packs\elkan5e-subclass',
    'src\packs\elkan5e-summoned-creatures'
]

change_count = 0

skills = ["acr", "ani", "arc", "ath", "dec", "his", "ins", "itm", "inv",
    "med", "nat", "prc", "prf", "per", "rel", "slt", "ste", "sur"]
skill_labels = ["acrobatics", "animal handling", "arcana", "athletics", "deception",
    "history", "insight", "intimidation", "investigation", "medicine",
    "nature", "perception", "performance", "persuasion", "religion",
    "sleight of hand", "stealth", "survival"]
conditions = [
    "blinded", "charmed", "concentrating", "confused", "cursed", "dazed",
    "deafened", "diseased", "drained", "exhaustion", "frightened", "goaded",
    "grappled", "half cover", "hasted", "heavily obscured", "incapacitated",
    "invisible", "lightly obscured", "paralyzed", "petrified", "poisoned",
    "prone", "restrained", "silenced", "siphoned", "slowed", "stunned",
    "surprised", "three quarters cover", "transformed", "unconscious", "weakened"
]
condition_labels = ["halfcover", "heavilyobscured", "lightlyobscured", "threequarterscover"]
creature_labels = ["aberration", "beast", "celestial", "construct", "dragon", "elemental", "fey", "fiend", "giant", "humanoid", "monstrosity", "ooze", "plant", "undead"]
damage_types = ["acid", "bludgeoning", "cold", "lightning", "fire", "force", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"]
schools_of_magic = ["abj", "con", "div", "enc", "evo", "ill", "nec", "trs"]
school_labels = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"]
rules = [
    "attack", "opportunityattacks", "dodge", "dash", "disengage", 
    "help", "hide", "ready", "search", "surprise", 
    "unarmedstrike", "twoweaponfighting", "spellSlots", "spellLevel",
    "cantrips", "upcasting", "castingAtHigherLevel", "multipleSpellsInATurn",
    "duplicateMagicalEffects", "lineOfSight", "coverAndWalls", "castingInArmor",
    "castingTime", "spellTargets", "spellRange", "verbal", "spellDuration",
    "illusoryImages", "knownSpells", "preparedSpells", "abilitySpells",
    "focusSpells", "spellScroll", "cursed", "material", "ritual", "vocal", "somatic"
]

references = skills + skill_labels + conditions + condition_labels + creature_labels + damage_types + schools_of_magic + school_labels + rules

def transform_value(value):
    """Simplify and apply replacements to a string value."""
    logging.debug("Original value: %s", value)
    simplified = simplify_html(value)
    replacements = {
        '\u00A0': ' ', '\u200B': '', '’': '\'',
        '<strong>Feats From Other Sources</strong> :': '<strong>Feats From Other Sources:</strong>',
        '<strong>Summoning Spell</strong> :': '<strong>Summoning Spell:</strong>',
        '<strong>Materials</strong> :': '<strong>Materials:</strong>',
        '<strong>Reactions</strong> :': '<strong>Reactions:</strong>',
        '<strong>Actions</strong> :': '<strong>Actions:</strong>',
        '<strong>Upcasting</strong> :': '<strong>Upcasting:</strong>',
        '<strong>At Higher Levels</strong> :': '<strong>At Higher Levels:</strong>',
        '<strong>On Hit</strong> :': '<strong>On Hit:</strong>',
        '*<strong>Using Higher Level Spell Slots</strong> :': '<strong>*Using Higher Level Spell Slots:</strong>',
        '<strong>Hit Dice</strong> :': '<strong>Hit Dice:</strong>',
        '<strong>Items</strong> :': '<strong>Items:</strong>',
        '<strong>Swim Speed</strong> :': '<strong>Swim Speed:</strong>',
        '<strong>Success</strong>:': '<strong>Success:</strong>',
        '<strong>Failure</strong>:': '<strong>Failure:</strong>',
        '<strong>Material</strong>:': '<strong>Material:</strong>',
        '<strong>Concentration</strong>:': '<strong>Concentration:</strong>',
        '<strong>Area Hazard</strong>:': '<strong>Area Hazard:</strong>',
        '<strong>Hit</strong>:': '<strong>Hit:</strong>',
        '<strong>Miss</strong>:': '<strong>Miss:</strong>',
        '<strong>*At Higher Levels</strong>:': '<strong>*At Higher Levels:</strong>',
        '<strong>*Upcasting</strong> :': '<strong>*Upcasting:</strong>',
        '<strong>*Upcasting</strong>:': '<strong>*Upcasting:</strong>',
        '*<strong>At Higher Levels</strong>:': '<strong>*Using Higher Level Spell Slots:</strong>',
        '*<strong>At Higher Levels</strong> :': '<strong>*Using Higher Level Spell Slots:</strong>',
        '<strong>Cantrips</strong> :': '<strong>Cantrips:</strong>',
        '<strong>Size</strong> :': '<strong>Size:</strong>',
        '<strong>Type</strong> :': '<strong>Type:</strong>',
        '<strong>Language</strong> :': '<strong>Language:</strong>',
        '<strong>Walking Speed</strong> :': '<strong>Walking Speed:</strong>',
        '<strong>Damage Resistance</strong> :': '<strong>Damage Resistance:</strong>',
        '<strong>Senses</strong> :': '<strong>Senses:</strong>',
        '<strong>@UUID[Compendium.elkan5e.elkan5e-rules.JournalEntry.5l8QNlgPDPOHpGID]{Language}</strong> :': '<strong>@UUID[Compendium.elkan5e.elkan5e-rules.JournalEntry.5l8QNlgPDPOHpGID]{Language}:</strong>',
        '&amp;reference[magicW]': '&amp;reference[magic weapon]',
        '&amp;reference[magicw]': '&amp;reference[magic weapon]',
        '&amp;reference[Magicw]': '&amp;reference[magic weapon]',
        '&amp;reference[MagicW]': '&amp;reference[magic weapon]',
        '&amp;Reference[magicW]': '&amp;reference[magic weapon]',
        '&amp;Reference[magicw]': '&amp;reference[magic weapon]',
        '&amp;Reference[Magicw]': '&amp;reference[magic weapon]',
        '&amp;Reference[MagicW]': '&amp;reference[magic weapon]',
        '&amp;reference[coldW]': '&amp;reference[cold iron]',
        '&amp;reference[coldw]': '&amp;reference[cold iron]',
        '&amp;reference[Coldw]': '&amp;reference[cold iron]',
        '&amp;reference[ColdW]': '&amp;reference[cold iron]',
        '&amp;Reference[coldW]': '&amp;reference[cold iron]',
        '&amp;Reference[coldw]': '&amp;reference[cold iron]',
        '&amp;Reference[Coldw]': '&amp;reference[cold iron]',
        '&amp;Reference[ColdW]': '&amp;reference[cold iron]',
        '&amp;reference[lightw]': "&amp;reference[light weapon]",
        '&amp;reference[lightW]': "&amp;reference[light weapon]",
        '&amp;reference[Lightw]': "&amp;reference[light weapon]",
        '&amp;reference[LightW]': "&amp;reference[light weapon]",
        '&amp;Reference[lightw]': "&amp;reference[light weapon]",
        '&amp;Reference[lightW]': "&amp;reference[light weapon]",
        '&amp;Reference[Lightw]': "&amp;reference[light weapon]",
        '&amp;Reference[LightW]': "&amp;reference[light weapon]",
        'elkan5e/icons/': 'elkan5e/icons/conditions/' if 'elkan5e/icons/conditions/' not in value else value
    }
    original_simplified = simplified  # Keep track of the original value
    has_changes = False  # Track if any changes are made

    for old, new in replacements.items():
        if old in simplified:
            logging.debug("Replacing '%s' with '%s'", old, new)
            simplified = simplified.replace(old, new)
            has_changes = True

    # Handle references
    start_indices = [i for i in range(len(simplified)) if simplified.startswith("<ul>", i)]
    end_indices = [i for i in range(len(simplified)) if simplified.startswith("</ul>", i)]
    p_start_indices = [i for i in range(len(simplified)) if simplified.startswith("<p>", i)]
    p_end_indices = [i for i in range(len(simplified)) if simplified.startswith("</p>", i)]

    ULcomb = list(zip(start_indices, end_indices))
    Pcomb = list(zip(p_start_indices, p_end_indices))

    cut = []
    for p_start, p_end in Pcomb:
        if not any(ul_start < p_start < ul_end and ul_start < p_end < ul_end for ul_start, ul_end in ULcomb):
            cut.append((p_start, p_end))

    cut.extend(ULcomb)
    cut.sort()

    splices = []
    for start, end in cut:
        splices.append(simplified[start:end + 5])  # Include the closing tag

    for ref in references:
        for i, splice in enumerate(splices):
            # Match whole words only
            if f"&amp;reference[{ref}]" in splice or f"{ref}]]" in splice:
                logging.debug("Reference '%s' already exists in splice %d, skipping.", ref, i)
                continue
            if f"&amp;reference[" in splice:
                logging.debug("Skipping nested &amp;reference for '%s' in splice %d.", ref, i)
                continue
            if any(word == ref for word in splice.split()):  # Match whole words
                logging.debug("Adding reference '%s' in splice %d", ref, i)
                splices[i] = splice.replace(ref, f"&amp;reference[{ref}]", 1)
                has_changes = True  # Mark changes when a reference is updated

    updated_value = ''.join(splices)
    if updated_value != original_simplified:  # Compare with the original value
        has_changes = True

    logging.debug("Updated value: %s", updated_value)
    return updated_value if has_changes else value

def process_object(obj):
    """Recursively process an object, applying transformations where needed."""
    has_changes = False
    if isinstance(obj, dict):
        # Process 'description.value' field
        if 'description' in obj and 'value' in obj['description']:
            original = obj['description']['value']
            updated = transform_value(original)
            if updated != original:
                logging.debug("Updating 'description.value': %s -> %s", original, updated)
                obj['description']['value'] = updated
                has_changes = True

        # Process 'text.content' field
        if 'text' in obj and 'content' in obj['text']:
            original = obj['text']['content']
            updated = transform_value(original)
            if updated != original:
                logging.debug("Updating 'text.content': %s -> %s", original, updated)
                obj['text']['content'] = updated
                has_changes = True

        # Handle spell-specific logic
        if "type" in obj and obj["type"] == 'spell':
            description = obj.get("system", {}).get("description", {}).get("value", "")
            if description:
                simplified_description = simplify_html(description)
                obj["system"]["description"]["value"] = simplified_description

                # Check for <em> in the first non-empty paragraph
                description_parts = simplified_description.split("<p>")
                first_paragraph = next((part for part in description_parts if part.strip()), "")
                if "<em>" in first_paragraph:
                    # Exclude the first paragraph containing <em> when constructing chat
                    chat_parts = [part for part in description_parts[1:] if "<em>" not in part]
                    chat = "<p>".join(chat_parts) if chat_parts else ""
                else:
                    chat = ''  # Remove the description

                # Assign the calculated chat value back to the JSON data
                if chat != obj["system"]["description"]["chat"]:
                    logging.debug("Updating 'system.description.chat': %s -> %s", obj["system"]["description"]["chat"], chat)
                    obj["system"]["description"]["chat"] = chat
                    has_changes = True

        # Recursively process nested objects
        for key, value in obj.items():
            if process_object(value):
                has_changes = True
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            if process_object(item):
                has_changes = True
    return has_changes

def process_file(file_path):
    """Load, process, and save a JSON file if changes are made."""
    global change_count
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON in file {file_path}: {e}")
        return

    if process_object(data):  # Only update if changes were made
        data = load_and_update_json(data)
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, ensure_ascii=False, indent=4)
        change_count += 1  # Increment only when a file is written

def main():
    """Main function to process all JSON files in the specified folders."""
    for folder_path in folder_paths:
        for filename in os.listdir(folder_path):
            if filename.endswith('.json'):
                process_file(os.path.join(folder_path, filename))

    print(f"Total changes made: {change_count}")

if __name__ == "__main__":
    main()
