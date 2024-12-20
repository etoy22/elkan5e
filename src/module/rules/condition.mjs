/**
 * Adds the Elkan 5e conditions to Foundry.
 */
export function conditions() {
    console.log("Elkan 5e  |  Initializing Conditions");
    console.log("Elkan 5e  |  Replacing Icons for Old Conditions");

    // Replace icons
    const conditionIcons = [
        "blinded", "charmed", "deafened", "frightened", "grappled", "incapacitated",
        "invisible", "restrained", "paralyzed", "petrified", "poisoned", "prone",
        "stunned", "unconscious"
    ];
    conditionIcons.forEach(id => {
        CONFIG.DND5E.conditionTypes[id].icon = `modules/elkan5e/icons/${id}.svg`;
    });

    // For now this is commented out while we work on effecting icons
    // Add conditions
    const conditions = game.settings.get("elkan5e", "conditions");
    const exhaustion = game.settings.get("elkan5e", "conditions-exhaustion");
    if (conditions === "a" || conditions === "b") {
        console.log("Elkan 5e  |  Adding New Elkan Conditions");
        const newConditions = {
            confused: {
                label: "Confused",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V",
                icon: "modules/elkan5e/icons/confused.svg"
            },
            coverhalf: {
                label: "Half Cover",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
                icon: "modules/elkan5e/icons/cover-half.svg"
            },
            coverthreequarters: {
                label: "Three Quarters Cover",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
                icon: "modules/elkan5e/icons/cover-three-quarters.svg"
            },
            dazed: {
                label: "Dazed",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq",
                icon: "modules/elkan5e/icons/dazed.svg"
            },
            dominated: {
                label: "Dominated",
                statuses: ["Charmed"],
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0OYaVPznKqYgchW9",
                icon: "modules/elkan5e/icons/dominated.svg"
            },
            drained: {
                label: "Drained",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
                icon: "modules/elkan5e/icons/drained.svg"
            },
            goaded: {
                label: "Goaded",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
                icon: "modules/elkan5e/icons/goaded.svg"
            },
            hasted: {
                label: "Hasted",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
                icon: "modules/elkan5e/icons/hasted.svg"
            },
            obscuredheavily: {
                label: "Heavily Obscured",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn",
                icon: "modules/elkan5e/icons/obscured-heavily.svg"
            },
            obscuredlightly: {
                label: "Lightly Obscured",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD",
                icon: "modules/elkan5e/icons/obscured-lightly.svg"
            },
            silenced: {
                label: "Silenced",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.F51xrE7Mj8VeM3b8",
                icon: "modules/elkan5e/icons/silenced.svg"
            },
            siphoned: {
                label: "Siphoned",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
                icon: "modules/elkan5e/icons/siphoned.svg"
            },
            slowed: {
                label: "Slowed",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
                icon: "modules/elkan5e/icons/slowed.svg"
            },
            weakened: {
                label: "Weakened",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.iJT3cWvyTNBv1L5h",
                icon: "modules/elkan5e/icons/weakened.svg"
            },
            concentrating: {
                label: "Concentrating",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv",
                icon: "modules/elkan5e/icons/concentrating.svg"
            },
            surprised: {
                label: "Surprised",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE",
                icon: "modules/elkan5e/icons/surprised.svg"
            }
        };
        Object.assign(CONFIG.DND5E.conditionTypes, newConditions);
    }
}

/*
* Makes the world use Elkan 5e icons
*/
export function icons() {
    const conditions = game.settings.get("elkan5e", "conditions");
    const exhaustion = game.settings.get("elkan5e", "conditions-exhaustion");

    console.log("Elkan 5e  |  Initializing Icons");

    const statusIcons = [
        "dead", "blinded", "charmed", "concentrating", "deafened", "diseased",
        "frightened", "grappled", "incapacitated", "invisible", "paralyzed",
        "petrified", "poisoned", "prone", "restrained", "surprised", "stunned",
        "unconscious", "silenced"
    ];
    statusIcons.forEach(id => {
        CONFIG.statusEffects.find(effect => effect.id === id).img = `modules/elkan5e/icons/${id}.svg`;
    });
    
    CONFIG.statusEffects.find(effect => effect.id === "coverHalf").img = `modules/elkan5e/icons/cover-half.svg`;
    CONFIG.statusEffects.find(effect => effect.id === "coverThreeQuarters").img = `modules/elkan5e/icons/cover-three-quarters.svg`;
    CONFIG.statusEffects.find(effect => effect.id === "coverTotal").img = `modules/elkan5e/icons/cover-full.svg`;

    CONFIG.statusEffects.find(effect => effect.id === "coverHalf").changes = [
        {
            "key": "system.abilities.dex.bonuses.save",
            "mode": 2,
            "value": "+2"
        },
        {
            "key": "system.attributes.ac.bonus",
            "mode": 2,
            "value": "+2"
        }
    ];

    CONFIG.statusEffects.find(effect => effect.id === "coverThreeQuarters").changes = [
        {
            "key": "system.abilities.dex.bonuses.save",
            "mode": 2,
            "value": "+5"
        },
        {
            "key": "system.attributes.ac.bonus",
            "mode": 2,
            "value": "+5"
        }
    ];

    // Removing Unused Conditions
    if (conditions === "a" || conditions === "d") {
        console.log("Elkan 5e  |  Removing unused conditions");
        const unusedConditions = [
            "bleeding", "burrowing", "cursed", "dodging", "ethereal", "flying",
            "hidden", "hiding", "hovering", "marked", "transformed", "sleeping",
            "stable", "burning", "dehydration", "falling", "malnutrition", "suffocation"
        ];
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => !unusedConditions.includes(effect.id));
    }

    // Applying effects
    const effects = {
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
    Object.entries(effects).forEach(([id, changes]) => {
        CONFIG.statusEffects.find(effect => effect.id === id).changes = changes;
    });

    CONFIG.statusEffects.find(effect => effect.id === "surprised").flags = {
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

    if (!exhaustion) {
        CONFIG.statusEffects.find(effect => effect.id === "exhaustion").changes = [
            { "key": "system.bonuses.All-Attacks", "mode": 2, "value": "-2*@attributes.exhaustion" },
            { "key": "system.bonuses.spell.dc", "mode": 2, "value": "-2*@attributes.exhaustion" },
            { "key": "system.bonuses.abilities.skill", "mode": 2, "value": "-2*@attributes.exhaustion" },
            { "key": "system.bonuses.abilities.save", "mode": 2, "value": "-2*@attributes.exhaustion" }
        ];
    }

    if (conditions === "a" || conditions === "b") {
        console.log("Elkan 5e  |  Adding new conditions");
        const newStatusEffects = [
            {
                id: "confused",
                name: "Confused",
                _id: "dnd5econfused000",
                icon: "modules/elkan5e/icons/confused.svg",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V",
                changes: [
                    {
                        key: "flags.midi-qol.OverTime",
                        mode: 2,
                        value: "turn=start, label=Confused Effect, macro=Compendium.elkan5e.elkan5e-macros.Macro.HW9jG0cdn6BmhzyE"
                    }
                ],
                macros: [
                    { id: "", type: "apply" },
                    { id: "", type: "remove" }
                ]
            },
            {
                id: "dazed",
                name: "Dazed",
                _id: "dnd5edazed000000",
                icon: "modules/elkan5e/icons/dazed.svg",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq"
            },
            {
                id: "dominated",
                name: "Dominated",
                _id: "dnd5edominated00",
                icon: "modules/elkan5e/icons/dominated.svg",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0OYaVPznKqYgchW9"
            },
            {
                id: "drained",
                name: "Drained",
                _id: "dnd5edrained0000",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
                icon: "modules/elkan5e/icons/drained.svg"
            },
            {
                id: "goaded",
                name: "Goaded",
                _id: "dnd5egoaded00000",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
                icon: "modules/elkan5e/icons/goaded.svg"
            },
            {
                id: "hasted",
                name: "Hasted",
                _id: "dnd5ehasted00000",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
                icon: "modules/elkan5e/icons/hasted.svg",
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
                icon: "modules/elkan5e/icons/obscured-heavily.svg",
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
                icon: "modules/elkan5e/icons/obscured-lightly.svg",
                changes: [
                    {
                        key: "flags.midi-qol.advantage.skill.ste",
                        mode: 2,
                        value: "1"
                    }
                ]
            },
            {
                id: "siphoned",
                name: "Siphoned",
                _id: "dnd5esiphoned000",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
                icon: "modules/elkan5e/icons/siphoned.svg"
            },
            {
                id: "slowed",
                name: "Slowed",
                _id: "dnd5eslowed00000",
                reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
                icon: "modules/elkan5e/icons/slowed.svg",
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
                icon: "modules/elkan5e/icons/weakened.svg",
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
                    }
                ]
            },
            {
                id: "advantage",
                name: "Advantage",
                icon: "icons/svg/upgrade.svg",
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
                icon: "icons/svg/downgrade.svg",
                changes: [
                    {
                        key: "flags.midi-qol.disadvantage.all",
                        mode: 5,
                        value: "1"
                    }
                ]
            }
        ];
        newStatusEffects.forEach(effect => CONFIG.statusEffects.push(effect));
    }
}

/**
 * TODO: Adds functionality to Fey Ancestry to gain advantage on saves against charmed.
 *   
 */
export function feyAncest(){
}

/*
 * TODO: Automate grapple and give conditions according to the size of the attacker grappler and the
 * size of the grappled. Also roll to see if the creature is actually grappled
 */
export function grapple(){
    console.log("Grapple")
}

/**
 * TODO: Adds functionality to Dwarven Resilience to give advantage on saves via poison. Probably need to use midi to automate
 * maybe with looking at there overtime effects and how to mix that 
 */
export function dwarfResil(){

}

/**
 * TODO: Add Functionality
 * Adds functionality to Sturdy to give advantage on saves via prone.   
 */
export function sturdy(){
}