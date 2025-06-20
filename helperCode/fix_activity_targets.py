import os
import json
from glob import glob

# Directory containing spell JSON files (adjust as needed)
SPELLS_DIRS = [
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'cantrip'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-1'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-2'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-3'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-4'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-5'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-6'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-7'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-8'),
    os.path.join('c:/Users/My PC/AppData/Local/FoundryVTT/Data/modules/elkan5e/packs/_source', 'elkan5e-spells', 'level-9'),
]

# The correct target structure for dnd5e activities
CORRECT_TARGET = {
    "type": "creature",
    "value": 1,
    "units": "ft",
    "width": None,
    "override": False,
    "prompt": True
}

# The correct consumption structure for dnd5e activities
CORRECT_CONSUMPTION = {
    "scaling": {"allowed": False},
    "spellSlot": True,
    "targets": []
}

LOG_PATH = os.path.join(os.path.dirname(__file__), 'fix_activity_targets.log')

def targets_equal(a, b):
    if not isinstance(a, dict) or not isinstance(b, dict):
        return False
    return (
        a.get('type') == b.get('type') and
        a.get('value') == b.get('value') and
        a.get('units') == b.get('units') and
        a.get('width') == b.get('width') and
        a.get('override') == b.get('override') and
        a.get('prompt') == b.get('prompt')
    )

def fix_activity_targets_in_file(filepath, log_entries):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changed = False
    system = data.get('system', {})
    activities = system.get('activities', {})
    for act_key, activity in activities.items():
        # Fix target
        target = activity.get('target')
        if not targets_equal(target, CORRECT_TARGET):
            old_target = json.dumps(target, ensure_ascii=False)
            activity['target'] = CORRECT_TARGET.copy()
            changed = True
            log_entries.append(f"{filepath} | activity: {act_key} | old_target: {old_target}")
        # Fix consumption
        consumption = activity.get('consumption')
        if not isinstance(consumption, dict):
            activity['consumption'] = CORRECT_CONSUMPTION.copy()
            changed = True
            log_entries.append(f"{filepath} | activity: {act_key} | fixed missing consumption")
        else:
            if 'targets' not in consumption or not isinstance(consumption['targets'], list):
                activity['consumption']['targets'] = []
                changed = True
                log_entries.append(f"{filepath} | activity: {act_key} | fixed missing/invalid consumption.targets")

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Fixed: {filepath}")


def main():
    log_entries = []
    for spells_dir in SPELLS_DIRS:
        if not os.path.isdir(spells_dir):
            continue
        for filepath in glob(os.path.join(spells_dir, '*.json')):
            fix_activity_targets_in_file(filepath, log_entries)
    if log_entries:
        with open(LOG_PATH, 'w', encoding='utf-8') as logf:
            logf.write('\n'.join(log_entries))
        print(f"Log written to {LOG_PATH}")
    else:
        print("No changes logged.")

if __name__ == '__main__':
    main()
