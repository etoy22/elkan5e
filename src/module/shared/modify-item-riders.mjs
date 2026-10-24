/**
 * dnd5e 6.0's Modify Item advancement copies a feature's enchantment onto the items it modifies,
 * but doesn't apply the enchantment's activity riders yet (dnd5e issue #6357). Features such as
 * Cleansing Touch, Repelling Blast and Twin Currents rely on those riders to grant an activity to
 * the item they modify, so this module copies the rider activities across itself.
 */

const FLAG = "riderActivities";

/**
 * Finds the rider activities that should accompany an effect added by a Modify Item advancement.
 *
 * @param {ActiveEffect} effect - Effect on the modified item.
 * @returns {{originItem: Item, activityIds: string[]}|null}
 */
function findRiders(effect) {
	const item = effect?.parent;
	const actor = item?.parent;
	if (!(item instanceof CONFIG.Item.documentClass) || !actor) return null;
	const [originId] = String(effect.flags?.dnd5e?.advancementOrigin ?? "").split(".");
	const sourceId = effect.flags?.dnd5e?.sourceId ?? effect._stats?.compendiumSource ?? "";
	const sourceEffectId = String(sourceId).split(".").pop();
	if (!originId || !sourceEffectId) return null;
	const originItem = actor.items.get(originId);
	if (!originItem || originItem === item) return null;

	const activityIds = new Set();
	for (const activity of originItem.system.activities ?? []) {
		for (const entry of activity.effects ?? []) {
			if ((entry._id ?? entry.effect?.id) !== sourceEffectId) continue;
			for (const id of entry.riders?.activity ?? []) activityIds.add(id);
		}
	}
	if (!activityIds.size) return null;
	return { originItem, activityIds: [...activityIds] };
}

/**
 * Copies an advancement effect's rider activities onto the item it modifies, if they're missing.
 *
 * @param {ActiveEffect} effect - Effect on the modified item.
 * @returns {Promise<void>}
 */
export async function applyModifyItemRiders(effect) {
	const riders = findRiders(effect);
	if (!riders) return;
	const item = effect.parent;
	if (!item.isOwner) return;

	const updates = {};
	const added = [];
	const copied = (id) =>
		item.system.activities.some((a) => {
			const flags = a.flags?.elkan5e;
			if (flags?.riderOf !== effect.id) return false;
			return flags.riderSource ? flags.riderSource === id : a.id === id;
		});
	for (const id of riders.activityIds) {
		const source = riders.originItem.system.activities.get(id);
		if (!source || copied(id)) continue;
		// Rider activities often share a default id (dnd5eactivity000) with the item's own activity.
		const newId = item.system.activities.has(id) ? foundry.utils.randomID() : id;
		const data = source.toObject();
		data._id = newId;
		data.flags ??= {};
		data.flags.elkan5e = { ...(data.flags.elkan5e ?? {}), riderOf: effect.id, riderSource: id };
		updates[`system.activities.${newId}`] = data;
		added.push(newId);
	}
	if (!added.length) return;
	await item.update(updates);
	const existing = effect.getFlag("elkan5e", FLAG) ?? [];
	await effect.setFlag("elkan5e", FLAG, [...new Set([...existing, ...added])]);
}

/**
 * Removes the rider activities that were copied for an advancement effect when it's deleted.
 *
 * @param {ActiveEffect} effect - Deleted effect.
 * @returns {Promise<void>}
 */
export async function removeModifyItemRiders(effect) {
	const ids = effect?.flags?.elkan5e?.[FLAG];
	const item = effect?.parent;
	if (!ids?.length || !(item instanceof CONFIG.Item.documentClass) || !item.isOwner) return;
	for (const id of ids) {
		const activity = item.system.activities.get(id);
		if (activity?.flags?.elkan5e?.riderOf === effect.id) await activity.delete();
	}
}

/**
 * Adds missing rider activities to items that were modified before this workaround existed.
 * Runs once on the active GM's client.
 *
 * @returns {Promise<void>}
 */
export async function backfillModifyItemRiders() {
	if (!game.user?.isGM || game.users.activeGM?.id !== game.user.id) return;
	for (const actor of game.actors) {
		for (const item of actor.items) {
			for (const effect of item.effects) {
				if (!effect.flags?.dnd5e?.advancementOrigin) continue;
				try {
					await applyModifyItemRiders(effect);
				} catch (error) {
					console.warn(
						"Elkan 5e | Could not add rider activities for",
						effect.uuid,
						error,
					);
				}
			}
		}
	}
}

/**
 * Adds missing rider activities on one actor's items. Called after an advancement completes, since
 * the effects it adds may not fire createActiveEffect on the modified items.
 *
 * @param {Actor} actor - Actor that just advanced.
 * @returns {Promise<void>}
 */
export async function applyActorModifyItemRiders(actor) {
	if (!actor?.isOwner) return;
	for (const item of actor.items) {
		for (const effect of item.effects) {
			if (effect.flags?.dnd5e?.advancementOrigin) await applyModifyItemRiders(effect);
		}
	}
}
