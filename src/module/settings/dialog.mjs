import {
	collectPendingChoices,
	getModulesWithItemPacks,
	openChoicesFor,
	processElkanUpdateForm,
} from "./replace-items.mjs";
import { esc } from "./migration-ui.mjs";
const { ApplicationV2, DialogV2 } = foundry.applications.api;

const L = (key, data) =>
	data
		? game.i18n.format(`elkan5e.updateElkan.${key}`, data)
		: game.i18n.localize(`elkan5e.updateElkan.${key}`);

/**
 * Returns the loaded Elkan module version, or undefined if the module is absent.
 *
 * @returns {Promise<string|undefined>}
 */
export async function getModuleVersion() {
	return game.modules.get("elkan5e")?.version;
}

/** Rows of the options form: [field name, label key, modes offered]. */
const ROWS = [
	{
		group: "playerTitle",
		rows: [
			["actor-features", "featuresLabel", ["none", "update-Elkan"]],
			["actor-items", "itemsLabel", ["none", "update-Elkan", "update-All"]],
			["actor-spells", "spellsLabel", ["none", "update-Elkan", "update-All"]],
		],
	},
	{
		group: "npcTitle",
		rows: [
			["npc-features", "featuresLabel", ["none", "update-Elkan"]],
			["npc-items", "itemsLabel", ["none", "update-Elkan", "update-All"]],
			["npc-spells", "spellsLabel", ["none", "update-Elkan", "update-All"]],
		],
	},
];

/** Row mode that updates from the ticked other modules instead of Elkan 5e. */
const MODULES_MODE = "update-Modules";
/** Row mode that updates from Elkan 5e and the ticked modules, Elkan taking priority. */
const BOTH_MODE = "update-Both";

const MODE_LABEL = {
	none: "ui.modeNone",
	"update-Elkan": "ui.modeElkan",
	"update-All": "ui.modeAll",
	[BOTH_MODE]: "modules.modeBoth",
	[MODULES_MODE]: "modules.modeUpdate",
};


/**
 * The window where the GM picks what to update, with a preview option.
 */
class UpdateOptionsWindow extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: "elkan5e-update-options",
		classes: ["elkan5e-migration", "elkan-options"],
		tag: "section",
		window: {
			title: "elkan5e.updateElkan.title",
			icon: "fa-solid fa-rotate",
			resizable: false,
		},
		position: { width: 560, height: "auto" },
		actions: {
			preview: UpdateOptionsWindow.#onPreview,
			run: UpdateOptionsWindow.#onRun,
			close: UpdateOptionsWindow.#onClose,
		},
	};

	/**
	 * Reads the form into the selection object the runner expects.
	 *
	 * @returns {object|null} Selections, or null when nothing is selected.
	 */
	#read() {
		const root = this.element;
		const get = (name) => root.querySelector(`[name="${name}"]`)?.value ?? "none";
		const checked = (name) => !!root.querySelector(`[name="${name}"]`)?.checked;
		const selection = {
			actorFeatures: get("actor-features"),
			actorItems: get("actor-items"),
			actorSpells: get("actor-spells"),
			npcFeatures: get("npc-features"),
			npcItems: get("npc-items"),
			npcSpells: get("npc-spells"),
			actorDuplicate: checked("remove-duplicates"),
			npcDuplicate: checked("remove-duplicates-npc"),
		};
		const extraModules = [...root.querySelectorAll("input[name='extra-module']:checked")].map(
			(el) => el.value,
		);
		// Any row set to "other modules" makes this a run over the ticked modules: those rows
		// update from them and every other row is skipped.
		const rowKeys = [
			"actorFeatures",
			"actorItems",
			"actorSpells",
			"npcFeatures",
			"npcItems",
			"npcSpells",
		];
		const modes = rowKeys.map((k) => selection[k]);
		const wantsModules = modes.some((m) => m === MODULES_MODE || m === BOTH_MODE);
		const wantsElkan = modes.some((m) => m === "update-Elkan" || m === BOTH_MODE);
		const scope = !wantsModules ? "elkan" : wantsElkan ? "both" : "modules";
		if (scope !== "elkan") {
			if (extraModules.length === 0) {
				ui.notifications.info(L("modules.pickOne"));
				return null;
			}
			for (const k of rowKeys)
				if (selection[k] === MODULES_MODE || selection[k] === BOTH_MODE)
					selection[k] = "update-Elkan";
			selection.actorDuplicate = false;
			selection.npcDuplicate = false;
		}
		const anything =
			Object.values(selection).some((v) => v === true) ||
			Object.values(selection).some((v) => typeof v === "string" && v !== "none");
		if (!anything) {
			ui.notifications.info(L("ui.nothing"));
			return null;
		}
		return { ...selection, extraModules, scope };
	}

	static async #onPreview() {
		const selection = this.#read();
		if (!selection) return;
		await this.close();
		await processElkanUpdateForm(selection, { dryRun: true });
	}

	static async #onRun() {
		const selection = this.#read();
		if (!selection) return;
		const ok = await DialogV2.confirm({
			window: { title: L("ui.confirmTitle"), icon: "fa-solid fa-triangle-exclamation" },
			content: `<p>${L("ui.confirmBody")}</p>`,
			yes: { label: L("ui.run") },
			no: { label: L("ui.back") },
			rejectClose: false,
		});
		if (!ok) return;
		await this.close();
		await processElkanUpdateForm(selection);
	}

	static #onClose() {
		this.close();
	}

	/**
	 * Shows the module checklist only while a row uses other modules, and turns the duplicate
	 * checkboxes off then (duplicates are only removed in Elkan-only runs).
	 *
	 * @override
	 */
	_onRender(context, options) {
		super._onRender?.(context, options);
		const root = this.element;
		const rows = [...root.querySelectorAll("select[data-regular]")];
		const refresh = () => {
			const modulesOn = rows.some((el) => el.value === MODULES_MODE || el.value === BOTH_MODE);
			root.querySelector(".elkan-modules-box")?.classList.toggle("is-hidden", !modulesOn);
			for (const el of root.querySelectorAll("[name='remove-duplicates'],[name='remove-duplicates-npc']"))
				el.disabled = modulesOn;
		};
		for (const el of rows) el.addEventListener("change", refresh);
		refresh();
	}

	/** @override */
	async _renderHTML() {
		return getForm();
	}

	/** @override */
	_replaceHTML(result, content) {
		content.innerHTML = result;
	}
}

/**
 * Opens the item update window.
 *
 * @returns {Promise<void>} Resolves after rendering, without waiting for input.
 */
export async function showUpdateDialog() {
	await new UpdateOptionsWindow().render({ force: true });
}

/**
 * Shows the welcome dialog when the module version changed or it has not been acknowledged.
 * Stores the current version and whether the user chose to suppress future displays;
 * closing the dialog stores false.
 *
 * @returns {Promise<void>} Promise resolution result.
 */
export async function startDialog() {
	const SAVED_VERSION = game.settings.get("elkan5e", "moduleVersion");
	const DIALOG_SHOWN = game.settings.get("elkan5e", "dialogShown");
	const MODULE_VERSION = await getModuleVersion();
	if (SAVED_VERSION !== MODULE_VERSION || !DIALOG_SHOWN) {
		let content = `
				<h2>${game.i18n.localize("elkan5e.dialog.content.header")}</h2>
				<p>${game.i18n.localize("elkan5e.dialog.content.headerText")}</p>
			`;

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
		// DialogV2.confirm resolves null when closed via the X; the setting is Boolean.
		await game.settings.set("elkan5e", "dialogShown", entryDialog === true);
		await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
	} else {
		await game.settings.set("elkan5e", "moduleVersion", MODULE_VERSION);
	}
}

/**
 * Builds the options form.
 *
 * @returns {Promise<string>} HTML for the update window.
 */
export async function getForm() {
	const groups = ROWS.map(
		({ group, rows }) => `<fieldset class="elkan-group">
			<legend>${esc(L(`form.${group}`))}</legend>
			${rows
				.map(
					([name, label, modes]) => `<label class="elkan-row">
						<span>${esc(L(`form.${label}`))}</span>
						<select name="${name}" data-regular>${[...modes, BOTH_MODE, MODULES_MODE]
							.map((m) => `<option value="${m}">${esc(L(MODE_LABEL[m]))}</option>`)
							.join("")}</select>
					</label>`,
				)
				.join("")}
		</fieldset>`,
	).join("");

	const modules = getModulesWithItemPacks();
	const moduleBox = `<fieldset class="elkan-group elkan-modules-box is-hidden">
		<legend>${esc(L("ui.modulesTitle"))}</legend>
		${
			modules.length
				? `<p class="elkan-hint">${esc(L("ui.modulesHint"))}</p>
			${modules
				.map(
					(m) =>
						`<div><label class="elkan-check"><input type="checkbox" name="extra-module" value="${esc(m.id)}"> ${esc(m.title)} <small>(${esc(L("ui.modulePacks", { count: m.packs }))})</small></label></div>`,
				)
				.join("")}`
				: `<p class="elkan-banner is-warn">${esc(L("modules.none"))}</p>`
		}
	</fieldset>`;

	const duplicates = `<fieldset class="elkan-group">
			<legend>${esc(L("ui.duplicatesTitle"))}</legend>
			<div><label class="elkan-check"><input type="checkbox" name="remove-duplicates" data-regular> ${esc(L("ui.duplicatesPlayers"))}</label></div>
			<div><label class="elkan-check"><input type="checkbox" name="remove-duplicates-npc" data-regular> ${esc(L("ui.duplicatesNpcs"))}</label></div>
			<p class="elkan-hint">${esc(L("ui.duplicatesHint"))}</p>
		</fieldset>`;

	return `<div class="elkan-options-body">
		<p>${L("ui.intro")}</p>
		<p class="elkan-banner is-warn"><i class="fa-solid fa-triangle-exclamation"></i> ${L("form.warningNote")}</p>
		${moduleBox}
		${groups}
		${duplicates}
		<footer>
			<button type="button" data-action="preview"><i class="fa-solid fa-eye"></i> ${esc(L("ui.preview"))}</button>
			<button type="button" data-action="run" class="elkan-primary"><i class="fa-solid fa-rotate"></i> ${esc(L("ui.run"))}</button>
			<button type="button" data-action="close"><i class="fa-solid fa-xmark"></i> ${esc(L("ui.close"))}</button>
		</footer>
	</div>`;
}

/**
 * The window where a player (or the GM) picks one character and updates its ancestry,
 * background, class and subclass. Players only see characters they own; the GM sees every actor.
 */
class UpdateBuildWindow extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: "elkan5e-update-build",
		classes: ["elkan5e-migration", "elkan-options"],
		tag: "section",
		window: {
			title: "elkan5e.updateElkan.build.windowTitle",
			icon: "fa-solid fa-user-gear",
			resizable: false,
		},
		position: { width: 520, height: "auto" },
		actions: {
			preview: UpdateBuildWindow.#onPreview,
			run: UpdateBuildWindow.#onRun,
			close: UpdateBuildWindow.#onClose,
		},
	};

	/**
	 * Reads the form.
	 *
	 * @returns {object|null} Selection for the update engine, or null when incomplete.
	 */
	#read() {
		const root = this.element;
		const actorId = root.querySelector('[name="build-actor"]')?.value;
		const actor = game.actors.get(actorId);
		if (!actor?.isOwner) {
			ui.notifications.info(L("build.pickActor"));
			return null;
		}
		const get = (name) => root.querySelector(`[name="${name}"]`)?.value ?? "none";
		const modes = {
			Ancestry: get("build-ancestry"),
			Background: get("build-background"),
			Class: get("build-class"),
			Subclass: get("build-subclass"),
		};
		if (Object.values(modes).every((v) => v === "none")) {
			ui.notifications.info(L("ui.nothing"));
			return null;
		}
		const selection = { scope: "elkan", extraModules: [], actorIds: [actor.id] };
		for (const [key, mode] of Object.entries(modes)) {
			selection[`actor${key}`] = actor.type === "character" ? mode : "none";
			selection[`npc${key}`] = actor.type === "character" ? "none" : mode;
		}
		return selection;
	}

	/**
	 * Runs the update, then offers the player the choices the update could not keep.
	 *
	 * @param {object} selection - Selection from the form.
	 * @param {boolean} dryRun - Preview only.
	 * @returns {Promise<void>} Resolves when done.
	 */
	async #execute(selection, dryRun) {
		await this.close();
		const report = await processElkanUpdateForm(selection, { dryRun });
		if (!dryRun) await offerPendingChoices(report);
	}

	static async #onPreview() {
		const selection = this.#read();
		if (selection) await this.#execute(selection, true);
	}

	static async #onRun() {
		const selection = this.#read();
		if (!selection) return;
		const ok = await DialogV2.confirm({
			window: { title: L("ui.confirmTitle"), icon: "fa-solid fa-triangle-exclamation" },
			content: `<p>${L("build.confirmBody")}</p>`,
			yes: { label: L("ui.run") },
			no: { label: L("ui.back") },
			rejectClose: false,
		});
		if (ok) await this.#execute(selection, false);
	}

	static #onClose() {
		this.close();
	}

	/** @override */
	async _renderHTML() {
		const actors = game.actors
			.filter((a) => a.isOwner)
			.sort((a, b) => a.name.localeCompare(b.name));
		const option = (a) => `<option value="${esc(a.id)}">${esc(a.name)}</option>`;
		const characters = actors.filter((a) => a.type === "character");
		const others = actors.filter((a) => a.type !== "character");
		const select = (name, label) => `<label class="elkan-row">
			<span>${esc(L(`build.${label}`))}</span>
			<select name="${name}">
				<option value="none">${esc(L("ui.modeNone"))}</option>
				<option value="update-Elkan">${esc(L("build.modeUpdate"))}</option>
			</select>
		</label>`;
		return `<div class="elkan-options-body">
			<p>${esc(L("build.intro"))}</p>
			<p class="elkan-banner is-warn"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(L("build.warning"))}</p>
			<fieldset class="elkan-group">
				<legend>${esc(L("build.character"))}</legend>
				<label class="elkan-row">
					<span>${esc(L("build.character"))}</span>
					<select name="build-actor">
						<option value="">${esc(L("build.pickActor"))}</option>
						${characters.length ? `<optgroup label="${esc(L("build.characters"))}">${characters.map(option).join("")}</optgroup>` : ""}
						${others.length ? `<optgroup label="${esc(L("build.npcs"))}">${others.map(option).join("")}</optgroup>` : ""}
					</select>
				</label>
				${select("build-ancestry", "ancestry")}
				${select("build-background", "background")}
				${select("build-class", "class")}
				${select("build-subclass", "subclass")}
				<p class="elkan-hint">${esc(L("build.hint"))}</p>
			</fieldset>
			<footer>
				<button type="button" data-action="preview"><i class="fa-solid fa-eye"></i> ${esc(L("ui.preview"))}</button>
				<button type="button" data-action="run" class="elkan-primary"><i class="fa-solid fa-rotate"></i> ${esc(L("ui.run"))}</button>
				<button type="button" data-action="close"><i class="fa-solid fa-xmark"></i> ${esc(L("ui.close"))}</button>
			</footer>
		</div>`;
	}

	/** @override */
	_replaceHTML(result, content) {
		content.innerHTML = result;
	}
}

/**
 * Tells the player which choices the update could not keep and lets them make those choices
 * themselves in dnd5e's own advancement window.
 *
 * @param {object} report - Report from the update.
 * @returns {Promise<void>} Resolves when the dialog is dismissed.
 */
async function offerPendingChoices(report) {
	const pending = collectPendingChoices(report);
	if (!pending.length) return;
	const rows = pending
		.map(
			(p, i) => `<li>${esc(p.label)} <button type="button" data-pending="${i}">${esc(L("build.makeChoices"))}</button></li>`,
		)
		.join("");
	await DialogV2.wait({
		window: { title: L("build.choicesTitle"), icon: "fa-solid fa-list-check" },
		content: `<p>${esc(L("build.choicesBody"))}</p><ul class="elkan-pending">${rows}</ul>`,
		buttons: [{ action: "done", label: L("ui.close"), default: true }],
		render: (_event, dialog) => {
			for (const btn of dialog.element.querySelectorAll("[data-pending]")) {
				btn.addEventListener("click", async () => {
					const p = pending[Number(btn.dataset.pending)];
					await openChoicesFor(p.actorId, p.itemId);
				});
			}
		},
		rejectClose: false,
	});
}

/**
 * Opens the single-character ancestry, background and class window.
 *
 * @returns {Promise<void>} Resolves after rendering, without waiting for input.
 */
export async function showBuildDialog() {
	await new UpdateBuildWindow().render({ force: true });
}
