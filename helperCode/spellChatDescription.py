import os
import json
from htmlSimplifier import simplify_html  # Import the simplify_html function
from updateTime import load_and_update_json  # Import the helper function

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

#Add class features that are spells
spells = [[] for _ in range(10)]
notSpells = [[] for _ in range(10)]
for folder in folders:
    for file_name in os.listdir(folder):
        if not file_name.endswith('.json'):
            continue
        file_path = os.path.join(folder, file_name)
        
        # Load the JSON file
        with open(file_path, 'r', encoding='utf-8') as file:
            original_data = json.load(file)
        
        data = original_data.copy()  # Create a copy to track changes
            
        description = data.get("system", {}).get("description", {}).get("value", "")

        if description:  # Only simplify and update if description exists
            # Simplify the HTML in the description
            simplified_description = simplify_html(description)
            data["system"]["description"]["value"] = simplified_description

        # Check for <em> in the first non-empty paragraph
        if data.get("type", "").strip().lower() == 'spell':  # Ensure type is explicitly "spell"
            description_parts = simplified_description.split("<p>")
            first_paragraph = next((part for part in description_parts if part.strip()), "")
            if "<em>" in first_paragraph:
                spells[data["system"]["level"]].append(data["name"])
                # Exclude the first paragraph containing <em> when constructing chat
                chat_parts = [part for part in description_parts[1:] if "<em>" not in part]
                chat = "<p>".join(chat_parts) if chat_parts else ""
            else:
                notSpells[data["system"]["level"]].append(data["name"])
                chat = ''  # Remove the description

            # Assign the calculated chat value back to the JSON data
            data["system"]["description"]["chat"] = chat

        # Update the last modified time in the JSON file only if data has changed
        if data != original_data:
            data = load_and_update_json(data)
            # Save the updated JSON file
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, indent=4, ensure_ascii=False)


for level in range(4):  # Loop through levels 0 to 5
    print(f"Level {level} Not Spells without Italized text: {len(notSpells[level])}")
    for spell in notSpells[level]:
        print(f" - {spell}")

for level in range(4):  # Loop through levels 0 to 5
    print(f"Level {level} Not Spells without Italized text: {len(spells[level])}")
    for spell in spells[level]:
        print(f" - {spell}")
