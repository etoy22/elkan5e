(async () => {
  let eventData = event.data
  // Remove the initial sequence of numbers before the valid JSON array
  let jsonStartIndex = eventData.indexOf('[{');
  if (jsonStartIndex !== -1) {
      eventData = eventData.substring(jsonStartIndex);
  }
  let data = JSON.parse(eventData)


  if (data[0]["action"] == "create"){

    //Get Cast Level
    let castLevel = data[0]["operation"]["metaData"]["flags"]["midi-qol"]["castData"]["castLevel"]
    //Get Damage (For Moonbeam Specifically)
    let damage =  castLevel+"d10"
    let spell = {
    "name": "Moonbeam [Damage]",
    "type": "spell",
    "img": "icons/magic/light/beam-rays-blue-large.webp",
    "effects": [],
    "flags": {
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
      "dnd5e": {
        "migratedProperties": [
          "vocal",
          "somatic",
          "material"
        ]
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
            damage,
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
      "level": castLevel,
      "school": "evo",
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
    let idToDelete = actor.items.find(item => item.name === "Moonbeam [Damage]")._id;
    actor.deleteEmbeddedDocuments("Item", [idToDelete])
    .then(deletedItems => {
        console.log("Item deleted:", deletedItems);
    })
    .catch(error => {
        console.error("Error deleting item:", error);
    });
  }
})();