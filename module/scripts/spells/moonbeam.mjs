export async function moonBeam(actor){
    let spell = {
        "name": "Moonbeam [Damage]",
        "type": "spell",
        "img": "icons/magic/light/beam-rays-blue-large.webp",
        "effects": [],
        "flags": {
          "dae": {
            "activeEquipped": false,
            "alwaysActive": false,
            "macro": {
              "name": "Moonbeam [Damage]",
              "img": "icons/magic/light/beam-rays-blue-large.webp",
              "type": "script",
              "scope": "global",
              "command": "",
              "author": "vHqSHJMdmEO6Mk2C",
              "ownership": {
                "default": 3
              },
              "_id": null,
              "folder": null,
              "sort": 0,
              "flags": {},
              "_stats": {
                "systemId": null,
                "systemVersion": null,
                "coreVersion": null,
                "createdTime": null,
                "modifiedTime": null,
                "lastModifiedBy": null
              }
            }
          },
          "core": {},
          "itemacro": {
            "macro": {
              "_data": {
                "name": "Moonbeam",
                "type": "script",
                "scope": "global",
                "command": "//DAE Item Macro Execute, Effect Value = @attributes.spelldc\n\nconst lastArg = args[args.length - 1];\nlet tactor;\nif (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;\nelse tactor = game.actors.get(lastArg.actorId);\n\nconst DAEItem = lastArg.efData.flags.dae.itemData\nconst saveData = DAEItem.data.save\nconst DC = args[1]\n/**\n * Create Moonbeam item in inventory\n */\nif (args[0] === \"on\") {\n  let templateData = {\n    t: \"circle\",\n    user: game.user._id,\n    distance: 5,\n    direction: 0,\n    x: 0,\n    y: 0,\n    flags: {\n        DAESRD: {\n            Moonbeam: {\n                ActorId: tactor.id\n            }\n        }\n    },\n    fillColor: game.user.color\n}\nlet template = new game.dnd5e.canvas.AbilityTemplate(templateData)\ntemplate.actorSheet = tactor.sheet;\ntemplate.drawPreview()\n\n  let damage = DAEItem.data.level;\n  await tactor.createOwnedItem(\n    {\n      \"name\": \"Moonbeam repeating\",\n      \"type\": \"spell\",\n      \"data\": {\n        \"source\": \"Casting Moonbeam\",\n        \"ability\": \"\",\n        \"description\": {\n          \"value\": \"half damage on save\" \n        },\n        \"actionType\": \"save\",\n        \"attackBonus\": 0,\n        \"damage\": {\n          \"parts\": [\n            [\n              `${damage}d10`,\n              \"radiant\"\n            ]\n          ],\n        },\n        \"formula\": \"\",\n        \"save\": {\n          \"ability\": \"con\",\n          \"dc\": saveData.dc,\n          \"scaling\": \"spell\"\n        },\n        \"level\": 0,\n        \"school\": \"abj\",\n        \"preparation\": {\n          \"mode\": \"prepared\",\n          \"prepared\": false\n        },\n\n      },\n      \"img\": DAEItem.img,\n    }\n  );\n}\n\n// Delete Moonbeam\nif (args[0] === \"off\") {\n  let casterItem = tactor.data.items.find(i => i.name === \"Moonbeam repeating\" && i.type === \"spell\")\n  tactor.deleteOwnedItem(casterItem._id)\n  let template = canvas.templates.placeables.filter(i => i.data.flags.DAESRD?.Moonbeam?.ActorId === tactor.id)\n    canvas.templates.deleteMany(template[0].id)\n}",
                "author": "E4BVikjIkVl2lL2j"
              },
              "data": {
                "name": "Moonbeam",
                "type": "script",
                "scope": "global",
                "author": "zrPR3wueYsESSBR3",
                "_id": null,
                "img": "icons/svg/dice-target.svg",
                "folder": null,
                "sort": 0,
                "permission": {
                  "default": 0
                },
                "flags": {}
              },
              "options": {},
              "apps": {},
              "compendium": null
            }
          },
          "midi-qol": {
            "onUseMacroName": "",
            "effectActivation": false,
            "AoETargetType": "any",
            "AoETargetTypeIncludeSelf": true,
            "autoTarget": "default",
            "removeAttackDamageButtons": "default",
            "itemCondition": "",
            "reactionCondition": "",
            "otherCondition": "",
            "effectCondition": "",
            "rollAttackPerTarget": "default"
          },
          "midiProperties": {
            "nodam": false,
            "fulldam": false,
            "halfdam": false,
            "rollOther": false,
            "critOther": false,
            "magicdam": false,
            "magiceffect": false,
            "concentration": false,
            "toggleEffect": false,
            "autoFailFriendly": false,
            "autoSaveFriendly": false,
            "offHandWeapon": false,
            "ignoreTotalCover": false,
            "confirmTargets": "default",
            "noConcentrationCheck": false,
            "saveDamage": "default",
            "bonusSaveDamage": "default"
          },
          "dnd5e": {
            "migratedProperties": [
              "vocal",
              "somatic",
              "material"
            ]
          },
          "exportSource": {
            "world": "new-test",
            "system": "dnd5e",
            "coreVersion": "12.328",
            "systemVersion": "3.2.1"
          }
        },
        "system": {
          "description": {
            "value": "<p><span style=\"font-family:Signika, sans-serif\"><strong style=\"box-sizing:border-box;user-select:text\">Constitution</strong> <strong>Save</strong></span></p><p>The moonbeam targets all creatures in a 5 ft. radius, 40-foot tall cylinder centered on a point within 120 ft.</p><p>Shapeshifters (including some druids, creatures that are polymorphed or cursed into another form, and natural shapeshifters like changelings) make their saving throws against this spell with disadvantage. If a shapeshifter fails their save against this spell, they instantly revert to their original form and stay that way until they leave the light or the spell ends.</p><ul style=\"box-sizing:border-box;user-select:text;margin:0.5em 0px;padding:0px 0px 0px 1.5em;color:rgb(25, 24, 19);font-family:Signika, sans-serif;font-size:13px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:start;text-indent:0px;text-transform:none;white-space:normal;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;text-decoration-thickness:initial;text-decoration-style:initial;text-decoration-color:initial\"><li style=\"box-sizing:border-box;user-select:text\"><p style=\"box-sizing:border-box;user-select:text;margin:0.5em 0px\"><span style=\"font-family:Signika, sans-serif\"><strong style=\"box-sizing:border-box;user-select:text\">Failure:</strong> Target takes [[/damage 2d10 radiant]] damage.*</span></p></li><li style=\"box-sizing:border-box;user-select:text\"><p><span style=\"font-family:Signika, sans-serif\"><strong>Success:</strong> Half damage.</span></p></li><li><p><span style=\"font-family:Signika, sans-serif\"><strong>Area Hazard:</strong> The moonbeam remains in place, and fills the target location with &amp;reference[dimlight]. If a shapeshifter enters the light, they can't shapeshift while in the light.</span></p></li><li><p><span style=\"font-family:Signika, sans-serif\"><strong>Concentration:</strong> Once per turn, you can use your action to move the beam up to 60 ft. and deal damage to all creatures in the light at its new destination.</span></p></li></ul><p></p><p></p><div class=\"rd__b  rd__b--3\"><div class=\"rd__b  rd__b--3\"><p><span style=\"font-family:Signika, sans-serif\"><strong style=\"box-sizing:border-box;user-select:text;color:rgb(25, 24, 19);font-family:Signika, sans-serif;font-size:13px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;letter-spacing:normal;orphans:2;text-align:start;text-indent:0px;text-transform:none;white-space:normal;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;text-decoration-thickness:initial;text-decoration-style:initial;text-decoration-color:initial\">*</strong></span><strong>Upcasting</strong>: Increase damage by [[/damage 1d10 radiant]] for each spell level above 2nd.</p></div></div>",
            "chat": ""
          },
          "source": {
            "custom": "Elkan 5e"
          },
          "activation": {
            "type": "action",
            "cost": 1,
            "condition": ""
          },
          "duration": {
            "value": "",
            "units": "inst"
          },
          "cover": null,
          "crewed": false,
          "target": {
            "value": "5",
            "width": null,
            "units": "ft",
            "type": "radius",
            "prompt": true
          },
          "range": {
            "value": 120,
            "long": null,
            "units": "ft"
          },
          "uses": {
            "value": 0,
            "max": "",
            "per": null,
            "recovery": "",
            "prompt": true
          },
          "consume": {
            "type": "",
            "target": "",
            "amount": null,
            "scale": false
          },
          "ability": "",
          "actionType": "other",
          "chatFlavor": "",
          "critical": {
            "threshold": null,
            "damage": ""
          },
          "damage": {
            "parts": [
              [
                "2d10",
                "radiant"
              ]
            ],
            "versatile": ""
          },
          "formula": "",
          "save": {
            "ability": "con",
            "dc": null,
            "scaling": "spell"
          },
          "level": 2,
          "school": "evo",
          "materials": {
            "value": "",
            "consumed": false,
            "cost": 0,
            "supply": 0
          },
          "preparation": {
            "mode": "innate",
            "prepared": true
          },
          "scaling": {
            "mode": "level",
            "formula": "1d10"
          },
          "properties": [
            "vocal",
            "somatic"
          ],
          "attack": {
            "bonus": "",
            "flat": false
          },
          "enchantment": null,
          "summons": null
        }
      }
    console.log("Actor: ",actor)
    console.log("Actor Items: ",actor.items)
    actor.createEmbeddedDocuments("Item", [spell])
    .then(created => {
       console.log("Item created", created);
    })
    .catch(error => {
       console.error("Error creating item", error);
    });
}