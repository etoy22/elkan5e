const PATREON_URL = "https://www.patreon.com/elkan5e";
const MODULE_ID = "elkan5e";
const PATREON_STYLE_ID = "elkan5e-patron-styles";

const ensurePatreonStyles = () => {
	if (document.getElementById(PATREON_STYLE_ID)) return;
	const style = document.createElement("style");
	style.id = PATREON_STYLE_ID;
	style.textContent = `
		li[data-module-id="${MODULE_ID}"] .package-overview,
		li[data-package-id="${MODULE_ID}"] .package-overview {
			flex-wrap: nowrap;
			align-items: center;
			gap: 0.35rem;
			justify-content: flex-start;
		}

		li[data-module-id="${MODULE_ID}"] .package-overview .package-title,
		li[data-package-id="${MODULE_ID}"] .package-overview .package-title {
			flex: 1 1 auto;
			min-width: 0;
		}

		li[data-module-id="${MODULE_ID}"] .package-overview > .tag,
		li[data-package-id="${MODULE_ID}"] .package-overview > .tag {
			flex: 0 0 auto;
			display: inline-flex;
			gap: 0.25rem;
		}

		.elkan5e-patron-link {
			display: inline-flex;
			align-items: center;
			flex: 0 0 auto;
			gap: 0.35rem;
			background: #f96854;
			color: #fff;
			border-radius: 999px;
			padding: 0.1rem 0.55rem;
			font-size: 0.7rem;
			font-weight: 600;
			text-decoration: none;
			border: 1px solid #f0604b;
			box-shadow: none;
			white-space: nowrap;
			transition: background 150ms ease, box-shadow 150ms ease;
		}

		.elkan5e-patron-link:hover {
			background: #ff7864;
			box-shadow: 0 0 8px rgba(0, 0, 0, 0.45);
		}

		.elkan5e-patron-link:focus-visible {
			outline: 2px solid #fff;
			outline-offset: 2px;
		}

		.elkan5e-patron-link i {
			font-size: 0.85rem;
		}

		.elkan5e-patron-link span {
			font-size: 0.7rem;
			font-weight: 600;
		}

		li[data-module-id="${MODULE_ID}"] .package-overview .package-title .title-group,
		li[data-package-id="${MODULE_ID}"] .package-overview .package-title .title-group {
			min-width: 0;
			flex: 1 1 auto;
		}

		li[data-module-id="${MODULE_ID}"] .package-overview .package-title .title-group .title,
		li[data-package-id="${MODULE_ID}"] .package-overview .package-title .title-group .title,
		li[data-module-id="${MODULE_ID}"] .package-overview .package-title .title-group .subtitle,
		li[data-package-id="${MODULE_ID}"] .package-overview .package-title .title-group .subtitle {
			width: auto;
			min-width: 0;
		}
	`;
	document.head.append(style);
};

let registered = false;

export const registerPatreonModuleCTA = () => {
	if (registered) return;
	registered = true;

	Hooks.on("renderModuleManagement", (app, html) => {
		try {
			ensurePatreonStyles();

			const root = html instanceof jQuery ? html[0] : html;
			if (!root) return;

			const moduleEntry =
				root.querySelector(`[data-package-id="${MODULE_ID}"]`) ??
				root.querySelector(`[data-module-id="${MODULE_ID}"]`);
			if (!moduleEntry) return;

			const overview = moduleEntry.querySelector(".package-overview");
			if (!overview) return;

			if (overview.querySelector(".elkan5e-patron-link")) return;

			const link = document.createElement("a");
			link.href = PATREON_URL;
			link.target = "_blank";
			link.rel = "noopener";
			link.innerHTML = `<i class="fa-brands fa-patreon"></i><span>Become a Patron</span>`;
			link.classList.add("elkan5e-patron-link");

			const firstTag = overview.querySelector(".tag");
			if (firstTag) {
				firstTag.insertAdjacentElement("beforebegin", link);
			} else {
				overview.append(link);
			}
		} catch (error) {
			console.error("Elkan 5e | Failed to add Patreon button to module list:", error);
		}
	});
};
