import os
import json

def replace_in_json(obj, target, replacement):
    # If the object is a dictionary, we need to iterate over its keys and values
    if isinstance(obj, dict):
        return {key: replace_in_json(value, target, replacement) for key, value in obj.items()}
    # If it's a list, iterate over each item
    elif isinstance(obj, list):
        return [replace_in_json(item, target, replacement) for item in obj]
    # If it's a string, perform the specific word replacement
    elif isinstance(obj, str):
        return obj.replace(target, replacement)
    # Otherwise, return the object as is (it might be an int, float, etc.)
    else:
        return obj

# Define the folder containing the JSON files
folder_paths = [
    'src\packs\elkan-5e-ancestries', 
    'src\packs\elkan5e-backgrounds', 
    'src\packs\elkan5e-class', 
    'src\packs\elkan5e-classFeatures', 
    'src\packs\elkan-5e-creature-features', 
    'src\packs\elkan5e-creatures', 
    'src\packs\elkan5e-equipment', 
    'src\packs\elkan-5e-feats', 
    'src\packs\elkan5e-lore', 
    'src\packs\elkan5e-macros', 
    'src\packs\elkan5e-magic-items', 
    'src\packs\elkan5e-mundane-items', 
    'src\packs\elkan5e-roll-tables', 
    'src\packs\elkan5e-rules', 
    'src\packs\elkan5e-spells', 
    'src\packs\elkan5e-subclass', 
    'src\packs\elkan-5e-summoned-creatures'   
]
i = 0
# Loop through every file in the folder
for folder_path in folder_paths:
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            
            # Load the JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            modified_data = replace_in_json(data, ' ', ' ')

            with open(file_path, 'w') as file:
                json.dump(data, file, indent=4)

            print(f'Processed file: {filename}')
            i+= 1

print("Gone through", i, "files")