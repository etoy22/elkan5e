import os
import json

folder_paths = [
    'packs\\_source\\elkan5e-class-features',
    'packs\\_source\\elkan5e-creature-features',
    'packs\\_source\\elkan5e-rules',
    'packs\\_source\\elkan5e-spells',
]

count = 0
log_file_path = "helperCode\\logs\\clean.txt"

with open(log_file_path, 'w', encoding='utf-8') as log_file:
    log_file.write("Change Log:\n\n")

    for folder_path in folder_paths:
        for root, _, files in os.walk(folder_path):
            for file_name in files:
                if file_name.endswith(".json"):
                    file_path = os.path.join(root, file_name)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as json_file:
                            data = json.load(json_file)

                        # Safely access nested fields
                        chat = (
                            data.get("system", {})
                                .get("description", {})
                                .get("chat")
                        )

                        # If chat exists and is not empty, set it to empty string
                        if chat is not None and chat != "":
                            data["system"]["description"]["chat"] = ""
                            with open(file_path, 'w', encoding='utf-8') as json_file:
                                json.dump(data, json_file, ensure_ascii=False, indent=2)

                            log_file.write(f"Cleared 'chat' in: {file_path}\n")
                            count += 1

                    except json.JSONDecodeError as e:
                        log_file.write(f"{file_path}: JSON decode error — {e}\n")
                    except Exception as e:
                        log_file.write(f"{file_path}: Error — {e}\n")

    print(f"\nTotal files updated: {count}\n")
