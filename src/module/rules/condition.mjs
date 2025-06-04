/**
 * Adds the Elkan 5e conditions to Foundry.
 */
export function conditions() {
    const CONDITION_ICONS = [
        "blinded", "charmed", "cursed", "deafened", "frightened", "grappled", "incapacitated",
        "invisible", "restrained", "paralyzed", "petrified", "poisoned", "prone",
        "stunned", "unconscious"
    ];

    const NEW_CONDITIONS = {
        confused: {
            label: "Confused",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V",
            icon: "modules/elkan5e/icons/conditions/confused.svg"
        },
        coverhalf: {
            label: "Half Cover",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            icon: "modules/elkan5e/icons/conditions/cover-half.svg",
            _id: "dnd5ecoverhalf0000" // Ensure this is a valid 16-character alphanumeric ID
        },
        coverthreequarters: {
            label: "Three Quarters Cover",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            icon: "modules/elkan5e/icons/conditions/cover-three-quarters.svg",
            _id: "dnd5ecoverthree0000" // Ensure this is a valid 16-character alphanumeric ID
        },
        cursed:{
            label: "Cursed",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.sxKTtNPUrcDvMDFj.JournalEntryPage.Vpwu9GQC6HVNZFze",
            icon: "modules/elkan5e/icons/conditions/cursed.svg",
            _id: "dnd5ecursed0000" // Ensure this is a valid 16-character alphanumeric ID
        },
        dazed: {
            label: "Dazed",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq",
            icon: "modules/elkan5e/icons/conditions/dazed.svg"
        },
        drained: {
            label: "Drained",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
            icon: "modules/elkan5e/icons/conditions/drained.svg"
        },
        goaded: {
            label: "Goaded",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
            icon: "modules/elkan5e/icons/conditions/goaded.svg"
        },
        hasted: {
            label: "Hasted",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
            icon: "modules/elkan5e/icons/conditions/hasted.svg"
        },
        obscuredheavily: {
            label: "Heavily Obscured",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn",
            icon: "modules/elkan5e/icons/conditions/obscured-heavily.svg"
        },
        obscuredlightly: {
            label: "Lightly Obscured",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD",
            icon: "modules/elkan5e/icons/conditions/obscured-lightly.svg"
        },
        silenced: {
            label: "Silenced",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.F51xrE7Mj8VeM3b8",
            icon: "modules/elkan5e/icons/conditions/silenced.svg"
        },
        siphoned: {
            label: "Siphoned",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
            icon: "modules/elkan5e/icons/conditions/siphoned.svg"
        },
        slowed: {
            label: "Slowed",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
            icon: "modules/elkan5e/icons/conditions/slowed.svg"
        },
        weakened: {
            label: "Weakened",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.iJT3cWvyTNBv1L5h",
            icon: "modules/elkan5e/icons/conditions/weakened.svg"
        },
        concentrating: {
            label: "Concentrating",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv",
            icon: "modules/elkan5e/icons/conditions/concentrating.svg"
        },
        surprised: {
            label: "Surprised",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE",
            icon: "modules/elkan5e/icons/conditions/surprised.svg"
        }
    };

    console.log("Elkan 5e  |  Initializing Conditions");
    console.log("Elkan 5e  |  Replacing Icons for Old Conditions");

    // Replace icons
    CONDITION_ICONS.forEach(id => {
        if (CONFIG.DND5E.conditionTypes[id]){
            CONFIG.DND5E.conditionTypes[id].icon = `modules/elkan5e/icons/conditions/${id}.svg`;
        }
    });

    // For now this is commented out while we work on effecting icons
    // Add conditions
    const conditions = game.settings.get("elkan5e", "conditions");
    if (conditions === "a" || conditions === "b") {
        console.log("Elkan 5e  |  Adding New Elkan Conditions");
        Object.assign(CONFIG.DND5E.conditionTypes, NEW_CONDITIONS);
    }
}

/*
* Makes the world use Elkan 5e icons
*/
export function icons() {
    const STATUS_ICONS = [
        "dead", "blinded", "charmed", "concentrating", "cursed", "deafened", "diseased",
        "frightened", "grappled", "incapacitated", "invisible", "paralyzed",
        "petrified", "poisoned", "prone", "restrained", "surprised", "stunned",
        "unconscious", "silenced"
    ];

    const UNUSED_CONDITIONS = [
        "bleeding", "burrowing", "dodging", "ethereal", "flying",
        "hidden", "hiding", "hovering", "marked", "transformed", "sleeping",
        "stable", "burning", "dehydration", "falling", "malnutrition", "suffocation",
        "flanking", "flanked"
    ];

    const conditionsToRemove = ["bleeding", "burning", "dehydration", "falling","malnutrition","suffocation"]; 

    const NEW_STATUS_EFFECTS = [
        {
            id: "confused",
            name: "Confused",
            _id: "dnd5econfused000",
            icon: "modules/elkan5e/icons/conditions/confused.svg",
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
            icon: "modules/elkan5e/icons/conditions/dazed.svg",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq"
        },
        {
            id: "drained",
            name: "Drained",
            _id: "dnd5edrained0000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
            icon: "modules/elkan5e/icons/conditions/drained.svg"
        },
        {
            id: "goaded",
            name: "Goaded",
            _id: "dnd5egoaded00000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
            icon: "modules/elkan5e/icons/conditions/goaded.svg"
        },
        {
            id: "hasted",
            name: "Hasted",
            _id: "dnd5ehasted00000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
            icon: "modules/elkan5e/icons/conditions/hasted.svg",
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
            icon: "modules/elkan5e/icons/conditions/obscured-heavily.svg",
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
            icon: "modules/elkan5e/icons/conditions/obscured-lightly.svg",
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
            icon: "modules/elkan5e/icons/conditions/cover-half.svg"
        },
        {
            id: "coverthreequarters",
            name: "Three Quarters Cover",
            _id: "dnd5ecoverthree0", // Ensure this is a valid 16-character alphanumeric ID
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            icon: "modules/elkan5e/icons/conditions/cover-three-quarters.svg"
        },
        {
            id: "siphoned",
            name: "Siphoned",
            _id: "dnd5esiphoned000",
            reference: "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
            icon: "modules/elkan5e/icons/conditions/siphoned.svg",
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
            icon: "modules/elkan5e/icons/conditions/slowed.svg",
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
            icon: "modules/elkan5e/icons/conditions/weakened.svg",
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

    const conditions = game.settings.get("elkan5e", "conditions");

    console.log("Elkan 5e  |  Initializing Icons");

    STATUS_ICONS.forEach(id => {
        if (CONFIG.statusEffects.find(effect => effect.id === id)){
            CONFIG.statusEffects.find(effect => effect.id === id).img = `modules/elkan5e/icons/conditions/${id}.svg`;
        }
    });
    
    CONFIG.statusEffects.find(effect => effect.id === "coverHalf").img = `modules/elkan5e/icons/conditions/cover-half.svg`;
    CONFIG.statusEffects.find(effect => effect.id === "coverThreeQuarters").img = `modules/elkan5e/icons/conditions/cover-three-quarters.svg`;
    CONFIG.statusEffects.find(effect => effect.id === "coverTotal").img = `modules/elkan5e/icons/conditions/cover-full.svg`;


    // Removing Unused Conditions
    if (conditions === "a" || conditions === "d") {
        console.log("Elkan 5e  |  Removing unused conditions");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => !UNUSED_CONDITIONS.includes(effect.id));
        conditionsToRemove.forEach(condition => {
            delete CONFIG.DND5E.conditionTypes[condition];
        });
    }

    // Applying effects
    Object.entries(EFFECTS).forEach(([id, changes]) => {
        if (CONFIG.statusEffects.find(effect => effect.id === id)){
            CONFIG.statusEffects.find(effect => effect.id === id).changes = changes;
            if (id === "surprised"){
                CONFIG.statusEffects.find(effect => effect.id === id).flags = {
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

    if (conditions === "a" || conditions === "b") {
        const version = game.settings.get("dnd5e", "rulesVersion");
        if (version !== "modern"){
            CONFIG.statusEffects.find(effect => effect.id === "exhaustion").reduction = {"rolls": 2, "speed": 5}
            CONFIG.DND5E.conditionTypes["exhaustion"].reduction =  {"rolls": 2, "speed": 5}
            CONFIG.DND5E.conditionEffects.halfMovement.delete("exhaustion-2")
            CONFIG.DND5E.conditionEffects.halfHealth.delete("exhaustion-4")
            CONFIG.DND5E.conditionEffects.noMovement.delete("exhaustion-5")
        }
        CONFIG.statusEffects.find(effect => effect.id === "exhaustion").changes = [
            { "key": "system.bonuses.spell.dc", "mode": 2, "value": "-2*@attributes.exhaustion" },
        ];
        
    }

    if (conditions === "a" || conditions === "b") {
        console.log("Elkan 5e  |  Adding new conditions");
        NEW_STATUS_EFFECTS.forEach(effect => CONFIG.statusEffects.push(effect));
    }
}

/*
 * TODO: Automate grapple and give conditions according to the size of the attacker grappler and the
 * size of the grappled. Also roll to see if the creature is actually grappled
 */
export async function grapple(workflow){

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
            await targetToken.toggleEffect(condition.icon, { active: true });
            }
        } else {
            ChatMessage.create({
            content: `<b>${grappler.name} fails to grapple ${target.name}.</b>`,
            speaker: ChatMessage.getSpeaker({ actor: grappler })
            });
        }
    }

}
