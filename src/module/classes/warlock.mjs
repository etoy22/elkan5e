export function initWarlockSpellSlot (){
    CONFIG.DND5E.spellcastingTypes.leveled.progression.warlock = {
      label: 'Elkan Warlock',
      img: 'icons/consumables/potions/bottle-round-corked-orante-red.webp'
    };
    CONFIG.DND5E.spellProgression.warlock = 'Elkan Warlock';
    Hooks.on('elkan5e.computeWarlockProgression', computeProgression);
    Hooks.on('elkan5e.prepareWarlockSlots', prepareSlots);
}  

export function computeProgression(progression, actor, cls, spellcasting, count) {
    progression.warlock ??= 0;
    progression.warlock += spellcasting.levels;
}

function prepareSlots(spells, actor, progression) {
    const WARLOCK_SPELL_SLOT_TABLE = {
        0: [2],
        1: [2],
        2: [2, 1],
        3: [2, 2],
        4: [2, 2, 1],
        5: [2, 2, 2],
        6: [2, 2, 2, 1],
        7: [2, 2, 2, 1],
        8: [2, 2, 2, 2, 1],
        9: [2, 2, 2, 2, 1],
        10: [2, 2, 2, 2, 1, 1],
        11: [2, 2, 2, 2, 1, 1],
        12: [2, 2, 2, 2, 1, 1, 1],
        13: [2, 2, 2, 2, 1, 1, 1],
        14: [2, 2, 2, 2, 1, 1, 1, 1],
        15: [2, 2, 2, 2, 1, 1, 1, 1],
        16: [2, 2, 2, 2, 1, 1, 1, 1, 1],
        17: [2, 2, 2, 2, 1, 1, 1, 1, 1],
        18: [2, 2, 2, 2, 2, 1, 1, 1, 1],
        19: [2, 2, 2, 2, 2, 1, 1, 1, 1]
    };
    CONFIG.Actor.documentClass.prototype.prepareAltSlots.call(actor, spells, actor, progression, 'Elkan Warlock', WARLOCK_SPELL_SLOT_TABLE);
}