import { getSharedFormContent, processElkanUpdateForm } from "./replaceItems.mjs";

export async function getModuleVersion() {
    const response = await fetch("modules/elkan5e/module.json");
    const moduleData = await response.json();
    return moduleData.version;
}



export async function showManualUpdateDialog() {
  const content = `
    <p>
      This tool helps apply optional updates to features, spells, items, and subclasses for both player characters and NPCs in Elkan 5e. These updates ensure compatibility with the latest system changes and reduce issues caused by legacy versions of abilities.
    </p>
    <p>
      You can use the form below to apply these updates selectively. If you're unsure what was changed, check the full list of updates in the
      <a href="https://github.com/etoy22/elkan5e/blob/main/CHANGELOG.md" target="_blank" rel="noopener">Elkan 5e Changelog</a>.
    </p>
    ${getSharedFormContent()}`;

  new Dialog({
    title: "Elkan 5e Automatic Update Abilities",
    content,
    buttons: {
      update: {
        label: "Update",
        callback: html => processElkanUpdateForm(html)
      },
      close: {
        label: "Close"
      }
    },
    default: "close",
    close: html => {
      html.find("#actor-features").on("change", e => {
        html.find("#actor-classes-subclasses").toggle(e.target.checked);
      });
      html.find("#npc-features").on("change", e => {
        html.find("#npc-classes-subclasses").toggle(e.target.checked);
      });
    }
  }).render(true);
}

export async function showV13UpdateDialog(){
    if (!game.user.isGM) return;
    const content = `
    <p>
      As we upgrade Elkan 5e to Foundry V13, we've reworked much of the underlying code and updated several features and spells. To ensure everything functions smoothly, you can choose to update features automatically using the options below.
    </p>
    <p>
      If you prefer to make these changes manually, the full details are available in the changelog linked below.
    </p>
    <p>
      In previous updates, replacing abilities was often necessary to maintain compatibility — this update process helps with that as well.
    </p>
    <ul style="margin-left: 1.2em;">
      <li><strong>Never See Again</strong> — don't show this prompt again automatically.</li>
      <li><strong>Update Later</strong> — skip for now, but remind me next world load.</li>
      <li><strong>Update</strong> — apply selected updates and don't show this again.</li>
    </ul>
    <p>
      You can always re-access this from the Elkan Configuration Settings.<br>
      See full update details in the <a href="https://github.com/etoy22/elkan5e/blob/main/CHANGELOG.md" target="_blank">Elkan 5e Changelog</a>.
    </p>
    ${getSharedFormContent()}`;

  new Dialog({
    title: "Elkan 5e V13 Update",
    content,
    buttons: {
      never: {
        label: "Never See Again",
        callback: async () => {
          await game.settings.set("elkan5e", "v13Show", false);
        }
    },
    later: {
        label: "Update Later",
        callback: async () => {
          await game.settings.set("elkan5e", "v13Show", true);
        }
      },
      update: {
        label: "Update",
        callback: async html => {
          await game.settings.set("elkan5e", "v13Show", false);
          processElkanUpdateForm(html);
        }
      }
    },
    default: "later",
    close: html => {
      html.find("#actor-features").on("change", e => {
        html.find("#actor-classes-subclasses").toggle(e.target.checked);
      });
      html.find("#npc-features").on("change", e => {
        html.find("#npc-classes-subclasses").toggle(e.target.checked);
      });
    }
  }).render(true); 
}

export async function startDialog() {
    const SAVED_VERSION = game.settings.get("elkan5e", "moduleVersion");
    const DIALOG_SHOWN = game.settings.get("elkan5e", "dialogShown");
    const MODULE_VERSION = await getModuleVersion();
    let saved_version = SAVED_VERSION.split('.');
    if (SAVED_VERSION !== MODULE_VERSION || !DIALOG_SHOWN) {
        let content = `
            <h2>${game.i18n.localize("elkan5e.dialog.content.header")}</h2>
            <p>${game.i18n.localize("elkan5e.dialog.content.headerText")}</p>
        `;
        
        const showUntil = new Date("2025-06-22T23:59:59");  // Target cutoff date
        const now = new Date();
        
        if (now < showUntil) {
            content += `
                <h3 style="font-weight: 800;">Elkan 5e Survey on 2024 Changes</h3>
                <p>The SRD (System Reference Document) is the free-to-use document of 5e rules that Elkan 5e was based on. This year, it was updated with new content.</p>
                <p>We have been going through the new 5e 2024 SRD and picking out our favorite changes to include in the Elkan 5e system.</p>
                <p>We've put together a form here. We'd appreciate you all weighing in and helping us decide what to do about a few possible changes to Elkan 5e:
                <a href="https://forms.gle/k6yYNFR6z5djgttk7" target="_blank" title="https://forms.gle/k6yYNFR6z5djgttk7">
                    click here to fill out the form
                </a></p>
            `;
        }


        if (parseInt(saved_version[1]) <= 12 && parseInt(saved_version[2]) < 9) {
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
                    dialog.close();
                }
            }
            },
            close: async (html) => {
                const buttonClicked = html.find('button').length > 0;
                if (!buttonClicked) {
                    await game.settings.set("elkan5e", "dialogShown", false);
                }
                if (saved_version[0] < 13 && MODULE_VERSION.split('.')[0] >= 13 || game.settings.get("elkan5e", "v13Show")) {
                    showV13UpdateDialog();
                }
                await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
            }
        });
        dialog.render(true);
    }
}