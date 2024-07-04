export function gameSettingRegister(){
    game.settings.register("elkan5e", "dialogShown", {
        name: "Dialog Shown",
        hint: "Indicates whether the dialog has been shown for this user",
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
    });
}