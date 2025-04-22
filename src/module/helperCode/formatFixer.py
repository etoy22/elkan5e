import os
import json

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

elements_with_div = []  # List to store elements containing <div in system.description.value
elements_with_span = []  # List to store elements containing <span in system.description.value

for folder_path in folder_paths:
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            
            # Load the JSON file
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON in file {file_path}: {e}")
                continue
            
            # Replace non-breaking spaces and specific text patterns
            def replace_text(obj):
                if isinstance(obj, str):
                    obj = obj.replace('\u00A0', ' ')
                    obj = obj.replace('\u200B', '')  # Replace zero-width space with a regular space
                    obj = obj.replace('<strong>Success</strong>:', '<strong>Success:</strong>')
                    obj = obj.replace('<strong>Failure</strong>:', '<strong>Failure:</strong>')
                    obj = obj.replace('<strong>Material</strong>:', '<strong>Material:</strong>')
                    obj = obj.replace('<strong>Concentration</strong>:', '<strong>Concentration:</strong>')
                    obj = obj.replace('<strong>Area Hazard</strong>:', '<strong>Area Hazard:</strong>')
                    obj = obj.replace('<strong>Hit</strong>:', '<strong>Hit:</strong>')
                    obj = obj.replace('<strong>Miss</strong>:', '<strong>Miss:</strong>')
                    obj = obj.replace('<strong>*At Higher Levels</strong>:', '<strong>*At Higher Levels:</strong>')
                    obj = obj.replace('*<strong>At Higher Levels</strong>:', '<strong>*Using Higher Level Spell Slots:</strong>')
                    obj = obj.replace('*<strong>At Higher Levels:</strong>', '<strong>*Using Higher Level Spell Slots:</strong>')
                    if 'elkan5e/icons/' in obj and 'elkan5e/icons/conditions/' not in obj:
                        obj = obj.replace('elkan5e/icons/', 'elkan5e/icons/conditions/')  # New replacement
                    return obj
                elif isinstance(obj, list):
                    return [replace_text(item) for item in obj]
                elif isinstance(obj, dict):
                    return {key: replace_text(value) for key, value in obj.items()}
                return obj
            
            updated_data = replace_text(data)
            
            # Check for <div and <span in system.description.value
            def find_elements(obj):
                if isinstance(obj, dict):
                    if 'system' in obj and 'description' in obj['system'] and 'value' in obj['system']['description']:
                        if '<div' in obj['system']['description']['value']:
                            elements_with_div.append(obj.get('name', 'Unnamed Element'))
                        if '<span' in obj['system']['description']['value']:
                            elements_with_span.append(obj.get('name', 'Unnamed Element'))
                    for key, value in obj.items():
                        find_elements(value)
                elif isinstance(obj, list):
                    for item in obj:
                        find_elements(item)
            
            find_elements(updated_data)
            
            # Save the updated JSON file
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(updated_data, file, ensure_ascii=False, indent=4)

# Print or save the lists of elements containing <div and <span
print("Elements with <div:")
for element in elements_with_div:
    print(f"- [ ] {element}")

print("Elements with <span:")
for element in elements_with_span:
    print(f"- [ ] {element}")
