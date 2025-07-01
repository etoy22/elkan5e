/**
 * Adds the Elkan 5e conditions to Foundry.
 */

// TODO: Automate Dodging
export function conditions() {
    // Define all condition icons and new conditions in one place
    const CONDITION_ICONS = [
        "blinded", "charmed", "cursed", "deafened", "frightened", "grappled", "incapacitated",
        "invisible", "restrained", "paralyzed", "petrified", "poisoned", "prone",
        "stunned", "unconscious"
    ];

    // New and custom conditions with references and icons
    const NEW_CONDITIONS = {
        confused: {
            name: "Confused",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V",
            img: "modules/elkan5e/icons/conditions/confused.svg"
        },
        coverhalf: {
            name: "Half Cover",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            img: "modules/elkan5e/icons/conditions/cover-half.svg",
            _id: "dnd5ecoverhalf00"
        },
        coverthreequarters: {
            name: "Three Quarters Cover",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            img: "modules/elkan5e/icons/conditions/cover-three-quarters.svg",
            _id: "dnd5ecoverthree0"
        },
        cursed: {
            name: "Cursed",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.Vpwu9GQC6HVNZFze",
            img: "modules/elkan5e/icons/conditions/cursed.svg",
            _id: "dnd5ecursed0000"
        },
        dazed: {
            name: "Dazed",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq",
            img: "modules/elkan5e/icons/conditions/dazed.svg"
        },
        drained: {
            name: "Drained",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
            img: "modules/elkan5e/icons/conditions/drained.svg"
        },
        goaded: {
            name: "Goaded",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
            img: "modules/elkan5e/icons/conditions/goaded.svg"
        },
        hasted: {
            name: "Hasted",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
            img: "modules/elkan5e/icons/conditions/hasted.svg"
        },
        obscuredheavily: {
            name: "Heavily Obscured",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn",
            img: "modules/elkan5e/icons/conditions/obscured-heavily.svg"
        },
        obscuredlightly: {
            name: "Lightly Obscured",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD",
            img: "modules/elkan5e/icons/conditions/obscured-lightly.svg"
        },
        silenced: {
            name: "Silenced",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.F51xrE7Mj8VeM3b8",
            img: "modules/elkan5e/icons/conditions/silenced.svg"
        },
        siphoned: {
            name: "Siphoned",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
            img: "modules/elkan5e/icons/conditions/siphoned.svg"
        },
        slowed: {
            name: "Slowed",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
            img: "modules/elkan5e/icons/conditions/slowed.svg"
        },
        weakened: {
            name: "Weakened",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.iJT3cWvyTNBv1L5h",
            img: "modules/elkan5e/icons/conditions/weakened.svg"
        },
        concentrating: {
            name: "Concentrating",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv",
            img: "modules/elkan5e/icons/conditions/concentrating.svg"
        },
        surprised: {
            name: "Surprised",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE",
            img: "modules/elkan5e/icons/conditions/surprised.svg"
        }
    };

    // Add new conditions to CONFIG.DND5E.conditionTypes if enabled
    const conditionsSetting = game.settings.get("elkan5e", "conditions");
    if (conditionsSetting === "a" || conditionsSetting === "b") {
        Object.assign(CONFIG.DND5E.conditionTypes, NEW_CONDITIONS);
    }

    // Set icons for all conditions
    CONDITION_ICONS.forEach(id => {
        if (CONFIG.DND5E.conditionTypes[id]) {
            CONFIG.DND5E.conditionTypes[id].img = `modules/elkan5e/icons/conditions/${id}.svg`;
        }
    });

    // Merge icons logic here
    const STATUS_ICONS = [
        "dead", "blinded", "charmed", "concentrating", "cursed", "deafened", "diseased",
        "frightened", "grappled", "incapacitated", "invisible", "paralyzed",
        "petrified", "poisoned", "prone", "restrained", "surprised", "stunned",
        "unconscious", "silenced"
    ];

    const conditionsToRemove = ["burning", "dehydration", "falling", "malnutrition", "suffocation"];
    
    const EFFECTS = {
        dead: [
            { "key": "attributes.hp.value", "mode": 5, "value": "0", "priority": null }
        ],
        blinded: [
            { "key": "flags.midi-qol.disadvantage.attack.all", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.grants.advantage.attack.all", "mode": 5, "value": "1" }
        ],
        deafened: [
            { "key": "flags.midi-qol.disadvantage.ability.check.dex", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.disadvantage.ability.save.dex", "mode": 5, "value": "1" }
        ],
        frightened: [
            { "key": "flags.midi-qol.disadvantage.attack.all", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.disadvantage.ability.check.all", "mode": 5, "value": "1" }
        ],
        incapacitated: [
            { "key": "flags.midi-qol.fail.ability.save.dex", "mode": 5, "value": "1", "priority": null },
            { "key": "flags.midi-qol.fail.ability.save.str", "mode": 5, "value": "1", "priority": null }
        ],
        invisible: [
            { "key": "flags.midi-qol.advantage.attack.all", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.grants.disadvantage.attack.all", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.advantage.skill.ste", "mode": 2, "value": "1" }
        ],
        paralyzed: [
            { "key": "flags.midi-qol.grants.advantage.attack.all", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.grants.critical.mwak", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.grants.critical.msak", "mode": 5, "value": "1" }
        ],
        petrified: [
            { "key": "flags.midi-qol.grants.advantage.attack.all", "mode": 2, "value": "1" },
            { "key": "system.traits.dr.all", "mode": 0, "value": "physical" },
            { "key": "system.traits.dr.all", "mode": 0, "value": "magical" }
        ],
        poisoned: [
            { "key": "flags.midi-qol.disadvantage.attack.all", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.disadvantage.ability.check.all", "mode": 5, "value": "1" }
        ],
        prone: [
            { "key": "flags.midi-qol.grants.advantage.attack.mwak", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.grants.advantage.attack.msak", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.grants.disadvantage.attack.rwak", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.grants.disadvantage.attack.rsak", "mode": 5, "value": "1" },
            { "key": "flags.midi-qol.disadvantage.attack.all", "mode": 5, "value": "1" }
        ],
        restrained: [
            { "key": "flags.midi-qol.disadvantage.attack.all", "mode": 5, "value": "1", "priority": null },
            { "key": "flags.midi-qol.disadvantage.ability.save.dex", "mode": 5, "value": "1", "priority": null },
            { "key": "flags.midi-qol.grants.advantage.attack.all", "mode": 5, "value": "1", "priority": null },
            { "key": "flags.midi-qol.fail.spell.somatic", "mode": 2, "value": "1", "priority": null }
        ],
        silenced: [
            { "key": "flags.midi-qol.fail.spell.verbal", "mode": 5, "value": "1" }
        ],
        stunned: [
            { "key": "flags.midi-qol.grants.advantage.attack.all", "mode": 5, "value": "1" }
        ],
        surprised: [
            { "key": "system.attributes.init.bonus", "mode": 2, "value": "-20" },
            { "key": "flags.midi-qol.disadvantage.ability.save.dex", "mode": 5, "value": "1" }
        ]
    };
    
    // Assign references for core conditions (merge from old conditionsRef)
    const CORE_CONDITIONS = [
        { key: "blinded", id: "SXTqmewRrCwPS8yW" },
        { key: "charmed", id: "ieDILSkRbu9r8pmZ" },
        { key: "deafened", id: "AHgIwuNdpp0wKF2y" },
        { key: "frightened", id: "ruwpm6lorwoPJsmt" },
        { key: "grappled", id: "zaI1nuc41wANKoFX" },
        { key: "incapacitated", id: "PXI4uoXj7x6IsDXt" },
        { key: "invisible", id: "GfTD899cLRZxGG1H" },
        { key: "paralyzed", id: "w5RoCYZIujGYuiYt" },
        { key: "petrified", id: "n0BX8pLecgm7E3uH" },
        { key: "poisoned", id: "fzEf89TZ1WN90bFv" },
        { key: "prone", id: "y8L5Uq1jMVDsQjaS" },
        { key: "restrained", id: "DiWd3u4HCD7JEw8V" },
        { key: "stunned", id: "JV8kbMo0p5S1YXUR" },
        { key: "unconscious", id: "ZwhWWUPJvpFCz8sK" },
        { key: "exhaustion", id: "mPzXN6MW8L6ePFmq" }
    ];
    function getJournalRef(id) {
        return `Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.${id}`;
    }
    CORE_CONDITIONS.forEach(({ key, id }) => {
        const reference = getJournalRef(id);
        if (CONFIG.DND5E?.conditionTypes?.[key]) {
            CONFIG.DND5E.conditionTypes[key].reference = reference;
        }
        const effect = CONFIG.statusEffects?.find(e => e.id === key);
        if (effect) {
            effect.reference = reference;
        }
    });
    // Special case for cursed
    const cursedEffect = CONFIG.statusEffects?.find(e => e.id === "cursed");
    if (cursedEffect) {
        cursedEffect.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.Vpwu9GQC6HVNZFze";
    }

    // Set icons for all status effects
    STATUS_ICONS.forEach(id => {
        const effect = CONFIG.statusEffects.find(effect => effect.id === id);
        if (effect) {
            effect.img = `modules/elkan5e/icons/conditions/${id}.svg`;
        }
    });
    if (CONFIG.DND5E.statusEffects?.coverHalf) CONFIG.DND5E.statusEffects.coverHalf.img = `modules/elkan5e/icons/conditions/cover-half.svg`;
    if (CONFIG.DND5E.statusEffects?.coverThreeQuarters) CONFIG.DND5E.statusEffects.coverThreeQuarters.img = `modules/elkan5e/icons/conditions/cover-three-quarters.svg`;
    if (CONFIG.DND5E.statusEffects?.coverTotal) CONFIG.DND5E.statusEffects.coverTotal.img = `modules/elkan5e/icons/conditions/cover-full.svg`;
    
    // Removing Unused Conditions
    if (conditionsSetting === "a" || conditionsSetting === "d") {
        conditionsToRemove.forEach(condition => {
            delete CONFIG.DND5E.conditionTypes[condition];
        });
    }
    
    
    // Applying effects
    Object.entries(EFFECTS).forEach(([id, changes]) => {
        const effect = CONFIG.statusEffects.find(effect => effect.id === id);
        if (effect) {
            effect.changes = changes;
            if (id === "surprised") {
                effect.flags = {
                    "dae": {
                        "transfer": false,
                        "stackable": "none",
                        "macroRepeat": "none",
                        "specialDuration": ["turnEnd"],
                        "durationExpression": "",
                        "selfTarget": false,
                        "selfTargetAlways": false,
                        "disableIncapacitated": true,
                        "dontApply": false,
                        "showIcon": true
                    },
                    "core": {
                        "statusId": ""
                    }
                };
            }
        }
    });
    
}

export async function conditionsReady() {
    const conditionsSetting = game.settings.get("elkan5e", "conditions");

    const UNUSED_CONDITIONS = [
        "burrowing", "ethereal", "flying", "fireShield", 
        "hidden", "hiding", "hovering", "marked", "sleeping",
        "burning", "dehydration", "falling", "malnutrition", "suffocation",
        "flanking", "flanked"
    ];
    
    const NEW_STATUS_EFFECTS = [
        {
            id: "confused",
            name: "Confused",
            _id: "dnd5econfused000",
            img: "modules/elkan5e/icons/conditions/confused.svg",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V",
            changes: [
                {
                    key: "flags.midi-qol.OverTime",
                    mode: 2,
                    value: "turn=start, label=Confused Effect, macro=Compendium.elkan5e.elkan5e-macros.Macro.HW9jG0cdn6BmhzyE"
                }
            ]
        },
        {
            id: "dazed",
            name: "Dazed",
            _id: "dnd5edazed000000",
            img: "modules/elkan5e/icons/conditions/dazed.svg",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq"
        },
        {
            id: "drained",
            name: "Drained",
            _id: "dnd5edrained0000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
            img: "modules/elkan5e/icons/conditions/drained.svg"
        },
        {
            id: "goaded",
            name: "Goaded",
            _id: "dnd5egoaded00000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
            img: "modules/elkan5e/icons/conditions/goaded.svg"
        },
        {
            id: "hasted",
            name: "Hasted",
            _id: "dnd5ehasted00000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
            img: "modules/elkan5e/icons/conditions/hasted.svg",
            changes: [
                {
                    key: "system.attributes.ac.bonus",
                    mode: 2,
                    value: "+2"
                },
                {
                    key: "system.abilities.dex.bonuses.save",
                    mode: 2,
                    value: "+2"
                },
                {
                    key: "system.attributes.movement.all",
                    mode: 0,
                    value: "*2"
                }
            ]
        },
        {
            id: "obscuredheavily",
            name: "Heavily Obscured",
            _id: "dnd5eobscuredhea",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn",
            img: "modules/elkan5e/icons/conditions/obscured-heavily.svg",
            changes: [
                {
                    key: "flags.midi-qol.advantage.attack.all",
                    mode: 5,
                    value: "1"
                },
                {
                    key: "flags.midi-qol.grants.disadvantage.attack.all",
                    mode: 5,
                    value: "1"
                },
                {
                    key: "flags.midi-qol.advantage.skill.ste",
                    mode: 2,
                    value: "1"
                }
            ]
        },
        {
            id: "obscuredlightly",
            name: "Lightly Obscured",
            _id: "dnd5eobscuredlig",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD",
            img: "modules/elkan5e/icons/conditions/obscured-lightly.svg",
            changes: [
                {
                    key: "flags.midi-qol.advantage.skill.ste",
                    mode: 2,
                    value: "1"
                }
            ]
        },
        {
            id: "coverhalf",
            name: "Half Cover",
            _id: "dnd5ecoverhalf00", // Ensure this is a valid 16-character alphanumeric ID
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            img: "modules/elkan5e/icons/conditions/cover-half.svg"
        },
        {
            id: "coverthreequarters",
            name: "Three Quarters Cover",
            _id: "dnd5ecoverthree0", // Ensure this is a valid 16-character alphanumeric ID
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            img: "modules/elkan5e/icons/conditions/cover-three-quarters.svg"
        },
        {
            id: "siphoned",
            name: "Siphoned",
            _id: "dnd5esiphoned000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
            img: "modules/elkan5e/icons/conditions/siphoned.svg",
            changes: [
                {
                    key: "flags.midi-qol.grants.advantage.attack.save",
                    mode: 5,
                    value: "1"
    
                },
                {
                    key: "flags.midi-qol.onUseMacroName",
                    mode: 0,
                    value: "Compendium.elkan5e.elkan5e-macros.Macro.4X80aHI9r8I9aSKG, preDamageApplication"
                }
            ]
        },
        {
            id: "slowed",
            name: "Slowed",
            _id: "dnd5eslowed00000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
            img: "modules/elkan5e/icons/conditions/slowed.svg",
            changes: [
                {
                    key: "flags.midi-qol.disadvantage.attack.all",
                    mode: 5,
                    value: "1"
                },
                {
                    key: "system.attributes.ac.bonus",
                    mode: 2,
                    value: "-2"
                },
                {
                    key: "system.abilities.dex.bonuses.save",
                    mode: 2,
                    value: "-2"
                }
            ]
        },
        {
            id: "weakened",
            name: "Weakened",
            _id: "dnd5eweakened000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.iJT3cWvyTNBv1L5h",
            img: "modules/elkan5e/icons/conditions/weakened.svg",
            changes: [
                {
                    key: "flags.midi-qol.disadvantage.ability.dex",
                    mode: 5,
                    value: "1"
                },
                {
                    key: "flags.midi-qol.disadvantage.ability.str",
                    mode: 5,
                    value: "1"
                },
                {
                    key: "flags.midi-qol.onUseMacroName",
                    mode: 0,
                    value: "Compendium.elkan5e.elkan5e-macros.Macro.1NtnoPvTQj1IEHCa, preDamageApplication"
                }
            ]
        },
        {
            id: "advantage",
            name: "Advantage",
            img: "icons/svg/upgrade.svg",
            changes: [
                {
                    key: "flags.midi-qol.advantage.all",
                    mode: 5,
                    value: "1"
                }
            ]
        },
        {
            id: "disadvantage",
            name: "Disadvantage",
            img: "icons/svg/downgrade.svg",
            changes: [
                {
                    key: "flags.midi-qol.disadvantage.all",
                    mode: 5,
                    value: "1"
                }
            ]
        }
    ];
    
    
    if (conditionsSetting === "a" || conditionsSetting === "d") {
        // console.log("Elkan 5e  |  Conditions before", CONFIG.statusEffects);
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => !UNUSED_CONDITIONS.includes(effect.id));
        // console.log("Elkan 5e  |  Conditions after", CONFIG.statusEffects);
    }
    if (conditionsSetting === "a" || conditionsSetting === "b") {
        // console.log("Elkan 5e  |  Adding new conditions");
        NEW_STATUS_EFFECTS.forEach(effect => CONFIG.statusEffects.push(effect));
    }

    // Ensure CONFIG.DND5E.conditionTypes exists before setting properties on it
    if (!CONFIG.DND5E.conditionTypes) CONFIG.DND5E.conditionTypes = {};
    // Ensure CONFIG.DND5E.conditionTypes["exhaustion"] exists before setting 'reduction'
    if (!CONFIG.DND5E.conditionTypes["exhaustion"]) CONFIG.DND5E.conditionTypes["exhaustion"] = {};
    if (conditionsSetting === "a" || conditionsSetting === "b") {
        const version = game.settings.get("dnd5e", "rulesVersion");
        if (version !== "modern") {
            const exhaustionEffect = CONFIG.statusEffects.find(effect => effect.id === "exhaustion");
            if (exhaustionEffect) exhaustionEffect.reduction = { "rolls": 2, "speed": 5 };
            CONFIG.DND5E.conditionTypes["exhaustion"].reduction = { "rolls": 2, "speed": 5 };
            if (CONFIG.DND5E.conditionEffects?.halfMovement) CONFIG.DND5E.conditionEffects.halfMovement.delete("exhaustion-2");
            if (CONFIG.DND5E.conditionEffects?.halfHealth) CONFIG.DND5E.conditionEffects.halfHealth.delete("exhaustion-4");
            if (CONFIG.DND5E.conditionEffects?.noMovement) CONFIG.DND5E.conditionEffects.noMovement.delete("exhaustion-5");
        }
        else{
            CONFIG.DND5E.conditionTypes["exhaustion"].reduction = {"rolls": 2, "speed": 5}
        }
    }
}


/*
 * TODO: Automate grapple and give conditions according to the size of the attacker grappler and the
 * size of the grappled. Also roll to see if the creature is actually grappled
 */
export async function grapple(workflow) {

    const grappler = workflow.actor;

    if (game.user.targets.size === 0) {
        ui.notifications.warn("You must target one or more creatures to grapple.");
        return;
    }

    const grapplerRoll = await new Roll("1d20 + @abilities.str.mod + @skills.ath.mod", grappler.getRollData()).roll({ async: true });
    await grapplerRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: grappler }),
        flavor: "Grapple Check (Athletics)"
    });

    for (const targetToken of game.user.targets) {
        const target = targetToken.actor;
        const athMod = getProperty(target, "system.skills.ath.mod") ?? 0;
        const acroMod = getProperty(target, "system.skills.acr.mod") ?? 0;
        const betterSkill = athMod >= acroMod ? "ath" : "acr";
        const targetRoll = await new Roll(`1d20 + @skills.${betterSkill}.mod`, target.getRollData()).roll({ async: true });

        await targetRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: target }),
            flavor: `Grapple Defense Check (${betterSkill === "ath" ? "Athletics" : "Acrobatics"})`
        });

        if (grapplerRoll.total > targetRoll.total) {
            ChatMessage.create({
                content: `<b>${grappler.name} grapples ${target.name}!</b>`,
                speaker: ChatMessage.getSpeaker({ actor: grappler })
            });

            const condition = CONFIG.statusEffects.find(e => e.id === "grappled");
            if (condition) {
                await targetToken.toggleEffect(condition.img, { active: true });
            }
        } else {
            ChatMessage.create({
                content: `<b>${grappler.name} fails to grapple ${target.name}.</b>`,
                speaker: ChatMessage.getSpeaker({ actor: grappler })
            });
        }
    }

}
