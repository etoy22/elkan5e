import os

folder_paths = [
    'src\packs\elkan5e-spells'
]

keywords = ["Reaction", "Action", "Bonus Action"]

for folder in folder_paths:
    for root, dirs, files in os.walk(folder):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    for line in f:
                        for keyword in keywords:
                            if keyword in line:
                                print(file)
                                break
            except Exception as e:
                print(f"Could not read {file_path}: {e}")