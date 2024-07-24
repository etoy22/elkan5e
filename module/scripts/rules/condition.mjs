/**
 * Adds the Elkan 5e conditions to Foundry.
 */
export function conditions(){
    console.log("Elkan 5e  |  Initializing Conditions")
    console.log("Elkan 5e  |  Replacing Icons for Old Conditions")
    //Replace icons
    CONFIG.DND5E.conditionTypes.blinded.icon = "modules/elkan5e/icons/blinded.svg "
    CONFIG.DND5E.conditionTypes.charmed.icon = "modules/elkan5e/icons/charmed.svg"
    CONFIG.DND5E.conditionTypes.deafened.icon = "modules/elkan5e/icons/deafened.svg"
    CONFIG.DND5E.conditionTypes.frightened.icon = "modules/elkan5e/icons/frightened.svg"
    CONFIG.DND5E.conditionTypes.grappled.icon = "modules/elkan5e/icons/grappled.svg"
    CONFIG.DND5E.conditionTypes.incapacitated.icon = "modules/elkan5e/icons/incapacitated.svg"
    CONFIG.DND5E.conditionTypes.invisible.icon = "modules/elkan5e/icons/invisible.svg"
    CONFIG.DND5E.conditionTypes.restrained.icon = "modules/elkan5e/icons/restrained.svg"
    CONFIG.DND5E.conditionTypes.paralyzed.icon = "modules/elkan5e/icons/paralyzed.svg"
    CONFIG.DND5E.conditionTypes.petrified.icon = "modules/elkan5e/icons/petrified.svg"
    CONFIG.DND5E.conditionTypes.poisoned.icon = "modules/elkan5e/icons/poisoned.svg"
    CONFIG.DND5E.conditionTypes.prone.icon = "modules/elkan5e/icons/prone.svg"
    CONFIG.DND5E.conditionTypes.stunned.icon = "modules/elkan5e/icons/stunned.svg"
    CONFIG.DND5E.conditionTypes.unconscious.icon = "modules/elkan5e/icons/unconscious.svg"
    

    
    //For now this is commented out while we work on effecting icons
    //Add conditions
    const conditions = game.settings.get("elkan5e", "conditions");
    const exhaustion = game.settings.get("elkan5e", "conditions-exhaustion");
    if (conditions == "a" || conditions == "b"){
        console.log("Elkan 5e  |  Adding New Elkan Conditions")
        CONFIG.DND5E.conditionTypes.confused = {
            label:"Confused",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V",
            icon:"modules/elkan5e/icons/confused.svg"
        }
        CONFIG.DND5E.conditionTypes.coverhalf = {
            label:"Half Cover",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            icon:"modules/elkan5e/icons/cover-half.svg"
        }
        CONFIG.DND5E.conditionTypes.coverthreequarters = {
            label:"Three Quarters Cover",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            icon:"modules/elkan5e/icons/cover-three-quarters.svg"
        }
        CONFIG.DND5E.conditionTypes.dazed = {
            label:"Dazed",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq",
            icon:"modules/elkan5e/icons/dazed.svg"
        }
        CONFIG.DND5E.conditionTypes.dominated = {
            label: "Dominated",
            statuses:["Charmed"],
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0OYaVPznKqYgchW9",
            icon:"modules/elkan5e/icons/dominated.svg"
        };
        CONFIG.DND5E.conditionTypes.drained = {
            label: "Drained",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
            icon:"modules/elkan5e/icons/drained.svg"
        };
        CONFIG.DND5E.conditionTypes.goaded = {
            label: "Goaded",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
            icon:"modules/elkan5e/icons/goaded.svg"
        };
        CONFIG.DND5E.conditionTypes.hasted = {
            label: "Hasted",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
            icon:"modules/elkan5e/icons/hasted.svg"
        };
        CONFIG.DND5E.conditionTypes.obscuredheavily = {
            label: "Heavily Obscured",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn",
            icon:"modules/elkan5e/icons/obscured-heavily.svg"
        };
        CONFIG.DND5E.conditionTypes.obscuredlightly = {
            label: "Lightly Obscured",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD",
            icon:"modules/elkan5e/icons/obscured-lightly.svg"
        };
        CONFIG.DND5E.conditionTypes.silenced = {
            label: "Silenced",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.F51xrE7Mj8VeM3b8",
            icon:"modules/elkan5e/icons/silenced.svg"
        };
        CONFIG.DND5E.conditionTypes.siphoned = {
            label: "Siphoned",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
            icon:"modules/elkan5e/icons/siphoned.svg"
        };
        CONFIG.DND5E.conditionTypes.slowed = {
            label: "Slowed",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
            icon:"modules/elkan5e/icons/slowed.svg"
        };
        
        CONFIG.DND5E.conditionTypes.weakened = {
            label: "Weakened",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.iJT3cWvyTNBv1L5h",
            icon:"modules/elkan5e/icons/weakened.svg",
        };
        
        CONFIG.DND5E.conditionTypes.concentrating = {
            label: "Concentrating",
            reference:"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.4ZOHN6tGvj54J6Kv",
            icon: "modules/elkan5e/icons/concentrating.svg"
        }
        CONFIG.DND5E.conditionTypes.surprised = {
            label: "Surprised",
            icon: "modules/elkan5e/icons/surprised.svg"
        }

        if (!exhaustion){
            CONFIG.DND5E.conditionTypes.surprised.reference = "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.QOZeW0m8RCdVg6UE"
        }
    }
}


/*
* Makes the world use Elkan 5e icons
*/
export function icons(){
    const conditions = game.settings.get("elkan5e", "conditions");
    const exhaustion = game.settings.get("elkan5e", "conditions-exhaustion");

    console.log("Elkan 5e  |  Initializing Icons")
    CONFIG.statusEffects.find(effect => effect.id === "dead").img= "modules/elkan5e/icons/dead.svg"
    CONFIG.statusEffects.find(effect => effect.id === "blinded").img= "modules/elkan5e/icons/blinded.svg"
    CONFIG.statusEffects.find(effect => effect.id === "charmed").img= "modules/elkan5e/icons/charmed.svg"
    CONFIG.statusEffects.find(effect => effect.id === "concentrating").img= "modules/elkan5e/icons/concentrating.svg"
    CONFIG.statusEffects.find(effect => effect.id === "deafened").img= "modules/elkan5e/icons/deafened.svg"
    CONFIG.statusEffects.find(effect => effect.id === "diseased").img= "modules/elkan5e/icons/diseased.svg"
    CONFIG.statusEffects.find(effect => effect.id === "frightened").img= "modules/elkan5e/icons/frightened.svg"
    CONFIG.statusEffects.find(effect => effect.id === "grappled").img= "modules/elkan5e/icons/grappled.svg"
    CONFIG.statusEffects.find(effect => effect.id === "incapacitated").img= "modules/elkan5e/icons/incapacitated.svg"
    CONFIG.statusEffects.find(effect => effect.id === "invisible").img= "modules/elkan5e/icons/invisible.svg"
    CONFIG.statusEffects.find(effect => effect.id === "paralyzed").img= "modules/elkan5e/icons/paralyzed.svg"
    CONFIG.statusEffects.find(effect => effect.id === "petrified").img= "modules/elkan5e/icons/petrified.svg"
    CONFIG.statusEffects.find(effect => effect.id === "poisoned").img= "modules/elkan5e/icons/poisoned.svg"
    CONFIG.statusEffects.find(effect => effect.id === "prone").img= "modules/elkan5e/icons/prone.svg"
    CONFIG.statusEffects.find(effect => effect.id === "restrained").img= "modules/elkan5e/icons/restrained.svg"
    CONFIG.statusEffects.find(effect => effect.id === "surprised").img= "modules/elkan5e/icons/surprised.svg"
    CONFIG.statusEffects.find(effect => effect.id === "stunned").img= "modules/elkan5e/icons/stunned.svg"
    CONFIG.statusEffects.find(effect => effect.id === "unconscious").img= "modules/elkan5e/icons/unconscious.svg"
    CONFIG.statusEffects.find(effect => effect.id === "silenced").img="modules/elkan5e/icons/silenced.svg"
    
    // //Removing Unused Conditions
    if (conditions == "a" || conditions == "d"){
        console.log("Elkan 5e  |  Removing unused conditions")
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "bleeding");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "burrowing");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "cursed");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "dodging");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "ethereal");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "flying");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "hidden");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "hiding");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "hovering");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "marked");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "transformed");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "sleeping");
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => effect.id !== "stable");
    }


    //Applying effects
    CONFIG.statusEffects.find(effect => effect.id === "dead").changes = [
        {
            "key": "attributes.hp.value",
            "mode": 5,
            "value": "0",
            "priority": null
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "blinded").changes = [
        {
            "key": "flags.midi-qol.disadvantage.attack.all",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.grants.advantage.attack.all",
            "mode": 5,
            "value": "1"
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "deafened").changes = [
        {
            "key": "flags.midi-qol.disadvantage.ability.check.dex",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.disadvantage.ability.save.dex",
            "mode": 5,
            "value": "1"
        }
    ]
    
    if (!exhaustion){
        CONFIG.statusEffects.find(effect => effect.id === "exhaustion").changes = [
            {
                "key": "system.bonuses.All-Attacks",
                "mode": 2,
                "value": "-2*@attributes.exhaustion"
            },
            {
                "key": "system.bonuses.spell.dc",
                "mode": 2,
                "value": "-2*@attributes.exhaustion"
            },
            {
                "key": "system.bonuses.abilities.skill",
                "mode": 2,
                "value": "-2*@attributes.exhaustion"
            },
            {
                "key": "system.bonuses.abilities.save",
                "mode": 2,
                "value": "-2*@attributes.exhaustion"
            }
        ]
    }
    
    CONFIG.statusEffects.find(effect => effect.id === "frightened").changes = [
        {
            "key": "flags.midi-qol.disadvantage.attack.all",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.disadvantage.ability.check.all",
            "mode": 5,
            "value": "1"
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "incapacitated").changes = [
        {
            "key": "flags.midi-qol.fail.ability.save.dex",
            "mode": 5,
            "value": "1",
            "priority": null
        },
        {
            "key": "flags.midi-qol.fail.ability.save.str",
            "mode": 5,
            "value": "1",
            "priority": null
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "invisible").changes = [
        {
            "key": "flags.midi-qol.advantage.attack.all",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.grants.disadvantage.attack.all",
            "mode": 5,
            "value": "1"
        },
        {
            "key":"flags.midi-qol.advantage.skill.ste",
            "mode":2,
            "value":"1"
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "paralyzed").changes = [
        {
            "key": "flags.midi-qol.grants.advantage.attack.all",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.grants.critical.mwak",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.grants.critical.msak",
            "mode": 5,
            "value": "1"
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "petrified").changes = [
        {
            "key": "flags.midi-qol.grants.advantage.attack.all",
            "mode": 2,
            "value": "1"
        },
        {
            "key": "system.traits.dr.all",
            "mode": 0,
            "value": "physical"
        },
        {
            "key": "system.traits.dr.all",
            "mode": 0,
            "value": "magical"
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "poisoned").changes = [
        {
            "key": "flags.midi-qol.disadvantage.attack.all",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.disadvantage.ability.check.all",
            "mode": 5,
            "value": "1"
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "prone").changes = [
        {
            "key": "flags.midi-qol.grants.advantage.attack.mwak",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.grants.advantage.attack.msak",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.grants.disadvantage.attack.rwak",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.grants.disadvantage.attack.rsak",
            "mode": 5,
            "value": "1"
        },
        {
            "key": "flags.midi-qol.disadvantage.attack.all",
            "mode": 5,
            "value": "1"
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "restrained").changes = [
        {
            "key": "flags.midi-qol.disadvantage.attack.all",
            "mode": 5,
            "value": "1",
            "priority": null
        },
        {
            "key": "flags.midi-qol.disadvantage.ability.save.dex",
            "mode": 5,
            "value": "1",
            "priority": null
        },
        {
            "key": "flags.midi-qol.grants.advantage.attack.all",
            "mode": 5,
            "value": "1",
            "priority": null
        },
        {
            "key": "flags.midi-qol.fail.spell.somatic",
            "mode": 2,
            "value": "1",
            "priority": null
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "silenced").changes = [
        {
            "key": "flags.midi-qol.fail.spell.verbal",
            "mode": 5,
            "value": "1"
        }
    ]
    
    CONFIG.statusEffects.find(effect => effect.id === "stunned").changes = [
        {
            "key": "flags.midi-qol.grants.advantage.attack.all",
            "mode": 5,
            "value": "1"
        }
    ]
    
    
    CONFIG.statusEffects.find(effect => effect.id === "surprised").changes = [
        {
            "key": "system.attributes.init.bonus",
            "mode": 2,
            "value": "-20"
        },
        {
            "key": "flags.midi-qol.disadvantage.ability.save.dex",
            "mode": 5,
            "value": "1"
        }
    ]
    
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
    }

    if(conditions == "a" || conditions == "b"){
        // Adding New Conditions
        console.log("Elkan 5e  |  Adding new conditions")
        CONFIG.statusEffects.push({
            "id": "coverhalf",
            "name": "Half Cover",
            "_id": "dnd5ecoverhalf00",
            "icon": "modules/elkan5e/icons/cover-half.svg",
            "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            "changes": [
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
            ]
        });

        CONFIG.statusEffects.push({
            "id": "coverthreequarters",
            "name": "Three Quarrters Cover",
            "_id": "dnd5ecoverthreec",
            "icon": "modules/elkan5e/icons/cover-three-quarters.svg",
            "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.1BmTbnT3xDPqv9dq",
            "changes": [
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
            ]
        });

        CONFIG.statusEffects.push({
            "id": "confused",
            "name": "Confused",
            "_id": "dnd5econfused000",
            "icon": "modules/elkan5e/icons/confused.svg",
            "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.WJFtNc5UraHVrV5V",
            "changes": [
                {
                "key": "flags.midi-qol.OverTime",
                "mode": 2,
                "value": "turn=start, label=Confused Effect, macro=Compendium.elkan5e.elkan5e-macros.Macro.HW9jG0cdn6BmhzyE"
                }
            ],
            "macros": [
                {
                "id": "",
                "type": "apply"
                },
                {
                "id": "",
                "type": "remove"
                }
            ]
        });

        CONFIG.statusEffects.push({
            "id": "dazed",
            "name": "Dazed",
            "_id": "dnd5edazed000000",
            "icon": "modules/elkan5e/icons/dazed.svg",
            "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0BYyVwipnS55gVFq"
        });
        
        CONFIG.statusEffects.push({
            "id": "dominated",
            "name": "Dominated",
            "_id": "dnd5edominated00",
            "icon": "modules/elkan5e/icons/dominated.svg",
            "reference": "Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.0OYaVPznKqYgchW9"
        });
        CONFIG.statusEffects.push({
            "id":"drained",
            "name": "Drained",
            "_id": "dnd5edrained0000",
            "reference":"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.ZnhMIMgPZv1QDxzZ",
            "icon":"modules/elkan5e/icons/drained.svg"
        });

        CONFIG.statusEffects.push({
            "id":"goaded",
            "name": "Goaded",
            "_id": "dnd5egoaded00000",
            "reference":"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.IVZ318d1P8WBcDxN",
            "icon":"modules/elkan5e/icons/goaded.svg"
        });

        CONFIG.statusEffects.push({
            "id":"hasted",
            "name": "Hasted",
            "_id": "dnd5ehasted00000",
            "reference":"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.8dnyv0szJi7dCz74",
            "icon":"modules/elkan5e/icons/hasted.svg",
            "changes": [
                {
                    "key": "system.attributes.ac.bonus",
                    "mode": 2,
                    "value": "+2"
                },
                {
                    "key": "system.abilities.dex.bonuses.save",
                    "mode": 2,
                    "value": "+2"
                },
                {
                    "key": "system.attributes.movement.all",
                    "mode": 0,
                    "value": "*2"
                }
            ]
        });

        CONFIG.statusEffects.push({
            "id":"obscuredheavily",
            "name": "Heavily Obscured",
            "_id": "dnd5eobscuredhea",
            "reference":"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.UC5VK6i6vqWEUfMn",
            "icon":"modules/elkan5e/icons/obscured-heavily.svg",
            "changes": [
                {
                    "key": "flags.midi-qol.advantage.attack.all",
                    "mode": 5,
                    "value": "1"
                },
                {
                    "key": "flags.midi-qol.grants.disadvantage.attack.all",
                    "mode": 5,
                    "value": "1"
                },
                {
                    "key":"flags.midi-qol.advantage.skill.ste",
                    "mode":2,
                    "value":"1"
                }

            ]
        });
        
        CONFIG.statusEffects.push({
            "id":"obscuredlightly",
            "name": "Lightly Obscured",
            "_id": "dnd5eobscuredlig",
            "reference":"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.Jq7kMUlHodqSbYDD",
            "icon":"modules/elkan5e/icons/obscured-lightly.svg",
            "changes": [
                {
                    "key":"flags.midi-qol.advantage.skill.ste",
                    "mode":2,
                    "value":"1"
                },

            ]
        });
        
        CONFIG.statusEffects.push({
            "id":"siphoned",
            "name": "Siphoned",
            "_id": "dnd5esiphoned000",
            "reference":"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.SthB8javJuFySiBg",
            "icon":"modules/elkan5e/icons/siphoned.svg"
        });
        
        CONFIG.statusEffects.push({
            "id":"slowed",
            "name": "Slowed",
            "_id": "dnd5eslowed00000",
            "reference":"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.kkbgHooTzrtu4q8T",
            "icon":"modules/elkan5e/icons/slowed.svg",
            "changes":[
                {
                    "key": "flags.midi-qol.disadvantage.attack.all",
                    "mode": 5,
                    "value": "1"
                },
                {
                    "key": "system.attributes.ac.bonus",
                    "mode": 2,
                    "value": "-2"
                },
                {
                    "key": "system.abilities.dex.bonuses.save",
                    "mode": 2,
                    "value": "-2"
                }
            ]
        });
        
        CONFIG.DND5E.conditionEffects.halfMovement.add("slowed")
        
        CONFIG.statusEffects.push({
            "id":"weakened",
            "name": "Weakened",
            "_id": "dnd5eweakened000",
            "reference":"Compendium.elkan5e.elkan5e-rules.JournalEntry.eS0uzU55fprQJqIt.JournalEntryPage.iJT3cWvyTNBv1L5h",
            "icon":"modules/elkan5e/icons/weakened.svg",
            "changes": [
                {
                    "key": "flags.midi-qol.disadvantage.ability.dex",
                    "mode": 5,
                    "value": "1"
                },
                {
                    "key": "flags.midi-qol.disadvantage.ability.str",
                    "mode": 5,
                    "value": "1"
                }
            ]
        });
    }
    

    //Remove the exhaustion effects 
    // TODO: Add exhaustion 1 and 3 when they are added
    if (!exhaustion){
        CONFIG.DND5E.conditionEffects.halfMovement.delete("exhaustion-2")
        CONFIG.DND5E.conditionEffects.halfHealth.delete("exhaustion-4")
        CONFIG.DND5E.conditionEffects.noMovement.delete("exhaustion-5")
    }
    

    CONFIG.statusEffects.sort((a, b) => {
        if (a.id === "dead" && b.id !== "dead") {
            return -1;
        }
        if (a.id !== "dead" && b.id === "dead") {
            return 1;
        }
        return a.id.localeCompare(b.id);
    });
    

    
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
 * Adds functionality to Sturdy to give advantage on saves via prone.   
 */
export function sturdy(){
}