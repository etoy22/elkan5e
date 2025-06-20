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

success_items = []
other_items = []
caught_items = []

replacement_text = "<strong>Success:</strong> Half damage."
replacement_variants = [
    "<strong>Success:</strong> half damage",
    "<strong>Success:</strong> half damage.",
    "Success: half damage",
    "<strong>Success:</strong> Target takes half damage.",
    "<strong>Success:</strong> Target takes half damage.",
    "<strong>Success</strong>: Target takes half damage.​",
    "<strong>Success</strong>: Half damage.",
    "<strong>Success:</strong> Half damage.",
    "<strong>Success</strong>: Half damage.",
    "<strong>Success</strong>: Half damage",
    "<strong>Success: </strong>Half damage.",
    "<strong>Success:</strong> half damage"
]

success_keywords = [
    "<strong>Success</strong>: Target takes",
    "<strong>Success:</strong> Target takes"
]

noEffect_keywords = [
    "<strong>Success</strong>: No damage.",
    "<strong>Success</strong>: No damage.",
    "<strong>Success:</strong> No damage.",
    "<strong>Success:</strong> No effect.",
    "<strong>Success</strong>: No Effect.",
    "<strong>Success</strong>: No Effect",
    "<strong>Success:</strong> No Effect",
    "<strong>Success:</strong> Nothing",
    "<strong>Success:</strong> No extra effect."
]

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

        if "Success" not in description:
            continue

        if "scroll" in data["name"].lower() and "<p>Success: the scroll is cast. The scroll's magic fades and the ink disintegrates." in description:
            if apply_replacements:
                description = description.replace(
                    "<p>Success: the scroll is cast. The scroll's magic fades and the ink disintegrates.",
                    "<p><strong>Success:</strong> the scroll is cast. The scroll's magic fades and the ink disintegrates."
                )
            continue

        # Apply replacements for "half damage" variants
        if "half damage" in description.lower() and "Half damage, no other effect." not in description:
            if replacement_text not in description:
                success_items.append(data["name"])
            for variant in replacement_variants:
                if variant in description:
                    if apply_replacements:
                        description = description.replace(variant, replacement_text)
                        data["system"]["description"]["value"] = description  # Update the description in the data
                    caught_items.append(data["name"])
        elif any(keyword in description for keyword in [
            "Half damage, no other effect.", 
            "No effect.", 
            "<strong>Success:</strong> @UUID[Compendium.elkan5e", 
            "<strong>Success:</strong> [[/damage"
        ]):
            continue
        elif "<strong>Success</strong>: No effect," in description:
            if apply_replacements:
                description = description.replace("<strong>Success</strong>: No effect,", "<strong>Success:</strong> No effect,")
                description = description.replace("<strong>Success</strong>: No effect.", "<strong>Success:</strong> No effect,")
        elif any(keyword in description for keyword in noEffect_keywords):
            if apply_replacements:
                matched_keyword = next((keyword for keyword in noEffect_keywords if keyword in description), None)
                if matched_keyword:
                    description = description.replace(matched_keyword, "<strong>Success:</strong> No effect.")
        elif any(keyword in description for keyword in success_keywords):
            if apply_replacements:
                for keyword in success_keywords:
                    description = description.replace(keyword, "<strong>Success:</strong>")
        else:
            other_items.append(data["name"])

        # Write the updated data back to the file only if data has changed
        if apply_replacements and data != original_data:
            # Update the last modified time in the JSON file
            data = load_and_update_json(data)
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, indent=4, ensure_ascii=False)

print("Length of success_items:", len(success_items))
print("Length of caught_items:", len(caught_items))

not_caught = [item for item in success_items if item not in caught_items]
print("Items not caught:", not_caught)
print("Length of not_caught:", len(not_caught))

print("Other items:", other_items)
