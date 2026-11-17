import { showBuildDialog, showUpdateDialog } from "./dialog.mjs";

const { ApplicationV2 } = foundry.applications.api;

export class UpdateElkanRunner extends ApplicationV2 {
	async render(_options = {}) {
		await showUpdateDialog();
		return this;
	}
}

export class UpdateBuildRunner extends ApplicationV2 {
	async render(_options = {}) {
		await showBuildDialog();
		return this;
	}
}
