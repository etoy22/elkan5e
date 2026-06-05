import { processElkanUpdateForm } from "./replace-items.mjs";
const DialogV2 = foundry.applications.api.DialogV2;

/**
 * Handles get Module Version for module settings.
 *
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function getModuleVersion() {
	const response = await fetch("modules/elkan5e/module.json");
	const moduleData = await response.json();
	return moduleData.version;
}

/**
 * Handles show Update Dialog for module settings.
 *
 * @returns {Promise<void>} Promise resolution result.
 */
export async function showUpdateDialog() {
	const form = await getForm();
	const content = `<div class="elkan-update-text">
			<h2> ${game.i18n.localize("elkan5e.updateElkan.header")}</h2>
			<p> ${game.i18n.localize("elkan5e.updateElkan.description")}</p>
			${form}
		</div>`;

	new DialogV2({
		window: {
			title: game.i18n.localize("elkan5e.updateElkan.title"),
		},
		content,
		buttons: [
			{
				label: "Update",
				action: "update",
				callback: (_event, button, dialog) => {
					game.settings.set("elkan5e", "v13Show", false);
					const form =
						button.form ??
						dialog?.element?.querySelector?.("#elkan-update-form") ??
						dialog?.element?.querySelector?.("form");
					if (!form) {
						ui.notifications.error("Update form not found.");
						return;
					}

					const data = new FormData(form);
					const _updateModeSelect = form.querySelector('[name="update-mode"]');
					const removeDuplicatesCheckbox = form.querySelector(
						'[name="remove-duplicates"]',
					);
					const formProcessing = {
						actorFeatures: data.get("actor-features") ?? "none",
						actorItems: data.get("actor-items") ?? "none",
						actorSpells: data.get("actor-spells") ?? "none",
						npcFeatures: data.get("npc-features") ?? "none",
						npcItems: data.get("npc-items") ?? "none",
						npcSpells: data.get("npc-spells") ?? "none",
						actorDuplicate: removeDuplicatesCheckbox?.checked,
						npcDuplicate: removeDuplicatesCheckbox?.checked,
					};
					const selectedModes = [
						formProcessing.actorFeatures,
						formProcessing.actorItems,
						formProcessing.actorSpells,
						formProcessing.npcFeatures,
						formProcessing.npcItems,
						formProcessing.npcSpells,
					];
					if (
						selectedModes.every((value) => value === "none") &&
						formProcessing.actorDuplicate === false &&
						formProcessing.npcDuplicate === false
					) {
						ui.notifications.info("No Update Process Set.");
						return;
					}
					processElkanUpdateForm(formProcessing);
				},
			},
			{
				label: "Close",
				action: "close",
			},
		],
	}).render(true);
}

/**
 * Handles start Dialog for module settings.
 *
 * @returns {Promise<void>} Promise resolution result.
 */
export async function startDialog() {
	const SAVED_VERSION = game.settings.get("elkan5e", "moduleVersion");
	const DIALOG_SHOWN = game.settings.get("elkan5e", "dialogShown");
	const MODULE_VERSION = await getModuleVersion();
	let saved_version = SAVED_VERSION.split(".");
	if (SAVED_VERSION !== MODULE_VERSION || !DIALOG_SHOWN) {
		let content = `
				<h2>${game.i18n.localize("elkan5e.dialog.content.header")}</h2>
				<p>${game.i18n.localize("elkan5e.dialog.content.headerText")}</p>
			`;

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

		let entryDialog = await DialogV2.confirm({
			window: { title: game.i18n.localize("elkan5e.dialog.title") },
			content: content, // this can just be text or HTML
			yes: {
				label: game.i18n.localize("elkan5e.dialog.doNotShow"),
			},
			no: {
				label: "Cancel",
			},
		});

		console.log("Elkan 5e dialog shown:", entryDialog);
		await game.settings.set("elkan5e", "dialogShown", entryDialog);
		await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
	} else {
		await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
	}
}

/**
 * Handles get Form for module settings.
 *
 * @returns {Promise<unknown>} Promise resolution result.
 */
export async function getForm() {
	return `
<form id="elkan-update-form" class="form">

<table style="width:100%; text-align:center;">
	<tr>
		<th></th>
		<th>${game.i18n.localize("elkan5e.updateElkan.form.options.none")}</th>
		<th>${game.i18n.localize("elkan5e.updateElkan.form.options.updateAll")}</th>
		<th>${game.i18n.localize("elkan5e.updateElkan.form.options.replaceElkan")}</th>
	</tr>

	<tr>
		<td colspan="4"><strong>${game.i18n.localize("elkan5e.updateElkan.form.playerTitle")}</strong></td>
	</tr>

	<tr>
		<td>${game.i18n.localize("elkan5e.updateElkan.form.featuresLabel")}</td>
		<td><input type="radio" name="actor-features" value="none" checked></td>
		<td>-</td>
		<td><input type="radio" name="actor-features" value="update-Elkan"></td>
	</tr>

	<tr>
		<td>${game.i18n.localize("elkan5e.updateElkan.form.itemsLabel")}</td>
		<td><input type="radio" name="actor-items" value="none" checked></td>
		<td><input type="radio" name="actor-items" value="update-All"></td>
		<td><input type="radio" name="actor-items" value="update-Elkan"></td>
	</tr>

	<tr>
		<td>${game.i18n.localize("elkan5e.updateElkan.form.spellsLabel")}</td>
		<td><input type="radio" name="actor-spells" value="none" checked></td>
		<td><input type="radio" name="actor-spells" value="update-All"></td>
		<td><input type="radio" name="actor-spells" value="update-Elkan"></td>
	</tr>

	<tr>
		<td colspan="4"><strong>${game.i18n.localize("elkan5e.updateElkan.form.npcTitle")}</strong></td>
	</tr>

	<tr>
		<td>${game.i18n.localize("elkan5e.updateElkan.form.itemsLabel")}</td>
		<td><input type="radio" name="npc-items" value="none" checked></td>
		<td><input type="radio" name="npc-items" value="update-All"></td>
		<td><input type="radio" name="npc-items" value="update-Elkan"></td>
	</tr>

	<tr>
		<td>${game.i18n.localize("elkan5e.updateElkan.form.spellsLabel")}</td>
		<td><input type="radio" name="npc-spells" value="none" checked></td>
		<td><input type="radio" name="npc-spells" value="update-All"></td>
		<td><input type="radio" name="npc-spells" value="update-Elkan"></td>
	</tr>
</table>
<table style="width:100%; text-align:center; margin-top:10px;">
	<tr>
		<th>Remove Duplicate Features and Spells</th>
		<th>Value</th>
	</tr>

	<tr>
		<td><strong>Players</strong></td>
		<td><input type="checkbox" name="remove-duplicates"></td>
	</tr>
	<tr>
		<td><strong>NPC</strong></td>
		<td><input type="checkbox" name="remove-duplicates-npc"></td>
	</tr>
</table>
</form>
`;
}
