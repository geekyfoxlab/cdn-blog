type MermaidApi = typeof import("mermaid").default;

let mermaidPromise: Promise<MermaidApi> | undefined;
let renderQueue = Promise.resolve();
let renderVersion = 0;
let diagramId = 0;
let setupComplete = false;

function getTheme(): "dark" | "default" {
	return document.documentElement.classList.contains("dark")
		? "dark"
		: "default";
}

function loadMermaid(): Promise<MermaidApi> {
	mermaidPromise ??= import("mermaid").then((module) => module.default);
	return mermaidPromise;
}

async function renderDiagrams(version: number): Promise<void> {
	const diagrams = Array.from(
		document.querySelectorAll<HTMLElement>(".mermaid-diagram"),
	);
	if (diagrams.length === 0) return;

	const theme = getTheme();
	const mermaid = await loadMermaid();
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		suppressErrorRendering: true,
		theme,
		fontFamily: "inherit",
		flowchart: { htmlLabels: true, useMaxWidth: true },
	});

	for (const figure of diagrams) {
		if (version !== renderVersion || !figure.isConnected) return;
		if (
			figure.dataset.mermaidRendered === "true" &&
			figure.dataset.mermaidTheme === theme
		) {
			continue;
		}

		const source = figure.dataset.mermaidSource?.trim();
		const canvas = figure.querySelector<HTMLElement>(".mermaid-canvas");
		if (!source || !canvas) continue;

		try {
			const id = `mermaid-diagram-${Date.now()}-${diagramId}`;
			diagramId += 1;
			const { svg, bindFunctions } = await mermaid.render(id, source);
			if (version !== renderVersion || !figure.isConnected) return;

			canvas.innerHTML = svg;
			const renderedSvg = canvas.querySelector("svg");
			if (renderedSvg) {
				const label = canvas.dataset.mermaidLabel || "Mermaid 图表";
				renderedSvg.setAttribute("role", "img");
				if (
					!renderedSvg.hasAttribute("aria-label") &&
					!renderedSvg.hasAttribute("aria-labelledby")
				) {
					renderedSvg.setAttribute("aria-label", label);
				}
				if (!renderedSvg.querySelector("title")) {
					const title = document.createElementNS(
						"http://www.w3.org/2000/svg",
						"title",
					);
					title.textContent = label;
					renderedSvg.prepend(title);
				}
			}
			bindFunctions?.(canvas);
			figure.dataset.mermaidTheme = theme;
			figure.dataset.mermaidRendered = "true";
			delete figure.dataset.mermaidError;
		} catch (error) {
			canvas.replaceChildren();
			figure.dataset.mermaidRendered = "false";
			figure.dataset.mermaidError = "true";
			console.error("Mermaid 图表渲染失败", error);
		}
	}
}

export function renderMermaidDiagrams(): void {
	renderVersion += 1;
	const version = renderVersion;
	renderQueue = renderQueue
		.catch(() => undefined)
		.then(() => renderDiagrams(version));
}

export function setupMermaid(): void {
	renderMermaidDiagrams();
	if (setupComplete) return;
	setupComplete = true;

	document.addEventListener("astro:page-load", renderMermaidDiagrams);
	new MutationObserver((mutations) => {
		if (mutations.some((mutation) => mutation.attributeName === "class")) {
			renderMermaidDiagrams();
		}
	}).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
}
