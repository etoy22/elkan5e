import os
import json

# folder_paths = [
#     'src\packs\elkan5e-ancestries',
#     'src\packs\elkan5e-backgrounds',
#     'src\packs\elkan5e-class',
#     'src\packs\elkan5e-class-features',
#     'src\packs\elkan5e-creature-features',
#     'src\packs\elkan5e-creatures',
#     'src\packs\elkan5e-equipment',
#     'src\packs\elkan5e-feats',
#     'src\packs\elkan5e-lore',
#     'src\packs\elkan5e-macros',
#     'src\packs\elkan5e-magic-items',
#     'src\packs\elkan5e-roll-tables',
#     'src\packs\elkan5e-rules',
#     'src\packs\elkan5e-spells',
#     'src\packs\elkan5e-subclass',
#     'src\packs\elkan5e-summoned-creatures'
# ]

# elements_with_div = []  # List to store elements containing <div in system.description.value
# elements_with_span = []  # List to store elements containing <span in system.description.value

# for folder_path in folder_paths:
#     for filename in os.listdir(folder_path):
#         if filename.endswith('.json'):
#             file_path = os.path.join(folder_path, filename)

#             # Load the JSON file
#             try:
#                 with open(file_path, 'r', encoding='utf-8') as file:
#                     data = json.load(file)
#             except json.JSONDecodeError as e:
#                 print(f"Error decoding JSON in file {file_path}: {e}")
#                 continue


file_path = 'src\\packs\\elkan5e-spells\\spell_Well_of_Corruption_cHIuORdoA1WnHfmK.json'

# Load the JSON file
try:
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
        example = data.get("system", {}).get("description", {}).get("value", "")
except json.JSONDecodeError as e:
    print(f"Error decoding JSON in file {file_path}: {e}")
    example = ""


skills = ["acr", "ani", "arc", "ath", "dec", "his", "ins", "itm", "inv",
    "med", "nat", "prc", "prf", "per", "rel", "slt", "ste", "sur"]
skill_labels = ["acrobatics", "animal handling", "arcana", "athletics", "deception",
    "history", "insight", "intimidation", "investigation", "medicine",
    "nature", "perception", "performance", "persuasion", "religion",
    "sleight of hand", "stealth", "survival"]
conditions = [
    "blinded", "charmed", "concentrating", "confused", "cursed", "dazed",
    "deafened", "diseased", "drained", "exhaustion", "frightened", "goaded",
    "grappled", "half cover", "hasted", "heavily obscured", "incapacitated",
    "invisible", "lightly obscured", "paralyzed", "petrified", "poisoned",
    "prone", "restrained", "silenced", "siphoned", "slowed", "stunned",
    "surprised", "three quarters cover", "transformed", "unconscious", "weakened"
]
condition_labels = ["halfcover", "heavilyobscured", "lightlyobscured", "threequarterscover"]
creature_labels = ["aberration", "beast", "celestial", "construct", "dragon", "elemental", "fey", "fiend", "giant", "humanoid", "monstrosity", "ooze", "plant", "undead"]
damage_types = ["acid", "bludgeoning", "cold", "lightning", "fire", "force", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"]
schools_of_magic = ["abj", "con", "div", "enc", "evo", "ill", "nec", "trs"]
school_labels = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"]
rules = [
    "attack", "opportunityattacks", "dodge", "dash", "disengage", 
    "help", "hide", "ready", "search", "surprise", 
    "unarmedstrike", "twoweaponfighting", "spellSlots", "spellLevel",
    "cantrips", "upcasting", "castingAtHigherLevel", "multipleSpellsInATurn",
    "duplicateMagicalEffects", "lineOfSight", "coverAndWalls", "castingInArmor",
    "castingTime", "spellTargets", "spellRange", "verbal", "spellDuration",
    "illusoryImages", "knownSpells", "preparedSpells", "abilitySpells",
    "focusSpells", "spellScroll", "cursed", "material", "ritual", "vocal", "somatic"
]

refereneces = skills + skill_labels + conditions + condition_labels + creature_labels + damage_types + schools_of_magic + school_labels + rules

start_indices = [i for i in range(len(example)) if example.startswith("<ul>", i)]
end_indices = [i for i in range(len(example)) if example.startswith("</ul>", i)]
p_start_indices = [i for i in range(len(example)) if example.startswith("<p>", i)]
p_end_indices = [i for i in range(len(example)) if example.startswith("</p>", i)]

ULcomb = list(zip(start_indices, end_indices))
Pcomb = list(zip(p_start_indices, p_end_indices))

cut = []
for p_start, p_end in Pcomb:
    if not any(ul_start < p_start < ul_end and ul_start < p_end < ul_end for ul_start, ul_end in ULcomb):
        cut.append((p_start, p_end))

cut.extend(ULcomb)
cut.sort()

# print("Cut ranges:", cut)

splices = []
for start, end in cut:
    splices.append(example[start:end + 5])  # Include the closing tag

# print("Splices:", splices)

for ref in refereneces:
    for i, splice in enumerate(splices):
        if ref.lower() in splice.lower():
            if f"&amp;reference[{ref}]" in splice or f"{ref}]]" in splice:
                print(f"Reference '{ref}' already contains '&amp;reference[{ref}]' in splice {i}, skipping.")
                continue

            print(f"Reference '{ref}' located at index {splice.lower().find(ref.lower())} in splice {i}")
            splices[i] = splice.replace(ref, f"&amp;reference[{ref}]", 1)
            # Here you can add your logic to handle the reference found in the splice
            # For example, you could replace it with a UUID or perform some other action
            # Example: splices[i] = splice.replace(ref, "UUID_REPLACEMENT")

result = ''.join(splices)
print("Final Result:", result)