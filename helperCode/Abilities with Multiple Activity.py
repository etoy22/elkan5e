import os
import json

OUTPUT_DIR = os.path.join(".", "helperCode", "logs")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "multiple_activities.txt")

def iter_json_files(root_folder):
    for root, dirnames, files in os.walk(root_folder):
        if "node_modules" in dirnames:
            dirnames.remove("node_modules")
        if "node_modules" in os.path.normpath(root).split(os.sep):
            continue
        for file in files:
            if file.endswith(".json"):
                path = os.path.join(root, file)
                if "node_modules" in os.path.normpath(path).split(os.sep):
                    continue
                yield path

def load_json_safely(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def main(root_folder="./"):
    names_with_counts = {}

    for path in iter_json_files(root_folder):
        data = load_json_safely(path)
        if not isinstance(data, dict):
            continue
        activities = data.get("system", {}).get("activities", {})
        if isinstance(activities, dict) and len(activities) > 1:
            names_with_counts[data.get("name", "Unknown")] = len(activities)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        if names_with_counts:
            for name in sorted(names_with_counts.keys()):
                f.write(f"{name} — {names_with_counts[name]} activities\n")

    print(f"✅ Wrote {len(names_with_counts)} entries to {OUTPUT_FILE}")

if __name__ == "__main__":
    main("./")
