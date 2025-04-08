export async function getModuleVersion() {
    const response = await fetch("modules/elkan5e/module.json");
    const moduleData = await response.json();
    return moduleData.version;
}

export async function startDialog() {
    const SAVED_VERSION = game.settings.get("elkan5e", "moduleVersion");
    const DIALOG_SHOWN = game.settings.get("elkan5e", "dialogShown");
    const MODULE_VERSION = await getModuleVersion();
    let updateNotice = false
    let saved_version = SAVED_VERSION.split('.');
    if (SAVED_VERSION !== MODULE_VERSION || !DIALOG_SHOWN) {
        let content = `
            <h2>${game.i18n.localize("elkan5e.dialog.content.header")}</h2>
            <p>${game.i18n.localize("elkan5e.dialog.content.headerText")}</p>
        `;
            
        if (parseInt(saved_version[1]) < 12 || parseInt(saved_version[2]) < 9) {
            content += `
                <h3>${game.i18n.localize("elkan5e.dialog.content.update")}</h3>
                <p>${game.i18n.localize("elkan5e.dialog.content.updateNotice")}</p>
            `;
        }

        content += `
            <h3>${game.i18n.localize("elkan5e.dialog.content.joinUs")}</h3>
            <p>${game.i18n.localize("elkan5e.dialog.content.joinUsText")}</p>
            <h3>${game.i18n.localize("elkan5e.dialog.content.supportUs")}</h3>
            <p>${game.i18n.localize("elkan5e.dialog.content.supportText")}</p>
            <a href='https://ko-fi.com/P5P710UQX0' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
        `;

        let dialog = new Dialog({
            title: game.i18n.localize("elkan5e.dialog.title"),
            content: content,
            buttons: {
            close: {
                label: game.i18n.localize("elkan5e.dialog.doNotShow"),
                callback: async () => {
                await game.settings.set("elkan5e", "dialogShown", true);
                await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
                dialog.close();
                }
            }
            },
            close: async (html) => {
            const buttonClicked = html.find('button').length > 0;
            if (!buttonClicked) {
                await game.settings.set("elkan5e", "dialogShown", false);
            }
            }
        });
        dialog.render(true);
    }
}