import time
import json

def load_and_update_json(json_obj):
    """
    Updates the _stats field in the given JSON object.
    Fetches coreVersion and systemVersion from module.json data.
    """
    if "_stats" not in json_obj:
        json_obj["_stats"] = {}

    with open("module.json", "r") as f:
        module_data = json.load(f)
    
    json_obj["_stats"]["modifiedTime"] = int(time.time() * 1000)
    json_obj["_stats"]["lastModifiedBy"] = "code change"
    json_obj["_stats"]["coreVersion"] = module_data["compatibility"]["verified"]
    json_obj["_stats"]["systemVersion"] = next(
        (system["compatibility"]["verified"] for system in module_data["relationships"]["systems"] if system["id"] == "dnd5e"),
        "unknown"
    )
    return json_obj

if __name__ == "__main__":
    # Example usage:
    updated_json = load_and_update_json("src\packs\elkan5e-spells\spell_Arcane_Lock_fsKqUGAIN0YXi4Dm.json")
    print(json.dumps(updated_json, indent=4))