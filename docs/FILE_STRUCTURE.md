# Recommended File Structure

The current repository root contains multiple asset and helper folders such as `src`, `icons`, `images`, `packs`, and `helperCode`.
To simplify navigation and maintenance, the following hierarchy groups related files together:

```
/                    # Repository root
├─ src/              # Application source code
│  ├─ module/        # Game rules, classes and hooks
│  ├─ packs.mjs      # Packaging helpers
│  └─ elkan5e.mjs    # Main Foundry module entry
├─ assets/           # Art and media assets
│  ├─ icons/         # Icons grouped by category (conditions, weapons, …)
│  └─ images/        # Cover art and promotional images
├─ scripts/          # Development utilities formerly in helperCode
│  ├─ python/        # Python tools
│  └─ shell/         # Shell scripts
├─ packs/            # Compendium data
├─ lang/             # Translations
└─ misc files        # Configuration, licences, etc.
```

This layout groups all assets under a single `assets` directory and moves helper scripts into a dedicated `scripts` folder, making it easier to find related files and extend the project.
