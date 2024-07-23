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
        hint: "Makes your game use Elkan 5e Custom Conditions",
        scope: "world",
        config: true,
        requiresReload: true,
        default: "a",
        choices: {
            "a":"Elkan Conditions Only",
            "b":"Elkan Conditions + Extra Conditions",
            "c":"Elkan Conditions + Extra Conditions but using D&D Exaustion",
            "d":"D&D Conditions without Extra Condtions",
            "e":"D&D Condtions Default"
        },
        restricted: true,
    });

    game.settings.register("elkan5e", "tools", {
        name: "Use Elkan 5e Tools",
        hint: "Reenable hidden tools",
        scope: "world",
        config: true,
        requiresReload: true,
        default: false,
        type: Boolean,
        restricted: true,
    });

    game.settings.register("elkan5e", "armor", {
        name: "Elkan 5e Armor",
        hint: "Show old armor types",
        scope: "world",
        config: true,
        requiresReload: true,
        default: false,
        type: Boolean,
        restricted: true,
    });

    game.settings.register("elkan5e", "draconic-toughness", {
        name: "Draconic Toughness Change",
        hint: "Changes Draconic Toughness from being 13 + @dex to 14 + @dex",
        scope: "world",
        config: true,
        requiresReload: true,
        default: true,
        type: Boolean,
        restricted: true,
    });
}