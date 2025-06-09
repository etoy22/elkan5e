import os
import json
from updateTime import load_and_update_json  # Import the helper function

apply_replacements = True  # Set to True to apply replacements

folders = [
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

def replace_icons_in_data(data, path="root"):
    """
    Recursively replace instances of "/icons/" with "/icons/conditions/" in the given data.
    """
    if isinstance(data, dict):
        for key, value in list(data.items()):  # Use list to avoid runtime errors during iteration
            current_path = f"{path}.{key}"
            if isinstance(value, (dict, list)):
                replace_icons_in_data(value, current_path)
            elif isinstance(value, str):
                if "/icons/" in value:
                    data[key] = value.replace('/icons/', '/icons/conditions/')
    elif isinstance(data, list):
        for index, item in enumerate(data):
            current_path = f"{path}[{index}]"
            if isinstance(item, (dict, list)):
                replace_icons_in_data(item, current_path)
            elif isinstance(item, str):
                if "/icons/" in item:
                    data[index] = item.replace('/icons/', '/icons/conditions/')
    else:
        # Log unexpected data types for debugging
        print(f"Unexpected data type at {path}: {type(data)} - {data}")

for folder_path in folders:
    if not os.path.exists(folder_path):
        print(f"Folder does not exist: {folder_path}")
        continue

    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)

            # Load the JSON file
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                continue

            # Replace instances of "/icons/" with "/icons/conditions/"
            updated = False
            if isinstance(data, (dict, list)):  # Ensure data is a dict or list
                try:
                    original_data = json.dumps(data, ensure_ascii=False)
                    replace_icons_in_data(data)
                    updated_data = json.dumps(data, ensure_ascii=False)
                    updated = original_data != updated_data
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    continue

            # Save the updated JSON file if changes were made
            if updated and apply_replacements:
                try:
                    # Call load_and_update_json only if updates were made
                    load_and_update_json(file_path)
                    with open(file_path, 'w', encoding='utf-8') as file:
                        json.dump(data, file, ensure_ascii=False, indent=4)
                    print(f"Updated file: {file_path}")

                except Exception as e:
                    print(f"Error writing {file_path}: {e}")