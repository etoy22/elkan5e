(async () => {
    let eventData = event.data
    // Remove the initial sequence of numbers before the valid JSON array
    let jsonStartIndex = eventData.indexOf('[{');
    if (jsonStartIndex !== -1) {
        eventData = eventData.substring(jsonStartIndex);
    }
    let data = JSON.parse(eventData)


    if (data[0]["action"] == "create"){
      console.log(data[0])
      //Get Cast Level
      let castLevel = data[0]["operation"]["metaData"]["flags"]["midi-qol"]["castData"]["castLevel"]
      //Get Damage (Expand Range)
      let range = castLevel * 20
      let spell = {
        "name": "Fog Cloud [Area]",
        "type": "spell",
        "img": "icons/magic/air/air-wave-gust-smoke-yellow.webp",
        "effects": [],
        "folder": null,
        "flags": {
          "midi-qol": {
            "AoETargetType": "any",
            "AoETargetTypeIncludeSelf": true,
            "autoTarget": "default",
            "effectActivation": false,
            "itemCondition": "",
            "reactionCondition": "",
            "otherCondition": "",
            "effectCondition": "",
            "rollAttackPerTarget": "default"
          },
          "midiProperties": {
            "confirmTargets": "default",
            "autoFailFriendly": false,
            "autoSaveFriendly": false,
            "critOther": false,
            "offHandWeapon": false,
            "magicdam": false,
            "magiceffect": false,
            "concentration": false,
            "noConcentrationCheck": false,
            "toggleEffect": false,
            "ignoreTotalCover": false
          },
          "dae": {
            "macro": {
              "name": "Fog Cloud [Area]",
              "img": "icons/magic/air/air-wave-gust-smoke-yellow.webp",
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
                "coreVersion": "12.328",
                "systemId": "dnd5e",
                "systemVersion": "3.2.1",
                "createdTime": null,
                "modifiedTime": null,
                "lastModifiedBy": null,
                "compendiumSource": null,
                "duplicateSource": null
              }
            }
          },
          "dnd5e": {
            "migratedProperties": [
              "vocal",
              "somatic",
              "concentration"
            ]
          }
        },
        "system": {
          "description": {
            "value": "<div class=\"rd__b  rd__b--2\"><p><em>You call upon the power of water, forming a fog cloud where you reach out your hand.</em></p><p style=\"box-sizing:border-box;user-select:text;margin:0.5em 0px;color:rgb(25, 24, 19);font-family:Signika, sans-serif;font-size:13px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;font-weight:400;letter-spacing:normal;orphans:2;text-indent:0px;text-transform:none;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;white-space:normal;text-decoration-thickness:initial;text-decoration-style:initial;text-decoration-color:initial;text-align:start\"><span style=\"font-family:Signika, sans-serif\"><strong style=\"box-sizing:border-box;user-select:text\">Utility Spell</strong></span></p><ul><li><p>You create a 20-foot-radius sphere of fog centered on a point within range. The sphere spreads around corners.</p></li><li><p><span style=\"font-family:Signika, sans-serif\"><strong style=\"box-sizing:border-box;user-select:text;color:rgb(25, 24, 19);font-family:Signika, sans-serif;font-size:13px;font-style:normal;font-variant-ligatures:normal;font-variant-caps:normal;letter-spacing:normal;orphans:2;text-align:start;text-indent:0px;text-transform:none;widows:2;word-spacing:0px;-webkit-text-stroke-width:0px;white-space:normal;text-decoration-thickness:initial;text-decoration-style:initial;text-decoration-color:initial\">Area Hazard:</strong> The </span>area is heavily obscured. It lasts for the duration or until a wind of moderate or greater speed (at least 10 miles per hour) disperses it. This spell also doesn't function underwater.</p></li></ul></div><div class=\"rd__b  rd__b--3\"><div class=\"rd__b  rd__b--3\"><p></p><p><strong>Upcasting:</strong> <span style=\"font-family:Signika, sans-serif\">The radius of the spell increases by 20 ft.</span> for each spell level above 1st level.</p></div></div>",
            "chat": ""
          },
          "source": {
            "custom": "elkan5e.com/spells/fog-cloud"
          },
          "activation": {
            "type": "action",
            "cost": 1,
            "condition": ""
          },
          "duration": {
            "value": "1",
            "units": "minute"
          },
          "cover": null,
          "crewed": false,
          "target": {
            "value": range,
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
            "value": null,
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
          "ability": null,
          "actionType": "",
          "chatFlavor": "",
          "critical": {
            "threshold": null,
            "damage": ""
          },
          "damage": {
            "parts": [],
            "versatile": ""
          },
          "formula": "",
          "save": {
            "ability": "",
            "dc": null,
            "scaling": "spell"
          },
          "level": castLevel,
          "school": "con",
          "materials": {
            "value": "",
            "consumed": false,
            "cost": 0,
            "supply": 0
          },
          "preparation": {
            "mode": "atwill",
            "prepared": true
          },
          "scaling": {
            "mode": "level",
            "formula": ""
          },
          "properties": [
            "vocal",
            "somatic",
            "mgc"
          ],
          "attack": {
            "bonus": "",
            "flat": false
          },
          "uses": {
            "value": 1,
            "max": "1",
            "per": "charges",
            "recovery": "",
            "prompt": true
          },
          "enchantment": null,
          "summons": null
        }
      };
    actor.createEmbeddedDocuments("Item", [spell])
      .then(created => {
        console.log("Item created", created);
      })
      .catch(error => {
        console.error("Error creating item", error);
      });
    }
    else if(data[0]["action"] == "delete"){
      let effect = actor.effects.find(item => item.name === "Fog Cloud [Area] Template")
      console.log("Information: ", actor.effects.find(item => item.name === "Fog Cloud [Area] Template"))
      if (effect){
          actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id])
          .then(deleted => {
            console.log("Effect deleted", deleted);
          })
          .catch(error => {
             console.error("Error deleting effect", error);
          });
      }
      let idToDelete = actor.items.find(item => item.name === "Fog Cloud [Area]")._id;
      actor.deleteEmbeddedDocuments("Item", [idToDelete])
      .then(deletedItems => {
          console.log("Item deleted:", deletedItems);
      })
      .catch(error => {
          console.error("Error deleting item:", error);
      });
    }
})();