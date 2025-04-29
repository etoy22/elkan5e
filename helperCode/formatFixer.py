import os
import json
from updateTime import load_and_update_json
from htmlSimplifier import simplify_html

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

def process_file(file_path):
    global change_count
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON in file {file_path}: {e}")
        return

    def transform_value(value):
        simplified = simplify_html(value)
        replacements = {
            '\u00A0': ' ', '\u200B': '', '’': '\'',
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
            '&amp;reference[magicW]': '&amp;reference[magic weapon]',
            '&amp;reference[magicw]': '&amp;reference[magic weapon]',
            '&amp;reference[coldW]': '&amp;reference[cold iron]',
            '&amp;reference[coldw]': '&amp;reference[cold iron]',
            '&amp;reference[lightw]': "&amp;reference[light weapon]",
            '&amp;reference[lightW]': "&amp;reference[light weapon]",
            '&amp;reference[Lightw]': "&amp;reference[light weapon]",
            '&amp;reference[LightW]': "&amp;reference[light weapon]",
            'elkan5e/icons/': 'elkan5e/icons/conditions/' if 'elkan5e/icons/conditions/' not in value else value
        }
        for old, new in replacements.items():
            simplified = simplified.replace(old, new)
        return simplified

    def process_object(obj):
        nonlocal change_count
        if isinstance(obj, dict):
            if 'description' in obj and 'value' in obj['description']:
                original = obj['description']['value']
                updated = transform_value(original)
                if updated != original:
                    obj['description']['value'] = updated
                    change_count += 1
            for key, value in obj.items():
                obj[key] = process_object(value)
        elif isinstance(obj, list):
            return [process_object(item) for item in obj]
        return obj

    updated_data = process_object(data)

    if updated_data != data:  # Only update if changes were made
        data = load_and_update_json(data)
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(updated_data, file, ensure_ascii=False, indent=4)

for folder_path in folder_paths:
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            process_file(os.path.join(folder_path, filename))


print(f"Total changes made: {change_count}")
