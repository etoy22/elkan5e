import { registerCombatHooks } from "./combat.mjs";
import { registerEffectHooks } from "./effects.mjs";
import { registerInitHooks } from "./init.mjs";
import { registerItemHooks } from "./items.mjs";
import { registerMacros } from "./macros.mjs";
import { registerReadyHooks } from "./ready.mjs";
import { registerSystemHooks } from "./system.mjs";
import { registerTemplateHooks } from "./templates.mjs";

export function registerHooks() {
	registerInitHooks();
	registerReadyHooks();
	registerSystemHooks();
	registerEffectHooks();
	registerItemHooks();
	registerCombatHooks();
	registerTemplateHooks();
	registerMacros();
}
