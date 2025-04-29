/**
 * Changes Foundry's languages to fit that of Elkan 5e.
 */
export function language() {
  let lang = game.settings.get("elkan5e", "languageSystem");
  if (!lang) {
    console.warn(
      "Elkan 5e | No language settings found, skipping language initialization."
    );
    return;
  }
  if (lang) {
    console.log("Elkan 5e  |  Initializing Languages");

    const LANGUAGES_TO_DELETE = [
      "giant",
      "gnomish",
      "orc",
      "druidic",
      "cant",
      "draconic",
    ];

    if (!CONFIG.DND5E?.languages?.standard?.children) {
      console.warn(
        "Elkan 5e | CONFIG.DND5E.languages not properly initialized"
      );
    }
    else{
    // Deleting Languages
    LANGUAGES_TO_DELETE.forEach(
      (lang) => delete CONFIG.DND5E.languages.standard.children[lang]
    );
    delete CONFIG.DND5E.languages.cant
    delete CONFIG.DND5E.languages.druidic
    delete CONFIG.DND5E.languages.exotic;
    
    // Adding Languages
    CONFIG.DND5E.languages.standard.children.under = "Undercommon";

    CONFIG.DND5E.languages.rare = {
      label: "Rare Languages",
      children: {
        draconic: "Draconic",
        giant: "Giant",
        gnomish: "Gnomish",
        orc: "Orc",
        cant: "Thieves' Cant",
      },
    };

    CONFIG.DND5E.languages.magic = {
      label: "Magical Languages",
      children: {
        abyssal: "Abyssal",
        celestial: "Celestial",
        deep: "Deep Speech",
        druidic: "Druidic",
        infernal: "Infernal",
        primordial: {
          label: "Primordial",
          children: {
            aquan: "Aquan",
            auran: "Auran",
            ignan: "Ignan",
            terran: "Terran",
          },
        },
        sylvan: "Sylvan",
      },
    };

    CONFIG.DND5E.languages.other = {
      label: "Other Languages",
      children: {
        aarakocra: "Aarakocra",
        gith: "Gith",
        gnoll: "Gnoll",
      },
    };
  }
  } else {
    console.warn(
      "Elkan 5e | Language settings not set to elkan5e, skipping language initialization."
    );
    return;
  }
}
