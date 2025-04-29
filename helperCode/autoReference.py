# import os
# import json

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


example = """
<p><em>You present a vial of magical shadow which flows outwards and creates a swirling vortex in front of you that corrupts everything it touches.</em></p>
<p><strong>Materials:</strong> Casting this spell requires a bottled @UUID[Compendium.elkan5e.elkan5e-spells.Item.eUy7hq3K0RdLI4O7]{shadow essence} typically valued at 20 gold. This spell consumes the material.</p>
<p><strong>Constitution Save</strong></p>
<ul>
    <li>
        <p><strong>Failure:</strong> Target is &amp;reference[drained] for [[/r 4d8]] hit points*. This cannot drain a target below their current hit point total, only draining them up to the amount of damage they've already taken.</p>
    </li>
    <li>
        <p><strong>Success:</strong> Target is drained by half as much.</p>
    </li>
    <li>
        <p><strong>Area Hazard:</strong> The well remains in place. Targets within the well cannot regain hit points, gain temporary hit points, or be raised from the dead (as undead or otherwise).</p>
    </li>
</ul>
<p><strong>*Upcasting:</strong> Targets are drained an additional [[/r 2d8]] for each spell level above 2nd level.</p>
"""


refernces = ["drained"]
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

for ref in refernces:
    for i, splice in enumerate(splices):
        if ref in splice:
            if f"&amp;reference[{ref}]" in splice:
                print(f"Reference '{ref}' already contains '&amp;reference[{ref}]' in splice {i}, skipping.")
                continue
            splices[i] = splice.replace(ref, f"&amp;reference[{ref}]", 1)
            # Here you can add your logic to handle the reference found in the splice
            # For example, you could replace it with a UUID or perform some other action
            # Example: splices[i] = splice.replace(ref, "UUID_REPLACEMENT")

result = ''.join(splices)
print("Final Result:", result)