import { processElkanUpdateForm } from "./replaceItems.mjs";
const DialogV2 = foundry.applications.api.DialogV2;

export async function getModuleVersion() {
	const response = await fetch("modules/elkan5e/module.json");
	const moduleData = await response.json();
	return moduleData.version;
}

export async function showUpdateDialog() {
	const form = await getForm();
	const content =
		`<div class="elkan-update-text">
			<h2> ${game.i18n.localize("elkan5e.updateElkan.header")}</h2>
			<p> ${game.i18n.localize("elkan5e.updateElkan.description")}</p>
			${form}
		</div>`;

	// const proceed  = await DialogV2.confirm({
	// 	window: { title: game.i18n.localize("elkan5e.updateElkan.title") },
	// 	content: content,
	// 	rejectClose: false,
	// 	modal: true
	// })
	new DialogV2({
		window: {
			title: game.i18n.localize("elkan5e.updateElkan.title")
		},
		content,
		buttons: [
			{
				label: "Update",
				action: "update",
				callback: (event, button, dialog) => {
					game.settings.set("elkan5e", "v13Show", false);
					const form = button.form;
					const data = new FormData(form);
					const formProcessing = {
						actorFeatures: data.get("actor-features") ?? "none",
						actorItems: data.get("actor-items") ?? "none",
						actorSpells: data.get("actor-spells") ?? "none",
						npcFeatures: data.get("npc-features") ?? "none",
						npcItems: data.get("npc-items") ?? "none",
						npcSpells: data.get("npc-spells") ?? "none"
					}
					processElkanUpdateForm(formProcessing);
				}
			},
			{
				label: "Close",
				action: "close",
			}
		]
	}).render(true);
}

export async function showV13UpdateDialog() {
	if (!game.user.isGM) return;
	const form = await getForm();
	const content =
		`<div class="elkan-update-text-v13">
			<p>
				${game.i18n.localize("elkan5e.updateElkan.descriptionV13.initial")} <br>
			 	${game.i18n.localize("elkan5e.updateElkan.descriptionV13.manually")} <br>
				${game.i18n.localize("elkan5e.updateElkan.descriptionV13.previous")}
				<ul>
					<li> ${game.i18n.localize("elkan5e.updateElkan.descriptionV13.listItems.neverSeeAgain")}</li>
					<li> ${game.i18n.localize("elkan5e.updateElkan.descriptionV13.listItems.updateLater")}</li>
					<li> ${game.i18n.localize("elkan5e.updateElkan.descriptionV13.listItems.updateNow")}</li>
				</ul>
			</p>
			<p> ${game.i18n.localize("elkan5e.updateElkan.descriptionV13.footer")}</p>
			${form}
		</div>`;


	new DialogV2({
		window: { title: "Elkan 5e V13 Update" },
		content: content,
		buttons: [
			{
				action: "never",
				label: "Never See Again",
				callback: (event, button, dialog) => {
					game.settings.set("elkan5e", "v13Show", false)
				}

			},
			{
				action: "updateLater",
				label: "Update Later",
				default: true,
				callback: (event, button, dialog) => {
					game.settings.set("elkan5e", "v13Show", true)
				}
			},
			{
				action: "update",
				label: "Update",
				callback: (event, button, dialog) => {
					game.settings.set("elkan5e", "v13Show", false);
					const form = button.form;
					const data = new FormData(form);
					const formProcessing = {
						actorFeatures: data.get("actor-features") ?? "none",
						actorItems: data.get("actor-items") ?? "none",
						actorSpells: data.get("actor-spells") ?? "none",
						npcFeatures: data.get("npc-features") ?? "none",
						npcItems: data.get("npc-items") ?? "none",
						npcSpells: data.get("npc-spells") ?? "none"
					}
					processElkanUpdateForm(formProcessing);
				}
			}]
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
					<h4 style="font-weight: 800;">Elkan 5e Survey on 2024 Changes</h4>
					<p>We have been going through the new 5e 2024 SRD and picking out our favorite changes to include in the Elkan 5e system.
					We've put together a form here. We'd appreciate you all weighing in and helping us decide what to do about a few possible changes to Elkan 5e:
					<a href="https://forms.gle/k6yYNFR6z5djgttk7" target="_blank" title="https://forms.gle/k6yYNFR6z5djgttk7">
						click here to fill out the form
					</a></p>
				`;
		}


		if (parseInt(saved_version[1]) <= 12 && parseInt(saved_version[2]) < 9) {
			content += `
					<h4>${game.i18n.localize("elkan5e.dialog.content.update")}</h4>
					<p>${game.i18n.localize("elkan5e.dialog.content.updateNotice")}</p>
				`;
		}

		content += `
				<h4>${game.i18n.localize("elkan5e.dialog.content.joinUs")}</h4>
				<p>${game.i18n.localize("elkan5e.dialog.content.joinUsText")}</p>
				<a href='https://ko-fi.com/P5P710UQX0' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
			`;

		content = `<div class="elkan-dialog-content">${content}</div>`;

		let entryDialog = await DialogV2.prompt({
			window: { title: game.i18n.localize("elkan5e.dialog.title") },
			content: content,
			ok: {
				label: game.i18n.localize("elkan5e.dialog.doNotShow"),
				action: "choice",
				callback: (event, button, dialog) => button.form.elements.choice.value
			}
		});

		if (entryDialog == "choice") {
			await game.settings.set("elkan5e", "dialogShown", false)
			if ((saved_version[0] < 13 && MODULE_VERSION.split(".")[0] >= 13) || game.settings.get("elkan5e", "v13Show")) {
				showV13UpdateDialog();
			}
			await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
		}
		else {
			if ((saved_version[0] < 13 && MODULE_VERSION.split(".")[0] >= 13) || game.settings.get("elkan5e", "v13Show")) {
				showV13UpdateDialog();
			}
			await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
		}
	}
}

export async function getForm() {
	return `
	<form class="form">
		<h4>${game.i18n.localize("elkan5e.updateElkan.form.playerTitle")}</h4>
		<label><strong>${game.i18n.localize("elkan5e.updateElkan.form.featuresLabel")}</strong></label>
		<label><input type="radio" name="actor-features" value="none" checked> ${game.i18n.localize("elkan5e.updateElkan.form.options.none")}</label>
		<label><input type="radio" name="actor-features" value="update-Elkan"> ${game.i18n.localize("elkan5e.updateElkan.form.options.replaceFeatures")}</label><br>
		<label><strong>${game.i18n.localize("elkan5e.updateElkan.form.itemsLabel")}</strong></label>
		<label><input type='radio' name='actor-items' value='none' checked> ${game.i18n.localize("elkan5e.updateElkan.form.options.none")}</label>
		<label><input type='radio' name='actor-items' value='update-All'> ${game.i18n.localize("elkan5e.updateElkan.form.options.updateAll")}</label>
		<label><input type='radio' name='actor-items' value='update-Elkan'> ${game.i18n.localize("elkan5e.updateElkan.form.options.replaceElkan")}</label><br>
		<label><strong>${game.i18n.localize("elkan5e.updateElkan.form.spellsLabel")}</strong></label>
		<label><input type='radio' name='actor-spells' value='none' checked> ${game.i18n.localize("elkan5e.updateElkan.form.options.none")}</label>
		<label><input type='radio' name='actor-spells' value='update-All'> ${game.i18n.localize("elkan5e.updateElkan.form.options.updateAll")}</label>
		<label><input type='radio' name='actor-spells' value='update-Elkan'> ${game.i18n.localize("elkan5e.updateElkan.form.options.replaceElkan")}</label><br>
  		<h4>${game.i18n.localize("elkan5e.updateElkan.form.npcTitle")}</h4>
	    <label><strong>${game.i18n.localize("elkan5e.updateElkan.form.itemsLabel")}</strong></label>
		<label><input type='radio' name='npc-items' value='none' checked> ${game.i18n.localize("elkan5e.updateElkan.form.options.none")}</label>
		<label><input type='radio' name='npc-items' value='update-All'> ${game.i18n.localize("elkan5e.updateElkan.form.options.updateAll")}</label>
		<label><input type='radio' name='npc-items' value='update-Elkan'> ${game.i18n.localize("elkan5e.updateElkan.form.options.replaceElkan")}</label><br>
		<label><strong> ${game.i18n.localize("elkan5e.updateElkan.form.spellsLabel")}</strong></label>
		<label><input type='radio' name='npc-spells' value='none' checked> ${game.i18n.localize("elkan5e.updateElkan.form.options.none")}</label>
		<label><input type='radio' name='npc-spells' value='update-All'> ${game.i18n.localize("elkan5e.updateElkan.form.options.updateAll")}</label>
		<label><input type='radio' name='npc-spells' value='update-Elkan'> ${game.i18n.localize("elkan5e.updateElkan.form.options.replaceElkan")}</label><br>
	</form>
	`
}