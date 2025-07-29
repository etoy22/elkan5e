import os
import json
import pandas as pd

# TODO: Work on later

# Utility for safe integer conversion
def safe_int(val):
    if val is None or val == '':
        return 0
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0

# Directory to scan
SPELLS_DIR = os.path.join(os.path.dirname(__file__), '..', 'packs', '_source', 'elkan5e-spells')
EXCLUDE_FOLDERS = {'spell-components', 'spells-class-specific-versions'}
LOGS_DIR = os.path.join(os.path.dirname(__file__), 'logs')
EXCEL_PATH = os.path.join(LOGS_DIR, 'spell_stats.xlsx')

def find_spell_files(base_dir):
    spell_files = []
    spell_name_to_path = {}
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_FOLDERS]
        for file in files:
            if file.endswith('.json'):
                path = os.path.join(root, file)
                spell_files.append(path)
                # Try to get spell name from JSON
                try:
                    with open(path, encoding='utf-8') as f:
                        data = json.load(f)
                    if data.get('type') == 'spell':
                        spell_name = data.get('name')
                        if spell_name:
                            spell_name_to_path[spell_name] = path
                except Exception:
                    continue
    return spell_files, spell_name_to_path

# Extract stats from a spell JSON
import re
def estimate_formula(formula):
    # DnD average: (XdY+Z) = X*(Y+1)/2 + Z
    formula = formula.replace(' ', '')
    match = re.match(r"\(?([0-9]+)d([0-9]+)\+([0-9]+)\)\*([0-9]+)", formula)
    if match:
        dice = int(match.group(1))
        denom = int(match.group(2))
        bonus = int(match.group(3))
        mult = int(match.group(4))
        avg_per_die = (denom + 1) / 2
        return mult * (dice * avg_per_die + bonus)
    match = re.match(r"([0-9]+)d([0-9]+)\+([0-9]+)", formula)
    if match:
        dice = int(match.group(1))
        denom = int(match.group(2))
        bonus = int(match.group(3))
        avg_per_die = (denom + 1) / 2
        return dice * avg_per_die + bonus
    match = re.match(r"([0-9]+)d([0-9]+)", formula)
    if match:
        dice = int(match.group(1))
        denom = int(match.group(2))
        avg_per_die = (denom + 1) / 2
        return dice * avg_per_die
    try:
        return float(formula)
    except:
        return 0

# Updated `extract_spell_stats` function with range, damage type, duration, and concentration extraction

def extract_spell_stats(spell_path):
    def safe_int(val):
        if val is None or val == '':
            return 0
        try:
            return int(val)
        except (TypeError, ValueError):
            return 0

    try:
        with open(spell_path, encoding='utf-8') as f:
            try:
                data = json.load(f)
            except Exception as e:
                return {'name': os.path.basename(spell_path), 'error': f'JSON decode error: {str(e)}'}

        if data.get('type') != 'spell':
            return None

        system = data.get('system', {})
        activities = system.get('activities', {})
        damage_values = []
        damage_dice_counts = []
        damage_dice_values = []
        damage_avg_parts = []
        save_values = []
        save_dice_counts = []
        save_dice_values = []
        attack_values = []
        attack_dice_counts = []
        attack_dice_values = []
        save_count = 0
        attack_count = 0
        save_values_with_effects = []
        save_values_without_effects = []
        attack_values_with_effects = []
        attack_values_without_effects = []

        for act in activities.values():
            dmg = act.get('damage', {}).get('parts', [])
            has_effects = bool(act.get('effects', []))
            for part in dmg:
                dice = safe_int(part.get('number', 0))
                denom = safe_int(part.get('denomination', 0))
                formula = part.get('custom', {}).get('formula', '')
                if formula and part.get('custom', {}).get('enabled', False):
                    avg = estimate_formula(formula)
                    val = avg
                else:
                    avg = dice * ((denom + 1) / 2)
                    val = dice * denom
                damage_values.append(val)
                if act.get('type') not in ['save', 'attack']:
                    damage_dice_counts.append(dice)
                    damage_dice_values.append(denom)
                    damage_avg_parts.append(avg)

            if act.get('type') == 'save':
                save_count += 1
                for part in act.get('damage', {}).get('parts', []):
                    dice = safe_int(part.get('number', 0))
                    denom = safe_int(part.get('denomination', 0))
                    formula = part.get('custom', {}).get('formula', '')
                    if formula and part.get('custom', {}).get('enabled', False):
                        val = estimate_formula(formula)
                    else:
                        val = dice * ((denom + 1) / 2)
                    save_values.append(val)
                    save_dice_counts.append(dice)
                    save_dice_values.append(denom)
                    if has_effects:
                        save_values_with_effects.append(val)
                    else:
                        save_values_without_effects.append(val)

            if act.get('type') == 'attack':
                attack_count += 1
                for part in act.get('damage', {}).get('parts', []):
                    dice = safe_int(part.get('number', 0))
                    denom = safe_int(part.get('denomination', 0))
                    formula = part.get('custom', {}).get('formula', '')
                    if formula and part.get('custom', {}).get('enabled', False):
                        val = estimate_formula(formula)
                    else:
                        val = dice * ((denom + 1) / 2)
                    attack_values.append(val)
                    attack_dice_counts.append(dice)
                    attack_dice_values.append(denom)
                    if has_effects:
                        attack_values_with_effects.append(val)
                    else:
                        attack_values_without_effects.append(val)

        # Ritual detection: check system.properties for 'ritual'
        ritual = False
        props = system.get('properties', [])
        if isinstance(props, list) and 'ritual' in props:
            ritual = True

        # Damage types
        damage_types = sorted({
            part.get('type', {}).get('value')
            for act in activities.values()
            for part in act.get('damage', {}).get('parts', [])
            if part.get('type', {}).get('value')
        })

        # Duration
        duration = f"{system.get('duration', {}).get('value', '')} {system.get('duration', {}).get('units', '')}".strip() or None

        # Concentration
        concentration = bool(system.get('concentration', False))

        return {
            'name': data.get('name'),
            'level': system.get('level'),
            'school': system.get('school'),
            'damage values': sum(damage_values) if damage_values else None,
            'damage dice count': ','.join(str(x) for x in damage_dice_counts) if damage_dice_counts else None,
            'damage dice value': ','.join(str(x) for x in damage_dice_values) if damage_dice_values else None,
            'average damage': round(sum(damage_avg_parts)/max(1,len(damage_avg_parts)),2) if damage_avg_parts else None,
            'save count': save_count,
            'attack count': attack_count,
            'activation': system.get('activation', {}).get('type', None),
            'ritual': ritual,
            'range': system.get('range', {}).get('value', None),
            'damage type': ', '.join(damage_types) if damage_types else None,
            'duration': duration,
            'concentration': concentration,
            'average damage save with effects': round(sum(save_values_with_effects)/max(1,len(save_values_with_effects)),2) if save_values_with_effects else None,
            'average damage save without effects': round(sum(save_values_without_effects)/max(1,len(save_values_without_effects)),2) if save_values_without_effects else None,
            'average damage attack with effects': round(sum(attack_values_with_effects)/max(1,len(attack_values_with_effects)),2) if attack_values_with_effects else None,
            'average damage attack without effects': round(sum(attack_values_without_effects)/max(1,len(attack_values_without_effects)),2) if attack_values_without_effects else None
        }

    except Exception as e:
        return {'name': os.path.basename(spell_path), 'error': str(e)}

# Main logic
if __name__ == '__main__':
    spell_files, spell_name_to_path = find_spell_files(SPELLS_DIR)
    stats = []
    error_spells = []
    for spell_path in spell_files:
        stat = extract_spell_stats(spell_path)
        if stat:
            if 'error' in stat:
                error_spells.append(stat)
            else:
                stats.append(stat)
    df = pd.DataFrame(stats)
    os.makedirs(LOGS_DIR, exist_ok=True)
    # Log errors
    if error_spells:
        with open(os.path.join(LOGS_DIR, 'spell_errors.log'), 'w', encoding='utf-8') as f:
            for err in error_spells:
                f.write(f"{err['name']}: {err['error']}\n")

    # Tab 1: Level | Count | Abjuration | Conjuration | Divination | Enchantment | Evocation | Illusion | Necromancy | Transmutation | Average Damage | Count Save | Average Damage Save | Count Attack | Average Damage Attack | Avg Dmg Save w/o Effects | Avg Dmg Save w/ Effects | Avg Dmg Attack w/o Effects | Avg Dmg Attack w/ Effects
    schools = ['abj', 'con', 'div', 'enc', 'evo', 'ill', 'nec', 'trs']
    school_map = {
        'abj': 'Abjuration',
        'con': 'Conjuration',
        'div': 'Divination',
        'enc': 'Enchantment',
        'evo': 'Evocation',
        'ill': 'Illusion',
        'nec': 'Necromancy',
        'trs': 'Transmutation'
    }
    level_stats = {}
    other_spells_count = {}
    activation_types = set()
    for _, row in df.iterrows():
        act_type = row.get('activation', '')
        if act_type:
            activation_types.add(act_type)

    for _, row in df.iterrows():
        lvl = row['level'] if row['level'] is not None else 'Unknown'
        if lvl not in level_stats:
            level_stats[lvl] = {'Count': 0}
            for s in schools:
                level_stats[lvl][school_map[s]] = 0
            level_stats[lvl]['Average Damage'] = []
            level_stats[lvl]['Average Damage With Effects'] = []
            level_stats[lvl]['Average Damage Without Effects'] = []
            level_stats[lvl]['Save Count'] = 0
            level_stats[lvl]['Attack Count'] = 0
            for act_type in activation_types:
                level_stats[lvl][f'Activation: {act_type}'] = 0
            other_spells_count[lvl] = 0
        level_stats[lvl]['Count'] += 1
        school = row['school']
        if school in school_map:
            level_stats[lvl][school_map[school]] += 1
        # Only use 'average damage' for summary
        avg_dmg = row.get('average damage', '')
        if isinstance(avg_dmg, (int, float)) and avg_dmg and avg_dmg != 0:
            level_stats[lvl]['Average Damage'].append(avg_dmg)
        # Effects split
        avg_dmg_with = row.get('average damage attack with effects', '')
        if isinstance(avg_dmg_with, (int, float)) and avg_dmg_with and avg_dmg_with != 0:
            level_stats[lvl]['Average Damage With Effects'].append(avg_dmg_with)
        avg_dmg_without = row.get('average damage attack without effects', '')
        if isinstance(avg_dmg_without, (int, float)) and avg_dmg_without and avg_dmg_without != 0:
            level_stats[lvl]['Average Damage Without Effects'].append(avg_dmg_without)
        # Save/Attack counts
        level_stats[lvl]['Save Count'] += row.get('save count', 0) if isinstance(row.get('save count', 0), int) else safe_int(row.get('save count', 0))
        level_stats[lvl]['Attack Count'] += row.get('attack count', 0) if isinstance(row.get('attack count', 0), int) else safe_int(row.get('attack count', 0))
        # Activation counts
        act_type = row.get('activation', '')
        if act_type in activation_types:
            level_stats[lvl][f'Activation: {act_type}'] += 1
        # Count non-damage spells
        if not row.get('damage values', ''):
            other_spells_count[lvl] += 1
    # --- Tab 1: Level & School Stats ---
    # Add Ritual Count to level_stats
    ritual_counts = {}
    for _, row in df.iterrows():
        lvl = row['level'] if row['level'] is not None else 'Unknown'
        if lvl not in ritual_counts:
            ritual_counts[lvl] = 0
        if 'ritual' in row and row['ritual']:
            ritual_counts[lvl] += 1

    # Sort levels numerically, Unknown last
    def level_sort_key(lvl):
        try:
            return (int(lvl), '')
        except:
            return (99, lvl)
    sorted_levels = sorted(level_stats.keys(), key=level_sort_key)

    tab1_rows = []
    for lvl in sorted_levels:
        vals = level_stats[lvl]
        row = {
            'Level': lvl,
            'Count': vals['Count'],
            'Abjuration': vals['Abjuration'],
            'Conjuration': vals['Conjuration'],
            'Divination': vals['Divination'],
            'Enchantment': vals['Enchantment'],
            'Evocation': vals['Evocation'],
            'Illusion': vals['Illusion'],
            'Necromancy': vals['Necromancy'],
            'Transmutation': vals['Transmutation'],
            'Average Damage': round(sum(vals['Average Damage'])/max(1,len(vals['Average Damage'])),2) if vals['Average Damage'] else '',
            'Average Damage With Effects': round(sum(vals['Average Damage With Effects'])/max(1,len(vals['Average Damage With Effects'])),2) if vals['Average Damage With Effects'] else '',
            'Average Damage Without Effects': round(sum(vals['Average Damage Without Effects'])/max(1,len(vals['Average Damage Without Effects'])),2) if vals['Average Damage Without Effects'] else '',
            'Save Count': vals['Save Count'],
            'Attack Count': vals['Attack Count'],
            'Other Spells Count': other_spells_count[lvl],
            'Ritual Count': ritual_counts.get(lvl, 0)
        }
        for act_type in activation_types:
            row[f'Activation: {act_type}'] = vals[f'Activation: {act_type}']
        tab1_rows.append(row)
    tab1_df = pd.DataFrame(tab1_rows)

    # --- Tab 2: School Activation Stats ---
    # Find all activation types present in spells
    activation_types = set()
    for row in stats:
        act_type = row.get('activation', '')
        if act_type:
            activation_types.add(act_type)
    activation_types = sorted(list(activation_types))

    tab2_rows = []
    for s in schools:
        school_spells = [row for row in stats if row['school'] == s]
        school_count = len(school_spells)
        ritual_count = sum(1 for row in school_spells if row['ritual'])
        all_attack_with_effects = []
        all_attack_without_effects = []
        for row in school_spells:
            spell_name = row.get('name')
            spell_path = spell_name_to_path.get(spell_name)
            if spell_path:
                try:
                    with open(spell_path, encoding='utf-8') as f:
                        data = json.load(f)
                    if data.get('type') != 'spell':
                        continue
                    system = data.get('system', {})
                    activities = system.get('activities', {})
                    for act in activities.values():
                        dmg = act.get('damage', {}).get('parts', [])
                        has_effects = bool(act.get('effects', []))
                        for part in dmg:
                            dice = safe_int(part.get('number', 0))
                            denom = safe_int(part.get('denomination', 0))
                            formula = part.get('custom', {}).get('formula', '')
                            if formula and part.get('custom', {}).get('enabled', False):
                                val = estimate_formula(formula)
                            else:
                                val = dice * ((denom + 1) / 2)
                            if act.get('type') == 'attack':
                                if has_effects and val:
                                    all_attack_with_effects.append(val)
                                elif not has_effects and val:
                                    all_attack_without_effects.append(val)
                except Exception:
                    continue
        avg_dmg_list = [row['average damage'] for row in school_spells if isinstance(row['average damage'], (int, float)) and row['average damage'] and row['average damage'] != 0]
        avg_dmg = round(sum(avg_dmg_list)/max(1,len(avg_dmg_list)),2) if avg_dmg_list else ''
        valid_attack_with_effects = [v for v in all_attack_with_effects if isinstance(v, (int, float)) and v != 0]
        valid_attack_without_effects = [v for v in all_attack_without_effects if isinstance(v, (int, float)) and v != 0]
        avg_dmg_with = round(sum(valid_attack_with_effects)/max(1,len(valid_attack_with_effects)),2) if valid_attack_with_effects else ''
        avg_dmg_without = round(sum(valid_attack_without_effects)/max(1,len(valid_attack_without_effects)),2) if valid_attack_without_effects else ''
        row_dict = {
            'School': school_map[s],
            'Count': school_count,
            'Ritual Count': ritual_count,
            'Average Damage': avg_dmg,
            'Average Damage With Effects': avg_dmg_with,
            'Average Damage Without Effects': avg_dmg_without
        }
        for act_type in activation_types:
            row_dict[f'Activation: {act_type}'] = sum(1 for row in school_spells if row.get('activation', None) == act_type)
        tab2_rows.append(row_dict)
    tab2_df = pd.DataFrame(tab2_rows)

    # Remove Save/Attack dice/value columns from Raw Data
    drop_cols = [
        'save values', 'save dice count', 'save dice value',
        'attack values', 'attack dice count', 'attack dice value'
    ]
    for col in drop_cols:
        if col in df.columns:
            df = df.drop(columns=[col])
    # Format Raw Data columns
    formatted_cols = [col.replace('_', ' ').title() for col in df.columns]
    df.columns = formatted_cols
    print('Raw Data columns:', df.columns.tolist())
    # Write to CSV files
    raw_csv = os.path.join(LOGS_DIR, 'spell_stats_raw.csv')
    tab1_csv = os.path.join(LOGS_DIR, 'spell_stats_level_school.csv')
    tab2_csv = os.path.join(LOGS_DIR, 'spell_stats_school_activation.csv')
    df.to_csv(raw_csv, index=False)
    tab1_df.to_csv(tab1_csv, index=False)
    tab2_df.to_csv(tab2_csv, index=False)
    print(f"Spell stats written to CSV files in {LOGS_DIR} ({len(df)} spells)")
