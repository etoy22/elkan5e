export async function startDialog() {
    const SAVED_VERSION = game.settings.get("elkan5e", "moduleVersion");
    const DIALOG_SHOWN = game.settings.get("elkan5e", "dialogShown");
    const MODULE_VERSION = getModuleVersion();

    if (!DIALOG_SHOWN || SAVED_VERSION !== MODULE_VERSION) {
        let dialog = new Dialog({
            title: game.i18n.localize("elkan5e.dialog.title"),
            content: `
                <h2>${game.i18n.localize("elkan5e.dialog.content.header")}</h2>
                <p>${game.i18n.localize("elkan5e.dialog.content.updateNotice")}</p>
                <h3><br>${game.i18n.localize("elkan5e.dialog.content.joinUs")}</h3>
                <h3><br>${game.i18n.localize("elkan5e.dialog.content.supportUs")}</h3>
                <p>${game.i18n.localize("elkan5e.dialog.content.supportText")}</p>
                <a href='https://ko-fi.com/P5P710UQX0' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
            `,
            buttons: {
                ok: {
                    label: "Do Not Show Again",
                    callback: async () => {
                        await game.settings.set("elkan5e", "dialogShown", true);
                        await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
                        dialog.close();
                    }
                }
            },
            close: () => {
                if (!game.settings.get("elkan5e", "dialogShown")) {
                    game.settings.set("elkan5e", "dialogShown", false);
                }
            }
        });
        dialog.render(true);
    }
}