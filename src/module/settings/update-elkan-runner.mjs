import { showUpdateDialog } from "./dialog.mjs";

export class UpdateElkanRunner extends FormApplication {
	/**
	 * Override _render to call your dialog and prevent the form from rendering
	 * @returns {Promise<boolean>} Return false to prevent rendering
	 */
	async _render(..._args) {
		showUpdateDialog(); // call your function
		return false; // block the actual render
	}
}
