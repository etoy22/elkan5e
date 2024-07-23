export function gameSettingRegister(){
    game.settings.register("elkan5e", "dialogShown", {
        name: "Dialog Shown",
        hint: "Indicates whether the dialog has been shown for this user",
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
    });

    game.settings.register("elkan5e", "conditions", {
        name: "Use Custom Conditions",
        hint: "The Elkan 5e module automates the function of conditions. Our module is designed with the Elkan conditions in mind, but if you don't want any of the Elkan improvements to conditions, you can switch back to SRD conditions.",
        scope: "world",
        config: true,
        type: String,
        requiresReload: true,
        default: "a",
        choices: {
            "a":"Elkan Conditions",
            "b":"Elkan Conditions + extra condition icons",
            "c":"Elkan Conditions (but SRD Exhaustion) + extra condition icons",
            "d":"D&SRD Conditions",
            "e":"SRD Conditions + extra condition icons"
        },
        restricted: true,
    });

    game.settings.register("elkan5e", "tools", {
        name: "Tools List",
        hint: "Add old tools removed by the Elkan ruleset (like woodcarving). May not function properly with Elkan classes.",
        scope: "world",
        config: true,
        requiresReload: true,
        default: false,
        type: Boolean,
        restricted: true,
    });

    game.settings.register("elkan5e", "armor", {
        name: "Armor List",
        hint: "Add deprecated armor proficiencies. May not function properly with Elkan classes.",
        scope: "world",
        config: true,
        requiresReload: true,
        default: false,
        type: Boolean,
        restricted: true,
    });
    
    game.settings.register("elkan5e", "weapons", {
        name: "Weapon List",
        hint: "Add deprecated weapon proficiencies. May not function properly with Elkan classes.",
        scope: "world",
        config: true,
        requiresReload: true,
        default: false,
        type: Boolean,
        restricted: true,
    });

    game.settings.register("elkan5e", "draconic-toughness", {
        name: "Draconic Toughness Update",
        hint: "Uncheck to revert Draconic Toughness to 13 + Dex instead of 14 + Dex.",
        scope: "world",
        config: true,
        requiresReload: true,
        default: true,
        type: Boolean,
        restricted: true,
    });
}