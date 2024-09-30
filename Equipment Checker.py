import os
import json

# Define the folder containing the JSON files
folder_paths = [
    'src\packs\elkan5e-equipment', 
    'src\packs\elkan5e-magic-items'
]
i = 0
equipment = []
weapons = []
no_name = []
# Loop through every file in the folder
for folder_path in folder_paths:
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            
            # Load the JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            if "type" in data:
                # Checks the name for the value of the magic bonus
                magicBonus = None
                if "+1" in data["name"]:
                    magicBonus = 1
                if "+2" in data["name"]:
                    magicBonus = 2
                if "+3" in data["name"]:
                    magicBonus = 3
                
                if data["type"] == "equipment" and data['folder'] != "K5xsW4FLQleQsk3D":
                    if data["system"]["type"]["value"] == "shield" or data["system"]["type"]["value"] == "heavy" or data["system"]["type"]["value"] == "medium" or data["system"]["type"]["value"] == "light":

                        # Applies the default magic bonus if in the name
                        data["system"]["armor"]["magicalBonus"] = magicBonus


                        # Takes the base item and then gives values based on it
                        match data["system"]["type"]["baseItem"]:
                            case 'padded':
                                data["system"]["armor"]["value"] = 11
                                data["system"]["armor"]["dex"] = None
                            case 'leather':
                                data["system"]["armor"]["value"] = 12
                                data["system"]["armor"]["dex"] = None
                            case 'hide':
                                data["system"]["armor"]["value"] = 12
                                data["system"]["armor"]["dex"] = 2
                            case 'chainshirt':
                                data["system"]["armor"]["value"] = 13
                                data["system"]["armor"]["dex"] = 2
                            case 'scalemail':
                                data["system"]["armor"]["value"] = 14
                                data["system"]["armor"]["dex"] = 2
                            case 'halfplate':
                                data["system"]["armor"]["value"] = 15
                                data["system"]["armor"]["dex"] = 2
                            case 'ringmail':
                                data["system"]["armor"]["value"] = 14
                                data["system"]["armor"]["dex"] = None
                            case 'chainmail':
                                data["system"]["armor"]["value"] = 16
                                data["system"]["armor"]["dex"] = 0
                            case 'splint':
                                data["system"]["armor"]["value"] = 17
                                data["system"]["armor"]["dex"] = 0
                            case 'plate':
                                data["system"]["armor"]["value"] = 18
                                data["system"]["armor"]["dex"] = 0
                            case 'breastplate':
                                data["system"]["armor"]["value"] = 14
                                data["system"]["armor"]["dex"] = 2
                            case 'large':
                                data["system"]["armor"]["value"] = 2
                                data["system"]["armor"]["dex"] = None
                            case 'small':
                                data["system"]["armor"]["value"] = 1
                                data["system"]["armor"]["dex"] = None


                if data["type"] == "weapon" and data['folder'] != "6Glc0xFoDvY8BJYX" :
                    versatile = False

                    #  Sets these values to be default empty in any case where it should be different then its changed at that point
                    data["system"]["damage"]["base"]["bonus"] = ""
                    data["system"]["damage"]["base"]["custom"]["enabled"] = False
                    data["system"]["damage"]["base"]["custom"]["formula"] = ""
                    data["system"]["damage"]["base"]["scaling"] = {
                        "mode": "",
                        "number": None,
                        "formula": ""
                    }
                    data["system"]["magicalBonus"] = magicBonus
                    data["system"]["damage"]["versatile"] = {
                        "number": None,
                        "denomination": None,
                        "bonus": "",
                        "types": [],
                        "custom": {
                            "enabled": False,
                            "formula": ""
                        },
                        "scaling": {
                            "mode": "",
                            "number": None,
                            "formula": ""
                        }
                    }

                    # Takes the base item and assigns values to it based on that base item
                    match data["system"]["type"]["baseItem"]:
                        case 'battleaxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] =  ["slashing"]
                            data["system"]["damage"]["versatile"]["number"] =  1
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] =  ["slashing"]
                        case 'blowgun':
                            data["system"]["damage"]["base"]["number"] = None
                            data["system"]["damage"]["base"]["denomination"] = None
                            data["system"]["damage"]["base"]["custom"]["enabled"] = True
                            data["system"]["damage"]["base"]["custom"]["formula"] = "1 + @mod"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'club':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                        case 'dagger':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'dart':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'glaive':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                        case 'greataxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "12"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                        case 'greatclub':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                        case 'greatsword':
                            data["system"]["damage"]["base"]["number"] = "2"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                        case 'halberd':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing","slashing"]
                        case 'handaxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                        case 'handcrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'heavycrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'javelin':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'lance':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "12"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'lightcrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'lighthammer':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                        case 'longbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'longsword':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] = ["slashing"]
                        case 'mace':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                        case 'maul':
                            data["system"]["damage"]["base"]["number"] = "2"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                        case 'morningstar':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] = ["piercing"]
                        case 'pike':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'quarterstaff':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                        case 'rapier':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'scimitar':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                        case 'shortbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                        case 'shortsword':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                        case 'sickle':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                        case 'sling':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                        case 'spear':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "8"
                            data["system"]["damage"]["versatile"]["types"] = ["piercing"]
                        case 'warhammer':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] = ["bludgeoning"]                            
                        case 'whip':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                                    



            with open(file_path, 'w') as file:
                json.dump(data, file, indent=4)

            print(f'Processed file: {filename}')
            i+= 1

print("Gone through", i, "files")
print("Equipment",sorted(equipment))
print("Weapons",sorted(weapons))
print("No Base Item",no_name)