import os
import json
import time

# Top-level folders to walk through
folder_paths = [
    'packs\\_source\\elkan5e-ancestries',
    'packs\\_source\\elkan5e-backgrounds',
    'packs\\_source\\elkan5e-class',
    'packs\\_source\\elkan5e-class-features',
    'packs\\_source\\elkan5e-creature-features',
    'packs\\_source\\elkan5e-creatures',
    'packs\\_source\\elkan5e-equipment',
    'packs\\_source\\elkan5e-feats',
    'packs\\_source\\elkan5e-lore',
    'packs\\_source\\elkan5e-macros',
    'packs\\_source\\elkan5e-magic-items',
    'packs\\_source\\elkan5e-roll-tables',
    'packs\\_source\\elkan5e-rules',
    'packs\\_source\\elkan5e-spells',
    'packs\\_source\\elkan5e-subclass',
    'packs\\_source\\elkan5e-summoned-creatures'
]

log_file_path = "helperCode\\logs\\remove_data.txt"
os.makedirs(os.path.dirname(log_file_path), exist_ok=True)

# Keys to remove deeply
keys_to_remove = [
    "system",
    "betterRolls5e",
    "favtab",
    "exportSource",
    "mess",
    "enhanced-terrain-layer",
    "srd5e"
]

def deep_clean(obj):
    """Recursively remove keys from dicts/lists."""
    if isinstance(obj, dict):
        for key in list(obj.keys()):
            if key in keys_to_remove:
                del obj[key]
            else:
                obj[key] = deep_clean(obj[key])
    elif isinstance(obj, list):
        return [deep_clean(item) for item in obj]
    return obj

def update_last_modified(data):
    if "flags" not in data:
        data["flags"] = {}
    if "core" not in data["flags"]:
        data["flags"]["core"] = {}
    data["flags"]["core"]["sourceId"] = data.get("flags", {}).get("core", {}).get("sourceId", "")
    data["flags"]["core"]["lastModified"] = int(time.time() * 1000)
    return data

processed_files = 0
log_lines = []

for root_folder in folder_paths:
    if not os.path.exists(root_folder):
        print(f"Skipping missing folder: {root_folder}")
        continue

    for dirpath, _, filenames in os.walk(root_folder):
        for filename in filenames:
            if not filename.endswith('.json'):
                continue

            file_path = os.path.join(dirpath, filename)

            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                continue

            cleaned = deep_clean(data)
            cleaned = update_last_modified(cleaned)

            try:
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(cleaned, file, indent=4)
                log_lines.append(f"Processed: {file_path}")
                print(f"Processed file: {file_path}")
                processed_files += 1
            except Exception as e:
                print(f"Error writing {file_path}: {e}")

# Write log
with open(log_file_path, 'w', encoding='utf-8') as log_file:
    log_file.write("\n".join(log_lines))

print(f"\n✅ Gone through {processed_files} files.")
print(f"📄 Log written to: {log_file_path}")
