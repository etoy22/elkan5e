import { showUpdateDialog } from "./dialog.mjs";

export class UpdateElkanRunner extends FormApplication {
  render(...args) {
    showUpdateDialog(); // Call your function
    return this; // Prevent further rendering
  }
}