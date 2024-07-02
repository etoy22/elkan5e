export function startDialog(){
    if (game.user.isGM) { //Makes is so only GM users see this
        const dialogShown = game.settings.get("elkan5e", "dialogShown");
        if (!dialogShown) {
            let dialog = new Dialog({
                title: "Elkan 5e",
                content: `
                    <p>Thanks for using the Elkan 5e Module:</p>
                    <p>You can support us on Patreon: <a href="https://www.patreon.com/Elkan5e" target="_blank">Elkan 5e Patreon</a></p>
                    <p>Or if you want to keep up to date with everything visit our Discord: <a href="https://discord.gg/DNdtcJYGeB" target="_blank">Elkan 5e Discord</a></p>
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
}