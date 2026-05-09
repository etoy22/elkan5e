import { showUpdateDialog } from "./dialog.mjs";

const { ApplicationV2 } = foundry.applications.api;

export class UpdateElkanRunner extends ApplicationV2 {
	async render(options = {}) {
		await showUpdateDialog();
		return this;
	}
}
