import os
import json

folders = [
    'src\packs\elkan5e-spells', 
]

spells = [[] for _ in range(10)]
notSpells = [[] for _ in range(10)]
for folder in folders:
    for file_name in os.listdir(folder):
        if not file_name.endswith('.json'):
            continue
        file_path = os.path.join(folder, file_name)
        
        # Load the JSON file
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        if data["type"] == 'spell':
            description = data.get("system", {}).get("description", {}).get("value", "")

            # Check for <em> in the first paragraph
            description_parts = description.split("<p>")
            if len(description_parts) > 1:
                first_paragraph = description_parts[1]
                if "<em>" in first_paragraph:
                    spells[data["system"]["level"]].append(data["name"])
                    chat = "<p>".join(description.split("<p>")[2:])  # Remove the first line
                else:
                    notSpells[data["system"]["level"]].append(data["name"])
                    chat = ''  # Remove the description
            else:
                notSpells[data["system"]["level"]].append(data["name"])
                chat = ''  # Remove the description
        
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)



# for level in range(len(spells)):  # Loop through levels all Spells
#     print(f"Level {level} Spells with Italized text: {len(spells[level])}")
#     for spell in spells[level]:
#         print(f" - {spell}")

for level in range(4):  # Loop through levels 0 to 5
    print(f"Level {level} Not Spells without Italized text: {len(notSpells[level])}")
    for spell in notSpells[level]:
        print(f" - {spell}")


# # Example input for testing
# test_description = """
# <p><em>You dab your hand on a wet adder's stomach stuffed with rhubarb leaves. When you then point at your target and speak the magic command phrase, a shimmering green arrow streaks toward them and bursts in a spray of acid.</em></p>
# <p><strong>Ranged Spell Attack</strong></p>
# <ul>
#     <li>
#         <p><strong>Hit</strong>: Target takes [[/damage 4d4 acid]] damage* immediately and [[/damage 4d4 acid]] damage* at the end of their next turn.</p>
#     </li>
#     <li>
#         <p><strong>Miss:</strong> [[/damage 2d4 acid]] initial damage, no damage on your next turn.</p>
#     </li>
# </ul>
# <p></p>
# <div class="rd__b  rd__b--3">
#     <div class="rd__b  rd__b--3">
#         <p><strong>*Upcasting</strong>: Increase initial damage and damage on target's next turn by [[/damage 1d4 acid]] for each spell level above 2nd.</p>
#     </div>
# </div>
# """

# Check if the test description contains italicized text in the first paragraph
# first_paragraph = test_description.split("<p>")[0]  # Extract the first paragraph
# if "<em>" in first_paragraph:
#     print("The first paragraph contains italicized text.")
# else:
#     print("The first paragraph does not contain italicized text.")