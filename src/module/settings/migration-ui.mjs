const { ApplicationV2 } = foundry.applications.api;

const MODULE_CLASS = "elkan5e-migration";

/**
 * Escapes text for safe use inside HTML.
 *
 * @param {*} value - Any value.
 * @returns {string} Escaped string.
 */
export function esc(value) {
	return String(value ?? "").replace(
		/[&<>"']/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
	);
}

const t = (key, data) =>
	data
		? game.i18n.format(`elkan5e.migration.${key}`, data)
		: game.i18n.localize(`elkan5e.migration.${key}`);

/**
 * The small window that shows progress while an update runs.
 */
class ProgressWindow extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: "elkan5e-migration-progress",
		classes: [MODULE_CLASS, "elkan-progress"],
		tag: "section",
		window: {
			title: "elkan5e.migration.progressTitle",
			icon: "fa-solid fa-rotate",
			minimizable: true,
		},
		position: { width: 440, height: "auto" },
		actions: { cancel: ProgressWindow.#onCancel },
	};

	/**
	 * @param {MigrationProgress} owner - The run this window reports on.
	 * @param {object} [options] - Application options.
	 */
	constructor(owner, options = {}) {
		super(options);
		this.owner = owner;
	}

	static #onCancel() {
		this.owner.cancel();
	}

	/** @override */
	async _renderHTML() {
		return `<div class="elkan-progress-body">
			<p class="elkan-progress-phase" data-ref="phase"></p>
			<div class="elkan-bar"><div class="elkan-bar-fill" data-ref="fill"></div></div>
			<p class="elkan-progress-detail" data-ref="detail"></p>
			<ul class="elkan-progress-done" data-ref="done"></ul>
			<p class="elkan-progress-note">${esc(t("progressNote"))}</p>
			<footer><button type="button" data-action="cancel"><i class="fa-solid fa-ban"></i> ${esc(t("cancel"))}</button></footer>
		</div>`;
	}

	/** @override */
	_replaceHTML(result, content) {
		content.innerHTML = result;
		this.refs = Object.fromEntries(
			[...content.querySelectorAll("[data-ref]")].map((el) => [el.dataset.ref, el]),
		);
		this.owner.refresh();
	}

	/** @override */
	async _onClose() {
		if (!this.owner.finished) this.owner.cancel();
	}
}

/**
 * Tracks and displays progress for one update run.
 */
export class MigrationProgress {
	cancelled = false;
	finished = false;
	#window = null;
	#state = { label: "", total: 0, current: 0, actor: "", dryRun: false, done: [] };

	/**
	 * Opens the progress window.
	 *
	 * @returns {Promise<void>} Resolves once rendered.
	 */
	async open() {
		this.#window = new ProgressWindow(this);
		await this.#window.render({ force: true });
	}

	/**
	 * Starts a new phase.
	 *
	 * @param {string} label - Phase name.
	 * @param {number} total - Actors in the phase.
	 * @param {boolean} dryRun - True for a preview.
	 */
	startPhase(label, total, dryRun = false) {
		const s = this.#state;
		if (s.label) s.done.push(`${s.label} (${s.current}/${s.total})`);
		Object.assign(s, { label, total, current: 0, actor: "", dryRun });
		this.refresh();
	}

	/**
	 * Marks one actor as finished.
	 *
	 * @param {string} actorName - Actor that was just processed.
	 */
	tick(actorName) {
		this.#state.current++;
		this.#state.actor = actorName;
		this.refresh();
	}

	/** Asks the run to stop after the current actor. */
	cancel() {
		this.cancelled = true;
		this.refresh();
	}

	/** Redraws the numbers in the open window. */
	refresh() {
		const refs = this.#window?.refs;
		if (!refs) return;
		const s = this.#state;
		const pct = s.total ? Math.round((s.current / s.total) * 100) : 0;
		refs.phase.textContent = this.cancelled
			? t("stopping")
			: `${s.dryRun ? t("previewing") : t("updating")}: ${s.label}`;
		refs.fill.style.width = `${pct}%`;
		refs.fill.classList.toggle("is-cancelled", this.cancelled);
		refs.detail.textContent = `${pct}% — ${t("actorsProgress", { current: s.current, total: s.total })}${s.actor ? ` · ${s.actor}` : ""}`;
		refs.done.innerHTML = s.done
			.map((d) => `<li><i class="fa-solid fa-check"></i> ${esc(d)}</li>`)
			.join("");
	}

	/**
	 * Closes the progress window.
	 *
	 * @returns {Promise<void>} Resolves once closed.
	 */
	async close() {
		this.finished = true;
		await this.#window?.close();
	}
}

const KIND_LABEL = {
	updated: "kindUpdated",
	replaced: "kindReplaced",
	removed: "kindRemoved",
	ambiguous: "kindAmbiguous",
	noMatch: "kindNoMatch",
	error: "kindError",
};

/**
 * Lists what changes in the features an ancestry, background, class or subclass grants.
 *
 * @param {object} d - Report detail with `changes` and `unchangedFeatures`.
 * @returns {string} HTML.
 */
function buildChangesHtml(d) {
	const lines = d.changes.length
		? d.changes.map((line) => `<li>${esc(line)}</li>`).join("")
		: `<li>${esc(t("noFeatureChanges"))}</li>`;
	const kept = d.unchangedFeatures
		? `<li class="elkan-unchanged">${esc(t("featuresUnchanged", { count: d.unchangedFeatures }))}</li>`
		: "";
	return `<ul class="elkan-changes">${lines}${kept}</ul>`;
}

/**
 * Builds the HTML for a finished report.
 *
 * @param {object} report - Report from a run.
 * @returns {string} HTML.
 */
function reportHtml(report) {
	const seconds = Math.max(
		1,
		Math.round(((report.finishedAt ?? Date.now()) - report.startedAt) / 1000),
	);
	const banners = [];
	if (report.dryRun)
		banners.push(
			`<p class="elkan-banner is-info"><i class="fa-solid fa-eye"></i> ${esc(t("previewBanner"))}</p>`,
		);
	if (report.cancelled)
		banners.push(
			`<p class="elkan-banner is-warn"><i class="fa-solid fa-ban"></i> ${esc(t("cancelledBanner"))}</p>`,
		);
	if (report.fatal)
		banners.push(
			`<p class="elkan-banner is-error"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(t("fatalBanner", { message: report.fatal }))}</p>`,
		);

	const rows = report.phases
		.map((p) => {
			const attention = p.noMatch + p.ambiguous;
			return `<tr>
				<th scope="row">${esc(p.label)}</th>
				<td>${p.updatedInPlace + p.replaced}</td>
				<td>${p.removed}</td>
				<td>${p.identical}</td>
				<td class="${attention ? "is-warn" : ""}">${attention}</td>
				<td class="${p.errors ? "is-error" : ""}">${p.errors}</td>
			</tr>`;
		})
		.join("");

	const sections = report.phases
		.map((p) => {
			const attention = p.details.filter((d) =>
				["ambiguous", "noMatch", "error"].includes(d.kind),
			);
			const changes = p.details.filter((d) =>
				["updated", "replaced", "removed"].includes(d.kind),
			);
			const list = (items, limit) =>
				`<ul>${items
					.slice(0, limit)
					.map(
						(d) =>
							`<li><strong>${esc(d.actor)}</strong> — ${esc(d.item)}` +
							`${d.fields?.length && !d.changes ? ` <span class="elkan-fields">(${esc(d.fields.join(", "))})</span>` : ""}` +
							`${d.message ? ` <em>${esc(d.message)}</em>` : ""}` +
							` <span class="elkan-tag is-${esc(d.kind)}">${esc(t(KIND_LABEL[d.kind]))}</span>` +
							`${d.changes ? buildChangesHtml(d) : ""}</li>`,
					)
					.join(
						"",
					)}${items.length > limit ? `<li>${esc(t("andMore", { count: items.length - limit }))}</li>` : ""}</ul>`;
			return `${
				attention.length
					? `<details open class="elkan-attention"><summary>${esc(p.label)} — ${esc(t("needsAttention", { count: attention.length }))}</summary>${list(attention, 150)}</details>`
					: ""
			}${
				changes.length
					? `<details><summary>${esc(p.label)} — ${esc(t(report.dryRun ? "wouldChange" : "changed", { count: changes.length }))}</summary>${list(changes, 300)}</details>`
					: ""
			}`;
		})
		.join("");

	return `<div class="elkan-report-body">
		${banners.join("")}
		<table class="elkan-report-table">
			<thead><tr><th></th><th>${esc(t("colUpdated"))}</th><th>${esc(t("colRemoved"))}</th><th>${esc(t("colCurrent"))}</th><th>${esc(t("colAttention"))}</th><th>${esc(t("colErrors"))}</th></tr></thead>
			<tbody>${rows || `<tr><td colspan="6">${esc(t("nothingRan"))}</td></tr>`}</tbody>
		</table>
		<p class="elkan-report-time">${esc(t("took", { seconds }))}</p>
		${sections}
		<footer>
			<button type="button" data-action="export"><i class="fa-solid fa-file-export"></i> ${esc(t("exportReport"))}</button>
			<button type="button" data-action="close"><i class="fa-solid fa-xmark"></i> ${esc(t("done"))}</button>
		</footer>
	</div>`;
}

/**
 * The window that lists what an update changed (or would change).
 */
class ReportWindow extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: "elkan5e-migration-report",
		classes: [MODULE_CLASS, "elkan-report"],
		tag: "section",
		window: {
			title: "elkan5e.migration.reportTitle",
			icon: "fa-solid fa-clipboard-list",
			resizable: true,
		},
		position: { width: 640, height: 560 },
		actions: { export: ReportWindow.#onExport, close: ReportWindow.#onClose },
	};

	/**
	 * @param {object} report - Finished report.
	 * @param {object} [options] - Application options.
	 */
	constructor(report, options = {}) {
		super(options);
		this.report = report;
	}

	static #onExport() {
		const stamp = new Date(this.report.startedAt).toISOString().replace(/[:.]/g, "-");
		foundry.utils.saveDataToFile(
			JSON.stringify(this.report, null, 2),
			"application/json",
			`elkan5e-${this.report.dryRun ? "preview" : "update"}-${stamp}.json`,
		);
	}

	static #onClose() {
		this.close();
	}

	/** @override */
	async _renderHTML() {
		return reportHtml(this.report);
	}

	/** @override */
	_replaceHTML(result, content) {
		content.innerHTML = result;
	}
}

/**
 * Opens the report window.
 *
 * @param {object} report - Finished report.
 * @returns {Promise<void>} Resolves once rendered.
 */
export async function showMigrationReport(report) {
	await new ReportWindow(report).render({ force: true });
}
