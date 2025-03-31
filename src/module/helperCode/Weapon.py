
import os
import json

# Define the folder containing the JSON files
folder_paths = [
    'src\packs\elkan5e-equipment', 
    'src\packs\elkan5e-magic-items'
]

# Loop through every file in the folder
for folder_path in folder_paths:
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            
            # Load the JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                    

                if data["type"] == "weapon" and data['folder'] != "6Glc0xFoDvY8BJYX":
                    versatile = False
                    data["system"]["unidentified"]["description"] = "<p><em>This weapon is unusually keen and easy to handle. It is most likely a magic weapon, though you can’t identify the specific enchantment.</em></p>"
                    # Sets these values to be default empty in any case where it should be different then its changed at that point
                    data["system"]["source"]["custom"] = "elkan5e.com/weapons"

                    if data["system"]["type"]["baseItem"] == "greatclub":
                        data["system"]["damage"]["base"]["number"] = "1"
                        data["system"]["damage"]["base"]["denomination"] = "10"
                        data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                        data["system"]["properties"] = ["two"]
                        weight = 5
                        price = 10