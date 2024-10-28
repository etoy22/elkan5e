import os
import json

def replace_in_json(obj, target, replacement):
    # Convert the object to a JSON string
    json_str = json.dumps(obj)
    
    # Replace the target with the replacement in the string
    modified_str = json_str.replace(target, replacement)
    
    # Convert the modified string back to a JSON object
    return json.loads(modified_str)

# Define the folder containing the JSON files
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
i = 0
# Loop through every file in the folder

for folder_path in folder_paths:
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
            
            # Replace all occurrences in JSON using the modified function
            mod = replace_in_json(data, 'elkan-5e-ancestries', 'elkan5e-ancestries')
            mod2 = replace_in_json(mod, 'elkan-5e-creature-features', 'elkan5e-creature-features')
            mod3 = replace_in_json(mod2, 'elkan-5e-feats', 'elkan5e-feats')
            mod4 = replace_in_json(mod3, 'elkan-5e-summoned-creatures', 'elkan5e-summoned-creatures')
            mod5 = replace_in_json(mod4, 'elkan5e-mundane-items', 'elkan5e-equipment')
            modified_data = mod5

            # Write the modified data back to the file
            try:
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(modified_data, file, indent=4)
                print(f'Processed file: {filename}')
                i += 1
            except Exception as e:
                print(f"Error writing to {file_path}: {e}")

print("Gone through", i, "files")