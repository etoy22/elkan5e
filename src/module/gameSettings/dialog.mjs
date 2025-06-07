import { processElkanUpdateForm } from "./replaceItems.mjs";

export async function getModuleVersion() {
	const response = await fetch("modules/elkan5e/module.json");
	const moduleData = await response.json();
	return moduleData.version;
}

export async function showUpdateDialog() {
	const description =
		`<h2> ${game.i18n.localize("elkan5e.updateElkan.header")}</h2>` +
		`<p> ${game.i18n.localize("elkan5e.updateElkan.description")}</p>`;

	const form = await getForm();
	const content = `${description}${form}`;

	new Dialog({
		title: game.i18n.localize("elkan5e.updateElkan.title"),
		content,
		buttons: {
			update: {
				label: "Update",
				callback: (html) => {
					// Collect selected values into an object
					const values = {
						playerFeatures: html.find("input[name='actor-features']:checked").val(),
						playerItems: html.find("input[name='actor-items']:checked").val(),
						playerSpells: html.find("input[name='actor-spells']:checked").val(),
						npcFeatures: "none",
						npcItems: html.find("input[name='npc-items']:checked").val(),
						npcSpells: html.find("input[name='npc-spells']:checked").val(),
					};

					// Pass the collected values object to the process function
					processElkanUpdateForm(values);
				},
			},
			close: {
				label: "Close",
			},
		},
		default: "close"
	}).render(true);
}

export async function showV13UpdateDialog() {
	if (!game.user.isGM) return;
	const description =
		`<p> ${game.i18n.localize(
			"elkan5e.updateElkan.descriptionV13.initial"
		)}</p>` +
		`<p> ${game.i18n.localize(
			"elkan5e.updateElkan.descriptionV13.manually"
		)}</p>` +
		`<p> ${game.i18n.localize(
			"elkan5e.updateElkan.descriptionV13.previous"
		)}</p>` +
		`<ul style="margin-left: 1.2em;">` +
		`<li> ${game.i18n.localize(
			"elkan5e.updateElkan.descriptionV13.listItems.neverSeeAgain"
		)}</li>` +
		`<li> ${game.i18n.localize(
			"elkan5e.updateElkan.descriptionV13.listItems.updateLater"
		)}</li>` +
		`<li> ${game.i18n.localize(
			"elkan5e.updateElkan.descriptionV13.listItems.updateNow"
		)}</li>` +
		`</ul>` +
		`<p> ${game.i18n.localize(
			"elkan5e.updateElkan.descriptionV13.footer"
		)}</p>`;
	const form = getForm();
	const content = `${description}${form}`;

	new Dialog({
		title: "Elkan 5e V13 Update",
		content,
		buttons: {
			never: {
				label: "Never See Again",
				callback: async () => {
					await game.settings.set("elkan5e", "v13Show", false);
				},
			},
			later: {
				label: "Update Later",
				callback: async () => {
					await game.settings.set("elkan5e", "v13Show", true);
				},
			},
			update: {
				label: "Update",
				callback: async (html) => {
					await game.settings.set("elkan5e", "v13Show", false);
					processElkanUpdateForm(html);
				},
			},
		},
		default: "later",
		close: (html) => {
			html.find("#actor-features").on("change", (e) => {
				html.find("#actor-classes-subclasses").toggle(e.target.checked);
			});
			html.find("#npc-features").on("change", (e) => {
				html.find("#npc-classes-subclasses").toggle(e.target.checked);
			});
		},
	}).render(true);
}

export async function startDialog() {
	const SAVED_VERSION = game.settings.get("elkan5e", "moduleVersion");
	const DIALOG_SHOWN = game.settings.get("elkan5e", "dialogShown");
	const MODULE_VERSION = await getModuleVersion();
	let saved_version = SAVED_VERSION.split(".");
	if (SAVED_VERSION !== MODULE_VERSION || !DIALOG_SHOWN) {
		let content = `
			<h2> ${game.i18n.localize("elkan5e.dialog.content.header")}</h2>
			<p> ${game.i18n.localize("elkan5e.dialog.content.headerText")}</p>
		`;

		const showUntil = new Date("2025-06-22T23:59:59"); // Target cutoff date
		const now = new Date();

		if (now < showUntil) {
			content += `
				<h3 style="font-weight: 800;">Elkan 5e Survey on 2024 Changes</h2>
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
				<h2> ${game.i18n.localize("elkan5e.dialog.content.update")}</h2>
				<p> ${game.i18n.localize("elkan5e.dialog.content.updateNotice")}</p>
			`;
		}

		content += `
			<h2> ${game.i18n.localize("elkan5e.dialog.content.joinUs")}</h2>
			<p> ${game.i18n.localize("elkan5e.dialog.content.joinUsText")}</p>
			<h2> ${game.i18n.localize("elkan5e.dialog.content.supportUs")}</h2>
			<p> ${game.i18n.localize("elkan5e.dialog.content.supportText")}</p>
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
					},
				},
			},
			close: async (html) => {
				const buttonClicked = html.find("button").length > 0;
				if (!buttonClicked) {
					await game.settings.set("elkan5e", "dialogShown", false);
				}
				if (
					(saved_version[0] < 13 && MODULE_VERSION.split(".")[0] >= 13) ||
					game.settings.get("elkan5e", "v13Show")
				) {
					showV13UpdateDialog();
				}
				await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
			},
		});
		dialog.render(true);
	}
}

export async function getForm() {
	return `
  <h3>${game.i18n.localize("elkan5e.updateElkan.form.playerTitle")}</h3>
  <form id='update-character-features'>
    <div class='form-group'>
      <div>
        <label><strong> ${game.i18n.localize(
		"elkan5e.updateElkan.form.featuresLabel"
	)}</strong></label><br>
        <label><input type='radio' name='actor-features' value='none' checked> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.none"
	)}</label><br>
        <label><input type='radio' name='actor-features' value='update-All'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.replaceClass"
	)}</label><br>
        <label><input type='radio' name='actor-features' value='update-Elkan'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.replaceFeatures"
	)}</label>
      </div>
    </div>
  </form>
  <form id='update-character-items'>
    <div class='form-group'>
      <div>
        <label><strong>${game.i18n.localize(
		"elkan5e.updateElkan.form.itemsLabel"
	)}</strong></label><br>
        <label><input type='radio' name='actor-items' value='none' checked> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.none"
	)}</label><br>
        <label><input type='radio' name='actor-items' value='update-All'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.updateAll"
	)}</label><br>
        <label><input type='radio' name='actor-items' value='update-Elkan'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.replaceElkan"
	)}</label>
      </div>
    </div>
  </form>
  <form id='update-character-spells'>
    <div class='form-group'>
      <div>
        <label><strong>Spells</strong></label><br>
        <label><input type='radio' name='actor-spells' value='none' checked> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.none"
	)}</label><br>
        <label><input type='radio' name='actor-spells' value='update-All'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.updateAll"
	)}</label><br>
        <label><input type='radio' name='actor-spells' value='update-Elkan'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.replaceElkan"
	)}</label>
      </div>
    </div>
  </form>

  <h3>NPC Updates</h3>
  <p style='margin: 1em 0; font-style: italic; color: #a00;'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.warningNote"
	)}</p>
  <form id='update-npc-items'>
    <div class='form-group'>
      <div>
        <label><strong>${game.i18n.localize(
		"elkan5e.updateElkan.form.itemsLabel"
	)}</strong></label><br>
        <label><input type='radio' name='npc-items' value='none' checked> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.none"
	)}</label><br>
        <label><input type='radio' name='npc-items' value='update-All'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.updateAll"
	)}</label><br>
        <label><input type='radio' name='npc-items' value='update-Elkan'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.replaceElkan"
	)}</label>
      </div>
    </div>
  </form>
  <form id='update-npc-spells''>
    <div class='form-group'>
      <div>
        <label><strong> ${game.i18n.localize(
		"elkan5e.updateElkan.form.spellsLabel"
	)}</strong></label><br>
        <label><input type='radio' name='npc-spells' value='none' checked> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.none"
	)}</label><br>
        <label><input type='radio' name='npc-spells' value='update-All'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.updateAll"
	)}</label><br>
        <label><input type='radio' name='npc-spells' value='update-Elkan'> ${game.i18n.localize(
		"elkan5e.updateElkan.form.options.replaceElkan"
	)}</label>
      </div>
    </div>
  </form>
`;
}
