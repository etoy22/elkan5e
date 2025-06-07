export async function deleteGoodberryEffect(item) {
    if (item.name === game.i18n.localize("elkan5e.spell.GoodberryItem")) {
        await deletedItemRemovesEffect(item, game.i18n.localize("elkan5e.spell.Goodberry"));
    }
}