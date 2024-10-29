import os
import json

# Define the folder containing the JSON files
folder_paths = [
    'src\packs\elkan5e-equipment', 
    'src\packs\elkan5e-magic-items'
]

def magicPrice (price,magicBonus):
    price = (price * 10) + 350
    if magicBonus != 1:
        price = price * 4**(magicBonus-1)
    return price
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
                    
                    # Takes the base item and assigns values to it based on that base item
                    match data["system"]["type"]["baseItem"]:
                        case 'battleaxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] =  ["slashing"]
                            data["system"]["damage"]["versatile"]["number"] =  1
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] =  ["slashing"]
                            weight = 4
                            price = 12
                        case 'blowgun':
                            data["system"]["damage"]["base"]["number"] = None
                            data["system"]["damage"]["base"]["denomination"] = None
                            data["system"]["damage"]["base"]["custom"]["enabled"] = False
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"                           
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["magicalBonus"] = 0
                            data["system"]["properties"]= ["amm","hvy","two"]
                            weight = 0
                            price = 10
                        case 'club':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            weight = 2
                            price = 1
                        case 'dagger':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 1
                            price = 2
                        case 'dart':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["quantity"] = 20
                            weight = 3
                            price = 5
                        case 'glaive':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            weight = 4
                            price = 25
                        case 'greataxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "12"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            weight = 5
                            price = 40
                        case 'greatclub':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            weight = 5
                            price = 10
                        case 'greatsword':
                            data["system"]["damage"]["base"]["number"] = "2"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            weight = 4
                            price = 50
                        case 'halberd':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing","slashing"]
                            weight = 4
                            price = 30
                        case 'handaxe':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            weight = 2
                            price = 5
                        case 'handcrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 0
                            price = 40
                        case 'heavycrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 0
                            price = 50
                        case 'javelin':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 1
                            price = 5
                        case 'lance':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "12"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 4
                            price = 20
                        case 'lightcrossbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 0
                            price = 25
                        case 'lighthammer':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            weight = 2
                            price = 2
                        case 'longbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 0
                            price = 50
                        case 'longsword':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] = ["slashing"]
                            weight = 3
                            price = 15
                        case 'mace':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            weight = 3
                            price = 5
                        case 'maul':
                            data["system"]["damage"]["base"]["number"] = "2"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            weight = 6
                            price = 40
                        case 'morningstar':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] = ["piercing"]
                            weight = 4
                            price = 15
                        case 'pike':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "10"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["weight"]["value"] = 8
                            weight = 2
                            price = 20
                        case 'quarterstaff':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            weight = 4
                            price = 5
                        case 'rapier':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 2
                            price = 25
                        case 'scimitar':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            weight = 3
                            price = 15
                        case 'shortbow':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            weight = 0
                            price = 25
                        case 'shortsword':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            weight = 2
                            price = 10
                        case 'sickle':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            weight = 2
                            price = 1
                        case 'sling':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["weight"]["value"] = 1
                            weight = 0
                            price = 5
                        case 'spear':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "6"
                            data["system"]["damage"]["base"]["types"] = ["piercing"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "8"
                            data["system"]["damage"]["versatile"]["types"] = ["piercing"]
                            weight = 1
                            price = 5
                        case 'warhammer':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "8"
                            data["system"]["damage"]["base"]["types"] = ["bludgeoning"]
                            data["system"]["damage"]["versatile"]["number"] = "1"
                            data["system"]["damage"]["versatile"]["denomination"] = "10"
                            data["system"]["damage"]["versatile"]["types"] = ["bludgeoning"]
                            data["system"]["weight"]["value"] = 4
                            weight = 4
                            price = 15
                        case 'whip':
                            data["system"]["damage"]["base"]["number"] = "1"
                            data["system"]["damage"]["base"]["denomination"] = "4"
                            data["system"]["damage"]["base"]["types"] = ["slashing"]
                            price = 15
                    

                    finPrice = 0
                    if weight > 0:
                        data["system"]["magicalBonus"] = magicBonus
                        # Calculate pricing on weapons
                        if "Silvered" in data["name"]:
                            if magicBonus == None:
                                finPrice = price + weight
                            else:
                                calc = magicPrice(price,magicBonus)
                                finPrice = calc + weight * 100
                        elif "Cold Iron" in data["name"]:
                            if magicBonus == None:
                                finPrice = price + 50 + weight * 10
                            else:
                                calc = magicPrice(price,magicBonus)
                                finPrice = calc + 50 + weight * 40
                        elif "Adamantine" in data["name"]:
                            if magicBonus == None:
                                finPrice = price + weight * 50
                            else:
                                calc = magicPrice(price,magicBonus)
                                finPrice = calc + weight * 200                
                        elif (magicBonus != None):
                            finPrice = magicPrice (price,magicBonus)
                        else:
                            finPrice = price
                    elif weight == 0:
                        data["system"]["magicalBonus"] = 0
                        data["system"]["damage"]["base"]["bonus"] = magicBonus
                        activity = next(iter(data["system"]["activities"].values()))
                        activity["attack"]["bonus"] = magicBonus
                        if magicBonus != None and data["system"]["properties"] != None and "mgc" in data["system"]["properties"]:
                            data["system"]["properties"] = data["system"]["properties"].remove("mgc")
                        if magicBonus == None:
                            finPrice = price
                        elif magicBonus == 1:
                            finPrice = (price * 10) + 100
                        else:
                            finPrice = ((price * 10) + 350) * 4**(magicBonus-1)
                    else:
                        print("HERE")

                        
                        
                    data["system"]["price"]["value"] = finPrice
                    
                    
                                 
                if data["type"] == "consumable":
                    if data["system"]["type"]["value"] == "ammo":
                        match data["system"]["type"]["subtype"]:
                            case "arrow":
                                pass
                            case "blowgunNeedle":
                                pass
                            case "crossbowBolt":
                                pass
                            case "slingBullet":
                                pass




            with open(file_path, 'w') as file:
                json.dump(data, file, indent=4)

            print(f'Processed file: {filename}')
            i+= 1

print("Gone through", i, "files")
print("Equipment",sorted(equipment))
print("Weapons",sorted(weapons))
print("No Base Item",no_name)