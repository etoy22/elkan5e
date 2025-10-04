import { gameSettingRegister } from "./module/gameSettings/gameSettingRegister.mjs";
import { startDialog } from "./module/gameSettings/dialog.mjs";
import { initWarlockSpellSlot } from "./module/classes/warlock.mjs";
import { secondWind } from "./module/classes/fighter.mjs";
import { healingOverflow, infusedHealer } from "./module/classes/cleric.mjs";
import { archDruid } from "./module/classes/druid.mjs";
import { rage, wildBlood } from "./module/classes/barbarian.mjs";
import { delayedDuration, delayedItem, wildSurge } from "./module/classes/sorcerer.mjs";
import {
	elementalAttunement,
	hijackShadow,
	meldWithShadows,
	rmvMeldShadow,
	rmvhijackShadow,
} from "./module/classes/monk.mjs";
import { slicingBlow } from "./module/classes/rogue.mjs";
import { lifeDrainGraveguard, spectralEmpowerment } from "./module/classes/wizard.mjs";

import { armor, updateBarbarianDefense } from "./module/rules/armor.mjs";
import { conditions, conditionsReady, grapple, push } from "./module/rules/condition.mjs";
import { language } from "./module/rules/language.mjs";
import { formating } from "./module/rules/format.mjs";
import { tools } from "./module/rules/tools.mjs";
import { weapons } from "./module/rules/weapon.mjs";
import { scroll } from "./module/rules/scroll.mjs";
import {
	setupCombatReferences,
	setupDamageReferences,
	setupSpellcastingReferences,
	setupCreatureTypeReferences,
} from "./module/rules/references.mjs";

import * as Spells from "./module/spells.mjs";
import * as Feats from "./module/feats.mjs";
import { skills } from "./module/rules/skills.mjs";

//Remove this text when poll is over
const POLL_URL =
	"https://docs.google.com/forms/d/e/1FAIpQLSdl_E6udYqbRS_KJ0eLta1mIS54yCWUNiOQUTJwFZ9TR7CcNA/viewform?usp=dialog";

Hooks.once("ready", async () => {
	// Only the first active GM should run this
	if (!game.user.isGM) return;

	// Remove any previous poll messages so the latest one is shown every load
	const previousPolls = (game.messages?.contents ?? []).filter((m) => m.flags?.elkan5e?.poll);
	if (previousPolls.length) {
		try {
			await ChatMessage.deleteDocuments(previousPolls.map((m) => m.id));
		} catch (error) {
			console.warn("Elkan 5e | Failed to clear previous poll messages", error);
		}
	}

	// Create the poll message
	await ChatMessage.create({
		speaker: {
			alias: "Elkan 5e - Poll",
			icon: "modules/elkan5e/images/ElkanLogo.webp",
		},
		content: `
      <div class="elkan5e-poll-card">
		<h4>We'd love your input!</h4>
		<p>We're looking at restructuring our Foundry VTT Compendiums. Some of these changes may be disruptive, so your feedback is especially valuable. Please take this quick poll to share your opinion.</p>
		<button type="button" class="elkan5e-poll-btn" data-url="${POLL_URL}">
			Open Poll
		</button>
	</div>

    `,
		flags: { elkan5e: { poll: true } },
	});
});

// Attach click handler when chat message is rendered
Hooks.on("renderChatMessage", (message, html) => {
	if (!message.flags?.elkan5e?.poll) return;

	html.find(".elkan5e-poll-btn").on("click", (ev) => {
		ev.preventDefault();
		const url = ev.currentTarget.dataset.url || POLL_URL;
		if (url) window.open(url, "_blank", "noopener");
	});
});

Hooks.once("init", async () => {
	try {
		console.log("Elkan 5e | Initializing Elkan 5e");
		await gameSettingRegister();

		initWarlockSpellSlot();

		// Initialize rule systems
		conditions();
		tools();
		weapons();
		armor();
		language();
		formating();
		scroll();
		skills();
		// Setup references
		setupCombatReferences();
		setupDamageReferences();
		setupSpellcastingReferences();
		setupCreatureTypeReferences();
	} catch (error) {
		console.error("Elkan 5e  |  Initialization Error:", error);
	}
});

Hooks.once("ready", () => {
	try {
		conditionsReady();
		startDialog();
	} catch (error) {
		console.error("Elkan 5e | Ready Hook Error:", error);
	}
});

// Hit die customization
Hooks.on("dnd5e.preRollHitDieV2", (config) => {
	try {
		Feats.undeadNature(config);
	} catch (error) {
		console.error("Elkan 5e | Error in preRollHitDieV2 hook:", error);
	}
});

// Post-use activity (Sorcerer wild surge)
Hooks.on("dnd5e.postUseActivity", (activity) => {
	try {
		wildSurge(activity);
	} catch (error) {
		console.error("Elkan 5e | Error in postUseActivity hook:", error);
	}
});

// Initiative pre-roll (Druid archdruid)
Hooks.on("dnd5e.preRollInitiative", (actor) => {
	try {
		archDruid(actor);
	} catch (error) {
		console.error("Elkan 5e | Error in preRollInitiative hook:", error);
	}
});

// Active effect deletion hooks
Hooks.on("deleteActiveEffect", async (effect) => {
	try {
		await delayedDuration(effect);
	} catch (error) {
		console.error("Elkan 5e | Error in deleteActiveEffect hook:", error);
	}
});

// Item deletion hooks
Hooks.on("deleteItem", async (item) => {
	try {
		delayedItem(item);
	} catch (error) {
		console.error("Elkan 5e | Error in deleteItem hook:", error);
	}
});

// End of turn (Monk shadow meld cleanup)
Hooks.on("combatTurnChange", (combat, prior) => {
	try {
		const lastActor = combat.combatants.get(prior.combatantId).actor;
		rmvMeldShadow(lastActor);
		rmvhijackShadow(lastActor);
	} catch (error) {
		console.error("Elkan 5e | Error in combatTurnChange hook:", error);
	}
});

// Item update (Barbarian defense update)
Hooks.on("updateItem", (item) => {
	try {
		updateBarbarianDefense(item.parent, "updateItem");
	} catch (error) {
		console.error("Elkan 5e | Error in updateItem hook:", error);
	}
});

// Actor update (Barbarian defense update)
Hooks.on("updateActor", async (actor) => {
	try {
		await updateBarbarianDefense(actor, "updateActor");
	} catch (error) {
		console.error("Elkan 5e | Error in updateActor hook:", error);
	}
});

// Goodberry & size effects cleanup
Hooks.on("deleteActiveEffect", (effect) => {
	Spells.goodberryDeleteActive(effect);
	Spells.returnToNormalSize(effect);
});

Hooks.on("deleteItem", (item) => {
	Spells.goodberryDeleteItem(item);
});

// Template movement synchronization
Hooks.on("updateMeasuredTemplate", async (template) => {
	const lights = canvas.lighting.placeables.filter(
		(l) => l.document.getFlag("elkan5e", "linkedTemplate") === template.id,
	);
	if (!lights.length) return;
	for (const light of lights) {
		await light.document.update({ x: template.x, y: template.y });
	}
});

Hooks.on("deleteMeasuredTemplate", async (template) => {
	const lights = canvas.lighting.placeables.filter(
		(l) => l.document.getFlag("elkan5e", "linkedTemplate") === template.id,
	);
	if (!lights.length) return;
	const ids = lights.map((l) => l.id);
	await canvas.scene.deleteEmbeddedDocuments("AmbientLight", ids);
});

// Expose macros
globalThis.elkan5e = {
	macros: {
		spells: Spells,
		features: {
			grapple,
			push,
			rage,
			infusedHealer,
			healingOverflow,
			wildBlood,
			secondWind,
			hijackShadow,
			meldWithShadows,
			slicingBlow,
			elementalAttunement,
		},
		monsterFeatures: {
			lifeDrainGraveguard,
			spectralEmpowerment,
		},
	},
};
