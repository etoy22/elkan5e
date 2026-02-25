import { delayedItem } from "../module/classes/index.mjs";
import { updateBarbarianDefense } from "../module/rules/index.mjs";
import * as Spells from "../module/spells/index.mjs";

export function registerItemHooks() {
	// Item deletion hooks
	Hooks.on("deleteItem", async (item) => {
		try {
			await delayedItem(item);
		} catch (error) {
			console.error("Elkan 5e | Error in deleteItem hook:", error);
		}

		try {
			await Promise.resolve(Spells.goodberryDeleteItem(item));
		} catch (error) {
			console.error("Elkan 5e | Error cleaning goodberry item:", error);
		}
	});

	// Item update (Barbarian defense update)
	Hooks.on("updateItem", (item) => {
		try {
			updateBarbarianDefense(item.parent, "updateItem");
		} catch (error) {
			console.error("Elkan 5e | Error in updateItem hook:", error);
		}
	});

	// Actor update (Barbarian defense update)
	Hooks.on("updateActor", async (actor) => {
		try {
			await updateBarbarianDefense(actor, "updateActor");
		} catch (error) {
			console.error("Elkan 5e | Error in updateActor hook:", error);
		}
	});
}
