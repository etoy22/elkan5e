import os
import json
from helping.constants import references
from updateTime import load_and_update_json

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

count = 0
log_file_path = "change_log.txt"  # Path to the log file

# Clear the log file at the start
with open(log_file_path, 'w', encoding='utf-8') as log_file:
    log_file.write("Change Log:\n\n")

def deduplicate_nested_lists(content):
    """
    Deduplicates nested <ul> structures in the given HTML content.
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(content, "html.parser")

    def deduplicate_ul(ul):
        seen = set()
        unique_items = []
        for li in ul.find_all("li", recursive=False):
            li_text = str(li)
            if li_text not in seen:
                seen.add(li_text)
                unique_items.append(li)
        ul.clear()
        ul.extend(unique_items)

    def recursive_deduplication(tag):
        # Recursively deduplicate all <ul> tags within the given tag
        for ul in tag.find_all("ul", recursive=False):
            deduplicate_ul(ul)
            recursive_deduplication(ul)  # Recurse into nested <ul> tags

    # Start deduplication from the root
    recursive_deduplication(soup)

    return str(soup)

for folder_path in folder_paths:
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)

            # Load the JSON file
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON in file {file_path}: {e}")
                continue

            example = data.get("system", {}).get("description", {}).get("value", "")

            # Deduplicate nested <ul> structures
            example = deduplicate_nested_lists(example)

            start_indices = [i for i in range(len(example)) if example.startswith("<ul>", i)]
            end_indices = [i for i in range(len(example)) if example.startswith("</ul>", i)]
            p_start_indices = [i for i in range(len(example)) if example.startswith("<p>", i)]
            p_end_indices = [i for i in range(len(example)) if example.startswith("</p>", i)]
            table_start_indices = [i for i in range(len(example)) if example.startswith("<table", i)]
            table_end_indices = [i for i in range(len(example)) if example.startswith("</table>", i)]

            ULcomb = list(zip(start_indices, end_indices))
            TableComb = list(zip(table_start_indices, table_end_indices))
            Pcomb = list(zip(p_start_indices, p_end_indices))

            cut = []
            for p_start, p_end in Pcomb:
                if not any(ul_start < p_start < ul_end and ul_start < p_end < ul_end for ul_start, ul_end in ULcomb):
                    if not any(table_start < p_start < table_end and table_start < p_end < table_end for table_start, table_end in TableComb):
                        cut.append((p_start, p_end))

            cut.extend(ULcomb)
            cut.extend(TableComb)  # Include table sections
            cut.sort()

            splices = []
            for start, end in cut:
                # Ensure the end index is within bounds
                if end >= len(example):
                    end = len(example) - 1

                # Dynamically calculate the length of the closing tag
                closing_tag_length = 0
                if example[end:end + len("</p>")].startswith("</p>"):
                    closing_tag_length = len("</p>")
                elif example[end:end + len("</ul>")].startswith("</ul>"):
                    closing_tag_length = len("</ul>")
                elif example[end:end + len("</table>")].startswith("</table>"):
                    closing_tag_length = len("</table>")

                # Ensure the slice includes the closing tag and does not truncate
                splices.append(example[start:end + closing_tag_length])

            for ref in references:
                for i, splice in enumerate(splices):
                    # Track if the reference has already been added in the current section
                    ref_added = False
                    words = splice.split()  # Split the splice into words
                    for j, word in enumerate(words):
                        if word.lower() == ref.lower():  # Check for exact match
                            # Skip if the word is already referenced in the original example
                            if f"&amp;reference[{ref}]" in example or f"{ref}]]" in example or ref_added:
                                continue
                            words[j] = word.replace(ref, f"&amp;reference[{ref}]")  # Replace the whole word
                            ref_added = True  # Mark the reference as added for this section
                    splices[i] = " ".join(words)  # Rejoin the words into the splice

            result = ''.join(splices)
            result = result.replace('<<', '<')
            # Deduplicate repeated lines
            lines = result.splitlines()
            deduplicated_lines = []
            for line in lines:
                if not deduplicated_lines or line != deduplicated_lines[-1]:
                    deduplicated_lines.append(line)
            result = "\n".join(deduplicated_lines)
            if result != example.strip():  # Compare the processed result with the original, ignoring minor whitespace differences
                try:
                    # Log the changes
                    with open(log_file_path, 'a', encoding='utf-8') as log_file:
                        log_file.write(f"File: {file_path}\n")
                        log_file.write("Original:\n")
                        log_file.write(example + "\n\n")
                        log_file.write("Modified:\n")
                        log_file.write(result + "\n\n")
                        log_file.write("=" * 50 + "\n\n")

                    # Update the JSON data with the modified result
                    data["system"]["description"]["value"] = result
                    with open(file_path, 'w', encoding='utf-8') as file:
                        json.dump(data, file, ensure_ascii=False, indent=4)
                    print(f"Updated file: {file_path}")
                    count += 1
                except Exception as e:
                    print(f"Error writing {file_path}: {e}")

print("Final amount of changes:", count)