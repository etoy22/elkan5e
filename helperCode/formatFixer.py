import os
import json
from updateTime import load_and_update_json
from htmlSimplifier import simplify_html
from helping.constants import references

# Setup logging to a file
log_file_path = os.path.join(os.path.dirname(__file__), "formatFixer.log")
with open(log_file_path, 'w', encoding='utf-8') as log_file:  # Clear the log file at the start
    log_file.write("")

def log_message(message):
    """Log a message to the log file."""
    with open(log_file_path, 'a', encoding='utf-8') as log_file:  # Use UTF-8 encoding
        log_file.write(message + "\n")

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


def transform_value(value):
    """Simplify and apply replacements to a string value."""
    simplified = simplify_html(value)
    replacements = {
        '\u00A0': ' ', '\u200B': '', '’': '\'','':'​',
        '</p>&': '</p>',  # Ensure this replacement is applied only when necessary
        '<strong>Strength</strong> Saving Throw': '<strong>Strength Save</strong>',
        '<strong>Dexterity</strong> Saving Throw': '<strong>Dexterity Save</strong>',
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
        '<p>You have a bonus to attack and damage rolls made with this magic weapon.</p>': "",
        'elkan5e/icons/': 'elkan5e/icons/conditions/' if 'elkan5e/icons/conditions/' not in value else value
    }
    original_simplified = simplified.strip()  # Normalize by trimming whitespace
    has_changes = False  # Track if any changes are made

    for old, new in replacements.items():
        # Log the replacement for debugging
        if old in simplified:
            log_message(f"Applying replacement: '{old}' -> '{new}'")
            simplified = simplified.replace(old, new)
            has_changes = True

    updated_value = simplified.strip()  # Normalize updated value
    if updated_value != original_simplified:  # Compare normalized values
        has_changes = True
        log_message(f"Updated value: {updated_value}")

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
                log_message(f"Updating 'description.value': {original} -> {updated}")
                obj['description']['value'] = updated
                has_changes = True

        # Process 'text.content' field
        if 'text' in obj and 'content' in obj['text']:
            original = obj['text']['content']
            updated = transform_value(original)
            if updated != original:
                log_message(f"Updating 'text.content': {original} -> {updated}")
                obj['text']['content'] = updated
                has_changes = True

        # Handle spell-specific logic
        if "type" in obj and obj["type"] == 'spell':
            description = obj.get("system", {}).get("description", {}).get("value", "")
            if description:
                simplified_description = simplify_html(description)
                if simplified_description != description:
                    log_message(f"Updating 'system.description.value': {description} -> {simplified_description}")
                    obj["system"]["description"]["value"] = simplified_description
                    has_changes = True

                # Check for <em> in the first non-empty paragraph
                description_parts = simplified_description.split("<p>")
                first_paragraph = next((part for part in description_parts if part.strip()), "")
                if "<em>" in first_paragraph:
                    # Exclude only the first paragraph (after split, that's description_parts[1])
                    chat_parts = description_parts[1:]  # Skip the first paragraph after the split
                    chat = "<p>".join(chat_parts) if chat_parts else ""
                else:
                    chat = ''  # Remove the description

                if chat != obj["system"]["description"].get("chat", ""):
                    log_message(f"Updating 'system.description.chat': {obj['system']['description'].get('chat', '')} -> {chat}")
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
        log_message(f"Error decoding JSON in file {file_path}: {e}")
        return

    original_data = json.dumps(data, ensure_ascii=False, indent=4, separators=(',', ': '))  # Serialize original data
    if process_object(data):  # Only update if changes were made
        # Use load_and_update_json to apply additional updates
        updated_data = load_and_update_json(data)
        updated_serialized = json.dumps(updated_data, ensure_ascii=False, indent=4, separators=(',', ': '))
        if updated_serialized != original_data:  # Compare serialized data to detect actual changes
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(updated_serialized)
            change_count += 1  # Increment only when a file is written
            log_message(f"Changes written to file: {file_path}")

def main():
    """Main function to process all JSON files in the specified folders."""
    for folder_path in folder_paths:
        for filename in os.listdir(folder_path):
            if filename.endswith('.json'):
                process_file(os.path.join(folder_path, filename))

    log_message(f"Total changes made: {change_count}")

if __name__ == "__main__":
    main()
