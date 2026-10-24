/**
 * Audits the compendium source JSON (packs/_source) for problems that load without errors but
 * break automation in Foundry v14, dnd5e 6 and Midi-QOL 14. Each check comes from a real bug.
 *
 *   node scripts/audit-packs.mjs            Errors and warnings
 *   node scripts/audit-packs.mjs --errors   Errors only
 *   node scripts/audit-packs.mjs --strict   Exit with code 1 when there are errors
 *   node scripts/audit-packs.mjs --dir=PATH Audit another copy of packs/_source
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const dirArg = process.argv.find((a) => a.startsWith("--dir="));
const PACKS = dirArg ? path.resolve(dirArg.slice(6)) : path.join(ROOT, "packs", "_source");
const SRC = path.join(ROOT, "src");
const args = new Set(process.argv.slice(2));

/**
 * Recursively lists paths ending in the requested suffix.
 *
 * @param {string} dir - Directory to search.
 * @param {string} ext - File suffix, including the leading dot for extensions.
 * @returns {string[]} Matching file paths.
 * @throws {Error} If a directory cannot be read.
 */
const walk = (dir, ext) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) return walk(p, ext);
		return p.endsWith(ext) ? [p] : [];
	});

// ---------- Load documents ----------
const docs = [];
for (const file of walk(PACKS, ".json")) {
	try {
		const doc = JSON.parse(fs.readFileSync(file, "utf8"));
		const pack = path.relative(PACKS, file).split(path.sep)[0];
		docs.push({ file: path.relative(ROOT, file).replaceAll("\\", "/"), pack, doc });
	} catch {
		// Parse errors are reported by validate-packs-json.mjs.
	}
}

// Every UUID the module's compendiums can resolve.
const uuids = new Set();
/**
 * Infers the Foundry document type from a pack source's `_key`, defaulting to Item.
 *
 * @param {object} doc - Parsed pack source.
 * @returns {string} Document type used in its compendium UUID.
 */
const typeOf = (doc) =>
	doc._key?.startsWith("!actors!")
		? "Actor"
		: doc._key?.startsWith("!macros!")
			? "Macro"
			: doc._key?.startsWith("!tables!")
				? "RollTable"
				: doc._key?.startsWith("!journal!")
					? "JournalEntry"
					: doc._key?.startsWith("!effects!")
						? "ActiveEffect"
						: "Item";
for (const { pack, doc } of docs) {
	if (!doc._id) continue;
	const base = `Compendium.elkan5e.${pack}.${typeOf(doc)}.${doc._id}`;
	uuids.add(base);
	// The older form without the document type still resolves.
	uuids.add(`Compendium.elkan5e.${pack}.${doc._id}`);
	for (const e of doc.effects ?? []) uuids.add(`${base}.ActiveEffect.${e._id}`);
	for (const it of doc.items ?? []) {
		uuids.add(`${base}.Item.${it._id}`);
		for (const e of it.effects ?? []) uuids.add(`${base}.Item.${it._id}.ActiveEffect.${e._id}`);
	}
	for (const pg of doc.pages ?? []) uuids.add(`${base}.JournalEntryPage.${pg._id}`);
}

// Names the module exports for macros (elkan5e.macros.<group>.<name>).
const srcText = walk(SRC, ".mjs")
	.map((f) => fs.readFileSync(f, "utf8"))
	.join("\n");
const exported = new Set(
	[
		...srcText.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let)\s+([A-Za-z0-9_$]+)/g),
	].map((m) => m[1]),
);
const mainText = fs.readFileSync(path.join(SRC, "elkan5e.mjs"), "utf8");
const macroBlock = mainText.slice(mainText.indexOf("globalThis.elkan5e"));
for (const m of macroBlock.matchAll(/^\s*([A-Za-z0-9_$]+)\s*[:,]/gm)) exported.add(m[1]);

// Status ids (dnd5e core plus Elkan's).
const statusIds = new Set([
	...[
		...fs
			.readFileSync(path.join(SRC, "module/rules/condition/data.mjs"), "utf8")
			.matchAll(/\bid:\s*"([a-zA-Z]+)"/g),
	].map((m) => m[1]),
	..."blinded charmed deafened diseased exhaustion frightened grappled incapacitated invisible paralyzed petrified poisoned prone restrained stunned unconscious dead bleeding burrowing concentrating cursed dodging encumbered ethereal exceedingCarryingCapacity flying heavilyEncumbered hiding hovering marked sleeping silenced surprised transformed raging rangerMark stable".split(
		" ",
	),
]);

// ---------- Rules ----------
const findings = [];
/**
 * Appends an audit finding for the final report.
 *
 * @param {string} level - Finding severity, such as "error" or "warn".
 * @param {string} code - Check identifier used to group findings.
 * @param {string} where - Document or field location label.
 * @param {string} message - Problem description.
 * @returns {number} Number of findings after the append.
 */
const report = (level, code, where, message) => findings.push({ level, code, where, message });

// ActiveEffect duration units Foundry v14 accepts (CONST.ACTIVE_EFFECT_DURATION_UNITS).
const VALID_UNITS = new Set([
	"years",
	"months",
	"days",
	"hours",
	"minutes",
	"seconds",
	"rounds",
	"turns",
]);
// Custom-type changes on these numeric bonus fields are never applied (Rage, Bless, Jarl's Shield).
const CUSTOM_IGNORED =
	/^system\.(rolls\.|bonuses\.|abilities\.[a-z]+\.bonuses\.|skills\.[a-z]+\.bonuses\.|attributes\.ac\.bonus)/;
const SENSES =
	/^system\.attributes\.senses\.(ranges\.(darkvision|blindsight|tremorsense|truesight)|units|special)$/;
const MOVEMENT =
	/^system\.attributes\.movement\.(speeds\.(walk|burrow|climb|fly|swim|crawl|jump)|multiplier|hover|all|units|ignoredDifficultTerrain|special|bonus)$/;
const LEGACY_MOVE = /^system\.attributes\.movement\.(walk|burrow|climb|fly|swim|jump)$/;
const LEGACY_SENSE = /^system\.attributes\.senses\.(darkvision|blindsight|tremorsense|truesight)$/;
const ATTACK_PHASES =
	/\[(preCheckHits|preAttackRoll|postAttackRoll|preAttackRollConfig|isHit|isMissed)\]/;
const UUID_RE =
	/Compendium\.elkan5e\.[a-z0-9-]+\.(?:Item|Actor|Macro|RollTable|JournalEntry|ActiveEffect)\.[A-Za-z0-9]{16}(?:\.(?:Item|ActiveEffect|JournalEntryPage)\.[A-Za-z0-9]{16})*/g;

/**
 * Checks one item (top-level or embedded in an actor).
 *
 * @param {object} item - Item source data.
 * @param {string} where - Location label for findings.
 */
function auditItem(item, where) {
	const sys = item.system ?? {};
	const effects = new Map((item.effects ?? []).map((e) => [e._id, e]));
	const activities = Object.values(sys.activities ?? {});
	const identifiers = new Set(
		activities.flatMap((a) => [
			a._id,
			a.type,
			a.midiProperties?.identifier,
			(a.name ?? "").toLowerCase().replace(/\s+/g, "-"),
		]),
	);
	const linked = new Set();

	for (const a of activities) {
		const label = `${where} [${a.name || a.type}]`;
		for (const link of a.effects ?? []) {
			linked.add(link._id);
			if (link.uuid) {
				if (link.uuid.startsWith("Compendium.elkan5e.") && !uuids.has(link.uuid))
					report(
						"error",
						"remote-effect-missing",
						label,
						`links missing effect ${link.uuid}`,
					);
			} else if (!effects.has(link._id)) {
				report(
					"error",
					"effect-link-missing",
					label,
					`links effect ${link._id}, which isn't on the item`,
				);
			}
			for (const r of link.riders?.activity ?? [])
				if (!sys.activities?.[r])
					report("warn", "rider-missing", label, `rider activity ${r} isn't on the item`);
			for (const r of link.riders?.effect ?? [])
				if (!effects.has(r))
					report("warn", "rider-missing", label, `rider effect ${r} isn't on the item`);
		}
		if (a.type === "save" && !(a.save?.ability ?? []).some(Boolean))
			report("error", "save-no-ability", label, "save activity has no ability");
		const trig = a.midiProperties?.triggeredActivityId;
		if (trig && trig !== "none" && !identifiers.has(trig))
			report(
				"warn",
				"trigger-missing",
				label,
				`triggered activity "${trig}" isn't on the item`,
			);
		for (const rule of a.regionBehavior?.rules ?? []) {
			if (rule.action === "applyEffect") {
				if (!effects.has(rule.targetId))
					report(
						"error",
						"region-rule-target",
						label,
						`area rule applies effect "${rule.targetId}", which isn't on the item`,
					);
			} else if (rule.action && rule.action !== "useActivity")
				report(
					"error",
					"region-rule-action",
					label,
					`area rule action "${rule.action}" isn't supported by Midi-QOL 14 (only useActivity and applyEffect) and is ignored; applyEffect removes its effect when the creature leaves`,
				);
			else if (rule.targetId && !identifiers.has(rule.targetId))
				report(
					"error",
					"region-rule-target",
					label,
					`area rule targets "${rule.targetId}", which isn't on the item`,
				);
		}
		for (const b of a.behaviors ?? [])
			for (const u of b.config?.effects ?? [])
				if (u.startsWith("Compendium.elkan5e.") && !uuids.has(u))
					report(
						"error",
						"behavior-effect-missing",
						label,
						`area applies missing effect ${u}`,
					);
		for (const t of a.consumption?.targets ?? [])
			if (t.target?.startsWith?.("Compendium.elkan5e.") && !uuids.has(t.target))
				report("error", "consumption-missing", label, `consumes missing item ${t.target}`);
		const cmd = a.macroData?.command ?? "";
		checkMacroText(cmd, label);
	}

	for (const e of item.effects ?? []) {
		const label = `${where} > effect "${e.name}"`;
		const units = e.duration?.units;
		if (units != null && !VALID_UNITS.has(units))
			report(
				"error",
				"duration-units",
				label,
				`duration units "${units}" aren't valid (use plural, e.g. "hours")`,
			);
		const conditions = e.system?.conditions;
		const hasConditions =
			conditions &&
			(typeof conditions === "string"
				? !["", "{}", "[]"].includes(conditions.replace(/\s/g, ""))
				: Object.keys(conditions).length);
		if (hasConditions && !e.transfer && e.type !== "enchantment")
			report(
				"error",
				"conditional-not-passive",
				label,
				"has activation conditions (e.g. while raging) but isn't a passive (transfer) effect, so it never applies on its own",
			);
		if (e.transfer && linked.has(e._id))
			report(
				"warn",
				"transfer-and-linked",
				label,
				"is passive but also applied by an activity; dnd5e turns transfer off for activity effects",
			);
		for (const s of e.statuses ?? [])
			if (!statusIds.has(s))
				report("warn", "unknown-status", label, `status "${s}" isn't a known condition`);
		for (const sp of e.flags?.dae?.specialDuration ?? [])
			if (/^turn(Start|End)(Source)?$/.test(sp))
				report(
					"warn",
					"retired-special-duration",
					label,
					`uses DAE's retired special duration "${sp}"; use the duration's expiry`,
				);
		for (const c of e.system?.changes ?? []) {
			const k = c.key ?? "";
			const v = String(c.value ?? "");
			const where2 = `${label}: ${k}`;
			if (!k) report("error", "empty-key", label, "change with an empty key");
			if (c.type === "custom" && CUSTOM_IGNORED.test(k))
				report(
					"error",
					"custom-ignored",
					where2,
					"custom type on a system field is ignored by dnd5e 6; use add/override",
				);
			if (
				c.phase === "final" &&
				/movement\.(speeds|multiplier|walk|fly|swim|climb|burrow)|senses\.(ranges|darkvision)/.test(
					k,
				)
			)
				report(
					"error",
					"final-phase-movement",
					where2,
					"final phase runs after speed/senses are prepared; use initial",
				);
			if (/^macro\.actorUpdate$/.test(k) && /number \+\d/.test(v))
				report(
					"error",
					"actorupdate-plus",
					where2,
					`"${v}": the + makes it a string; use "number N"`,
				);
			if (/^system\.bonuses\.heal\./.test(k))
				report(
					"error",
					"no-heal-bonus",
					where2,
					"dnd5e 6 has no actor healing bonus; this does nothing",
				);
			if (/^system\.attributes\.senses\./.test(k) && !SENSES.test(k) && !LEGACY_SENSE.test(k))
				report("error", "bad-senses-key", where2, "not a dnd5e senses field (typo?)");
			if (
				/^system\.attributes\.movement\./.test(k) &&
				!MOVEMENT.test(k) &&
				!LEGACY_MOVE.test(k)
			)
				report("error", "bad-movement-key", where2, "not a dnd5e movement field (typo?)");
			if (LEGACY_MOVE.test(k) || LEGACY_SENSE.test(k))
				report(
					"warn",
					"legacy-key",
					where2,
					"pre-6.0 key; dnd5e migrates it, but the 6.0 key is speeds.*/ranges.*",
				);
			for (const u of v.match(UUID_RE) ?? [])
				if (!uuids.has(u))
					report("error", "missing-uuid", where2, `references missing ${u}`);
		}
	}

	// ModifyItem advancement must point at enchantments on the item.
	for (const adv of Object.values(sys.advancement ?? {})) {
		if (adv?.type !== "ModifyItem") continue;
		for (const ch of adv.configuration?.changes ?? []) {
			const e = effects.get(ch._id);
			if (!e)
				report(
					"error",
					"modifyitem-missing",
					where,
					`ModifyItem change ${ch._id} isn't an effect on the item`,
				);
			else if (e.type !== "enchantment")
				report(
					"error",
					"modifyitem-type",
					where,
					`ModifyItem effect "${e.name}" isn't an enchantment`,
				);
		}
	}
	for (const adv of Object.values(sys.advancement ?? {}))
		for (const it of adv?.configuration?.items ?? [])
			if (it.uuid?.startsWith("Compendium.elkan5e.") && !uuids.has(it.uuid))
				report(
					"error",
					"advancement-missing",
					where,
					`advancement grants missing ${it.uuid}`,
				);

	// Midi-QOL on-use macros.
	const flags = item.flags ?? {};
	const onUse = flags["midi-qol"]?.onUseMacroName ?? "";
	const hasAttack = activities.some((a) => a.type === "attack");
	for (const part of onUse
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)) {
		const name = part.replace(/^\[[^\]]*\]/, "");
		if (/^ItemMacro/.test(name) && !flags.dae?.macro?.command)
			report("error", "itemmacro-empty", where, `calls ItemMacro but the item has no macro`);
		else if (/^ActivityMacro-/.test(name)) {
			const act = sys.activities?.[name.slice("ActivityMacro-".length)];
			if (!act)
				report(
					"error",
					"activitymacro-missing",
					where,
					`calls ${name}, which isn't on the item`,
				);
			else if (!act.macroData?.command)
				report("error", "activitymacro-empty", where, `${name} has no macro`);
		} else if (!/^(ItemMacro|ActivityMacro|Compendium\.|function\.)/.test(name))
			report(
				"error",
				"external-macro",
				where,
				`calls macro "${name}", which the module doesn't provide`,
			);
		if (ATTACK_PHASES.test(part) && !hasAttack)
			report(
				"warn",
				"attack-phase-no-attack",
				where,
				`runs at ${part.match(ATTACK_PHASES)[0]} but has no attack activity, so it never runs`,
			);
	}
	checkMacroText(flags.dae?.macro?.command ?? "", where);

	for (const u of (sys.description?.value ?? "").match(UUID_RE) ?? [])
		if (!uuids.has(u))
			report("warn", "description-link", where, `description links missing ${u}`);
}

/**
 * Checks macro source text for calls the module doesn't provide and old Foundry APIs.
 *
 * @param {string} text - Macro source.
 * @param {string} where - Location label.
 */
function checkMacroText(text, where) {
	if (!text) return;
	for (const m of text.matchAll(/elkan5e\.macros\.([A-Za-z]+)\.([A-Za-z0-9_$]+)/g))
		if (!exported.has(m[2]))
			report(
				"error",
				"macro-missing",
				where,
				`calls elkan5e.macros.${m[1]}.${m[2]}, which doesn't exist`,
			);
	if (
		/"tokenMove"|'tokenMove'|\btokenMove\b(?!In|Out|Within)/.test(text) ||
		/event\.data\.segments|\bsegments\b.*event\.data/.test(text)
	)
		report(
			"error",
			"old-region-event",
			where,
			"uses region events/data Foundry v14 removed (tokenMove, segments)",
		);
	if (/game\.user\??\.isGM\)\s*return/.test(text))
		report(
			"warn",
			"gm-only-macro",
			where,
			"macro returns early for players, so it only works when the GM uses it",
		);
}

for (const { file, doc } of docs) {
	const where = `${doc.name ?? doc._id} (${file})`;
	if (doc.prototypeToken && (!doc.img || !doc.prototypeToken.texture?.src))
		report(
			"error",
			"actor-no-art",
			where,
			'has no portrait or token image, so placing it fails with "texture path is empty"',
		);
	if (doc.system?.activities || doc.effects?.length || doc.type) auditItem(doc, where);
	for (const it of doc.items ?? []) auditItem(it, `${doc.name} > ${it.name} (${file})`);
}

// ---------- Report ----------
const shown = args.has("--errors") ? findings.filter((f) => f.level === "error") : findings;
const byCode = new Map();
for (const f of shown) byCode.set(f.code, [...(byCode.get(f.code) ?? []), f]);
for (const [code, list] of [...byCode].sort(
	(a, b) => (a[1][0].level === "error" ? -1 : 1) - (b[1][0].level === "error" ? -1 : 1),
)) {
	console.log(`\n${list[0].level.toUpperCase()} ${code} (${list.length})`);
	for (const f of list) console.log(`  ${f.where}\n      ${f.message}`);
}
const errors = findings.filter((f) => f.level === "error").length;
const warns = findings.length - errors;
console.log(`\n${docs.length} documents checked: ${errors} errors, ${warns} warnings.`);
if (args.has("--strict") && errors) process.exitCode = 1;
