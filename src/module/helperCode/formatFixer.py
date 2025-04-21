import os
import json

folder_paths = [
    'src\packs\elkan5e-ancestries', 
    'src\packs\elkan5e-backgrounds', 
    'src\packs\elkan5e-class', 
    'src\packs\elkan5e-class-features', 
    'src\packs\elkan5e-creature-features', 
    'src\packs\elkan5e-creatures', 
    'src\packs\elkan5e-equipment', 
    'src\packs\elkan5e-feats', 
    'src\packs\elkan5e-lore', 
    'src\packs\elkan5e-macros', 
    'src\packs\elkan5e-magic-items', 
    'src\packs\elkan5e-roll-tables', 
    'src\packs\elkan5e-rules', 
    'src\packs\elkan5e-spells', 
    'src\packs\elkan5e-subclass', 
    'src\packs\elkan5e-summoned-creatures'   
]

for folder_path in folder_paths:
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            
            # Load the JSON file
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            # Replace non-breaking spaces and specific text patterns
            def replace_text(obj):
                if isinstance(obj, str):
                    obj = obj.replace('\u00A0', ' ')
                    obj = obj.replace('<strong>Success</strong>:', '<strong>Success:</strong>')
                    obj = obj.replace('<strong>Failure</strong>:', '<strong>Failure:</strong>')
                    obj = obj.replace('<strong>Material</strong>:', '<strong>Material:</strong>')
                    obj = obj.replace('<strong>Concentration</strong>:', '<strong>Concentration:</strong>')
                    obj = obj.replace('<strong>Area Hazard</strong>:', '<strong>Area Hazard:</strong>')
                    obj = obj.replace('<strong>Hit</strong>:', '<strong>Hit:</strong>')
                    obj = obj.replace('<strong>Miss</strong>:', '<strong>Miss:</strong>')
                    obj = obj.replace('<strong>*At Higher Levels</strong>:', '<strong>*At Higher Levels:</strong>')
                    return obj
                elif isinstance(obj, list):
                    return [replace_text(item) for item in obj]
                elif isinstance(obj, dict):
                    return {key: replace_text(value) for key, value in obj.items()}
                return obj
            
            updated_data = replace_text(data)
            
            # Save the updated JSON file
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(updated_data, file, ensure_ascii=False, indent=4)
