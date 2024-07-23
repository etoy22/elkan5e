export function startDialog(){
    const dialogShown = game.settings.get("elkan5e", "dialogShown");
    if (!dialogShown) {
        let dialog = new Dialog({
            title: "Elkan 5e",
            content: `
                <h2>Hope you're enjoying the Elkan 5e module!</h2>
                <p>The latest update changelog can be read <a href="https://github.com/etoy22/elkan5e/blob/main/CHANGELOG.md">here</a>.</p>

                <h3><br>Join us on <a href="https://discord.gg/DNdtcJYGeB" target="_blank">Discord</a></h3>
                <p>Get weekly updates and a detailed <a href="https://discord.com/channels/853741306169524234/1163980331435700274">changelog</a>, get help or report bugs, and vote in <a href="https://discord.com/channels/853741306169524234/1255026569886564352">monthly polls</a>.</p>

                <h3><br>Visit our <a href="https://www.elkan5e.com" target="_blank">Website</a></h3>
                <p>Contains all our module's content, updated every time the module updates.</p>

                <h3><br>Support Us</h3>
                <p>We rely on donations to support the Elkan 5e project. If you want to help us keep the Elkan project going, consider supporting us on <b><a href="https://www.patreon.com/Elkan5e" target="_blank">Patreon</a>.</b> <br> If you would prefer to make a one-time donation, you can donate on <b><a href="https://ko-fi.com/elkan5e" target="_blank">Ko-fi</a></b>.</p>

                <a href='https://ko-fi.com/P5P710UQX0' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
            `,
            buttons: {
                ok: {
                    label: "Do Not Show Again",
                    callback: async () => {
                        await game.settings.set("elkan5e", "dialogShown", true);
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