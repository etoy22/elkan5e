"""Sort ItemChoice pools in class pack definitions.

This script scans all class JSON files under
``packs/_source/elkan5e-class``. For every object of type
``ItemChoice`` it resolves each entry's UUID to the item's name and
sorts the pool alphabetically by that name. The script writes any
changes back to disk.

Usage:
    python scripts/sort_item_choices.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parent.parent
PACKS_ROOT = ROOT / "packs" / "_source"
CLASSES_DIR = PACKS_ROOT / "elkan5e-class"

# Determine the module id so we can fully qualify pack names
MODULE_ID = json.loads((ROOT / "module.json").read_text(encoding="utf-8")).get("id", "")


def build_id_name_map() -> Dict[str, Dict[str, str]]:
    """Build mapping of "module.pack" -> {id -> name} for all items."""
    mapping: Dict[str, Dict[str, str]] = {}
    for path in PACKS_ROOT.rglob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(data, dict):
            continue
        item_id = data.get("_id")
        name = data.get("name")
        if not item_id or not name:
            continue
        rel = path.relative_to(PACKS_ROOT)
        pack = rel.parts[0]
        mapping.setdefault(f"{MODULE_ID}.{pack}", {})[item_id] = name
    return mapping


def resolve_name(uuid: str, mapping: Dict[str, Dict[str, str]]) -> str:
    """Resolve a compendium UUID to the item's name."""
    parts = uuid.split(".")
    if len(parts) >= 5 and parts[0] == "Compendium":
        module = parts[1]
        pack = parts[2]
        item_id = parts[4]
        key = f"{module}.{pack}"
        return mapping.get(key, {}).get(item_id, "")
    return ""


def sort_item_choices():
    id_name = build_id_name_map()
    for class_path in CLASSES_DIR.glob("*.json"):
        data = json.loads(class_path.read_text(encoding="utf-8"))
        changed = False
        sorted_pools: List[List[str]] = []

        def walk(obj):
            nonlocal changed
            if isinstance(obj, dict):
                if obj.get("type") == "ItemChoice":
                    config = obj.get("configuration", {})
                    pool: List[Dict[str, str]] = config.get("pool", [])
                    sorted_pool = sorted(
                        pool,
                        key=lambda e: resolve_name(e.get("uuid", ""), id_name),
                    )
                    if pool != sorted_pool:
                        config["pool"] = sorted_pool
                        obj["configuration"] = config
                        changed = True
                        names = [
                            resolve_name(entry.get("uuid", ""), id_name)
                            for entry in sorted_pool
                        ]
                        sorted_pools.append(names)
                for value in obj.values():
                    walk(value)
            elif isinstance(obj, list):
                for item in obj:
                    walk(item)

        walk(data)

        if changed:
            class_path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) +  "\n",
                encoding="utf-8",
            )
            rel = class_path.relative_to(ROOT)
            for names in sorted_pools:
                print(f"Sorted pool in {rel}: {names}")


if __name__ == "__main__":
    sort_item_choices()
