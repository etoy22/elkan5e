import os
import json

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

            # Modify the data (example: removing a key)
            keys_to_remove = [
                "betterRolls5e",
                "favtab",
                "exportSource",
                "mess",
                "enhanced-terrain-layer",
                "srd5e"
            ]
            if 'flags' in data:
                for key in keys_to_remove:
                    if key in data['flags']:
                        del data['flags'][key]

            if 'system' in data:
                if 'identifier' in data["system"]:
                    if data["system"]["identifier"] != "dragonborn":
                        data["system"]["identifier"] = ""
                if 'source' in data['system']:
                    data["system"]["source"]["revision"] =  1
                    data["system"]["source"]["rules"] =  ""
                    data["system"]["source"]["book"] =  "Elkan 5e"
                    data["system"]["source"]["page"] =  ""
                    data["system"]["source"]["license"] =  ""


            with open(file_path, 'w') as file:
                json.dump(data, file, indent=4)

            print(f'Processed file: {filename}')
            i+= 1

print("Gone through", i, "files")