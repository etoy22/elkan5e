import json
import os

def sort_json(obj):
    if isinstance(obj, dict):
        return {k: sort_json(obj[k]) for k in sorted(obj)}
    elif isinstance(obj, list):
        return [sort_json(item) for item in obj]
    else:
        return obj

def sort_json_files_in_folder(root_folder):
    for dirpath, dirnames, filenames in os.walk(root_folder):
        for filename in filenames:
            if filename.lower().endswith(".json"):
                filepath = os.path.join(dirpath, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    sorted_data = sort_json(data)

                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(sorted_data, f, indent=2, ensure_ascii=False)

                    print(f"Sorted JSON in file: {filepath}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    folder_to_process = ".."  # Change this to your root folder path
    sort_json_files_in_folder(folder_to_process)
