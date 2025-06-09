import os
import json
from updateTime import load_and_update_json  # Import the helper function

# Define the folder containing the JSON files
folder_paths = [
    'src\packs\elkan5e-equipment', 
    'src\packs\elkan5e-magic-items'
]

def magicPrice(price, magicBonus):
    if magicBonus == None:
        return price
    price = (price * 10) + 350
    if magicBonus > 1:
        price = price * 4**(magicBonus-1)
    return price

i = 0

# Loop through every file in the folder
for folder_path in folder_paths:
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)

            # Load the original JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                original_data = json.load(file)

            # Process the data
            data = original_data.copy()

            if "type" in data:
                # Checks the name for the value of the magic bonus
                magicBonus = None
                if "+1" in data["name"]:
                    magicBonus = 1
                if "+2" in data["name"]:
                    magicBonus = 2
                if "+3" in data["name"]:
                    magicBonus = 3

                if data["type"] == "weapon" and data['folder'] != "6Glc0xFoDvY8BJYX":
                    versatile = False
                    data["system"]["unidentified"]["description"] = "<p><em>This weapon is unusually keen and easy to handle. It is most likely a magic weapon, though you can’t identify the specific enchantment.</em></p>"
                    # Sets these values to be default empty in any case where it should be different then its changed at that point
                    data["system"]["source"]["custom"] = "elkan5e.com/weapons"
                    data["system"]["damage"]["base"]["bonus"] = ""
                    data["system"]["damage"]["base"]["custom"]["enabled"] = False
                    data["system"]["damage"]["base"]["custom"]["formula"] = ""
                    data["system"]["damage"]["base"]["scaling"] = {
                        "mode": "",
                        "number": None,
                        "formula": ""
                    }
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

                    # For later setting the price
                    price = 0
                    weight = 0 # the weight without the haft
                    additionProperties = []
                    if data["system"]["properties"] == "coldIron":
                        additionProperties.append("coldIron")
                    if data["system"]["properties"] == "silvered":
                        additionProperties.append("sil")
                    if data["system"]["properties"] == "adamantine":
                        additionProperties.append("ada")
                    if data["system"]["properties"] == "mgc" or magicBonus != None:
                        additionProperties.append("mgc")

                    ranged = False
                    # Takes the base item and assigns values to it based on that base item
                    match data["system"]["type"]["baseItem"]:
                        case 'battleaxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] =  ["slashing"]
                            data["system"]["damage"]["versatile"]["number"] =  1
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] =  ["slashing"]
                            data["system"]["properties"] = ["ver"]
                            weight = 4
                            price = 12
                        case 'blowgun':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["amm", "lod"]
                            data["system"]["range"] = {"value": "25/100"}
                            weight = 1
                            price = 10
                            ranged = True
                        case 'club':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["properties"] = ["lgt"]
                            weight = 2
                            price = 1
                        case 'dagger':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["fin", "lgt", "thr"]
                            data["system"]["range"] = {"value": "20/60"}
                            weight = 1
                            price = 2
                        case 'dart':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["fin", "thr", "unw"]
                            data["system"]["range"] = {"value": "30/90"}
                            weight = 3 / 20
                            price = 1 / 20
                        case 'greatclub':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["properties"] = ["two"]
                            weight = 5
                            price = 10
                        case 'handaxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["properties"] = ["lgt", "thr"]
                            data["system"]["range"] = {"value": "20/60"}
                            weight = 2
                            price = 5
                        case 'handcrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["amm", "lgt", "lod"]
                            weight = 3
                            ranged = True
                            price = 40
                        case 'heavycrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["amm", "hvy", "lod", "two"]
                            ranged = True
                            weight = 18
                            price = 50
                        case 'javelin':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["thr"]
                            data["system"]["range"] = {"value": "30/120"}
                            weight = 1
                            price = 5
                        case 'lightcrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["amm", "lod", "two"]
                            data["system"]["range"] = {"value": "80/320"}
                            ranged = True
                            weight = 5
                            price = 25
                        case 'lighthammer':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["properties"] = ["lgt", "thr"]
                            data["system"]["range"] = {"value": "20/60"}
                            weight = 2
                            price = 2
                        case 'longbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["amm", "hvy", "two"]
                            ranged = True
                            weight = 2
                            price = 50
                        case 'longsword':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["properties"] = ["ver"]
                            weight = 3
                            price = 15
                        case 'mace':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["properties"] = []
                            weight = 3
                            price = 5
                        case 'quarterstaff':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["properties"] = ["rch", "two"]
                            weight = 4
                            price = 5
                        case 'shortbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["amm", "two"]
                            data["system"]["range"] = {"value": "80/320"}
                            ranged = True
                            weight = 2
                            price = 25
                        case 'sickle':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["properties"] = ["fin", "lgt"]
                            weight = 2
                            price = 1
                        case 'sling':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["properties"] = ["amm"]
                            data["system"]["range"] = {"value": "30/120"}
                            weight = 1
                            price = 5
                        case 'spear':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["rch", "thr", "ver"]
                            data["system"]["range"] = {"value": "20/60"}
                            data["system"]["damage"]["versatile"] = {"number": "1", "denomination": "8", "types": ["piercing"]}
                            weight = 1
                            price = 5
                        case 'unarmed strike':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "1"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            weight = 0
                            price = 0
                        case 'glaive':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["properties"] = ["hvy", "rch", "two"]
                            weight = 4
                            price = 20
                        case 'greataxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "12"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["properties"] = ["hvy", "two"]
                            weight = 5
                            price = 40
                        case 'greatsword':
                            data["system"]["damage"]["base"]["number"] = "2"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["properties"] = ["hvy", "two"]
                            weight = 4
                            price = 50
                        case 'halberd':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing", "slashing"]
                            data["system"]["properties"] = ["hvy", "rch", "two"]
                            weight = 4
                            price = 30
                        case 'lance':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "12"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["mou", "rch", "unw"]
                            weight = 4
                            price = 20
                        case 'maul':
                            data["system"]["damage"]["base"]["number"] = "2"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["properties"] = ["hvy", "two"]
                            weight = 6
                            price = 40
                        case 'morningstar':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["ver"]
                            weight = 4
                            price = 15
                        case 'pike':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["hvy", "rch", "two", "unw"]
                            weight = 2
                            price = 10
                        case 'rapier':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["fin"]
                            weight = 2
                            price = 25
                        case 'scimitar':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["properties"] = ["fin", "lgt"]
                            weight = 3
                            price = 15
                        case 'shortsword':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["properties"] = ["fin", "lgt"]
                            weight = 2
                            price = 10
                        case 'warhammer':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] = ["bludgeoning"]
                            data["system"]["properties"] = ["ver"]
                            weight = 4
                            price = 15
                        case 'whip':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["properties"] = ["fin", "rch"]
                            weight = 3
                            price = 5

                    # Add additional properties to data["system"]["properties"]
                    data["system"]["properties"].extend(additionProperties)

                    finPrice = 0
                    if not(ranged):
                        data["system"]["magicalBonus"] = magicBonus
                        # Calculate pricing on weapons
                        if "Silver" in data["name"]:
                            if "sil" not in data["system"]["properties"]:
                                data["system"]["properties"].append("sil")
                            if magicBonus == None:
                                finPrice = price + weight * 25
                            else:
                                calc = magicPrice(price, magicBonus)
                                finPrice = calc + weight * 100
                        elif "Cold Iron" in data["name"]:
                            if "coldIron" not in data["system"]["properties"]:
                                data["system"]["properties"].append("coldIron")
                            if magicBonus == None:
                                finPrice = price + 50 + weight * 10
                            else:
                                calc = magicPrice(price, magicBonus)
                                finPrice = calc + 50 + weight * 40
                        elif "Adamantine" in data["name"]:
                            if "ada" not in data["system"]["properties"]:
                                data["system"]["properties"].append("ada")
                            if magicBonus == None:
                                finPrice = price + weight * 50
                            else:
                                calc = magicPrice(price, magicBonus)
                                finPrice = calc + weight * 200                
                        elif magicBonus != None:
                            finPrice = magicPrice(price, magicBonus)
                        else:
                            finPrice = price
                    elif ranged:
                        data["system"]["magicalBonus"] = magicBonus
                        if magicBonus == None and "mgc" in data["system"]["properties"]:
                            data["system"]["properties"].remove("mgc")
                        if magicBonus == None:
                            finPrice = price
                        elif magicBonus == 1:
                            finPrice = (price * 10) + 100
                        else:
                            finPrice = ((price * 10) + 350) * 4**(magicBonus-1)                        
                    data["system"]["price"]["value"] = finPrice

                if (
                    data["type"] == "consumable"
                    and data["system"]["type"]["value"] == "ammo"
                ):
                    match data["system"]["type"]["subtype"]:
                        case "arrow":
                            data["system"]["weight"] = 2 / 20
                            data["system"]["price"]["value"] = 2 / 20
                            data["system"]["quantity"] = 20
                        case "blowgunNeedle":
                            data["system"]["weight"] = 0.5 / 20
                            data["system"]["price"]["value"] = 1 / 20
                            data["system"]["quantity"] = 20
                        case "crossbowBolt":
                            data["system"]["weight"] = 1 / 20
                            data["system"]["price"]["value"] = 2 / 20
                            data["system"]["quantity"] = 20
                        case "slingBullet":
                            data["system"]["weight"] = 2 / 20
                            data["system"]["price"]["value"] = 1 / 20
                            data["system"]["quantity"] = 20

            # Only update the file if the data has changed
            if data != original_data:
                data = load_and_update_json(data)
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, indent=4)

            print(f'Processed file: {filename}')
            i += 1

print("Gone through", i, "files")