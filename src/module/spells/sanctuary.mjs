// export async function sanctuary(actor, target) {
//     // Check if the target already has the Sanctuary effect
//     const sanct = target.effects.find(effect => effect.name === "Sanctuary");
//     if (sanct) {
//         const caster = game.actors.get(sanct._source.origin.split(".")[1]);
//         let DC = caster.system.attributes.spelldc;
//         const roll = await new Roll(`1d20 + ${actor.system.abilities.wis.save}`).roll({async: true});
//         await roll.toMessage({
//             speaker: ChatMessage.getSpeaker({ actor: actor }),
//             flavor: `${actor.name} attempts to bypass ${target.name}'s Sanctuary with a Wisdom saving throw (DC ${DC})`
//         });
//         if (roll.total > DC) {
//             return true; // Sanctuary effect bypassed
//         } else {
//             return false; // Sanctuary effect not bypassed
//         }
//     }
//     return true; // No Sanctuary effect present
// }
