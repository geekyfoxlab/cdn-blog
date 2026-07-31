const GISCUS_ORIGIN = "https://giscus.app";
const GISCUS_CONTAINER_SELECTOR = "[data-giscus-container]";

let themeObserver: MutationObserver | undefined;

function getGiscusTheme(): "dark" | "light" {
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function syncGiscusTheme(): void {
	const iframe = document.querySelector<HTMLIFrameElement>(
		`${GISCUS_CONTAINER_SELECTOR} iframe.giscus-frame`,
	);
	if (!iframe?.contentWindow) {
		return;
	}

	iframe.contentWindow.postMessage(
		{
			giscus: {
				setConfig: {
					theme: getGiscusTheme(),
				},
			},
		},
		GISCUS_ORIGIN,
	);
}

function observeThemeChanges(): void {
	if (themeObserver) {
		return;
	}

	themeObserver = new MutationObserver(syncGiscusTheme);
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});
}

function stopObservingTheme(): void {
	themeObserver?.disconnect();
	themeObserver = undefined;
}

function copyDataAttribute(
	script: HTMLScriptElement,
	container: HTMLElement,
	name: string,
): void {
	const value = container.dataset[name];
	if (value) {
		script.dataset[name] = value;
	}
}

export function setupGiscus(): void {
	const container = document.querySelector<HTMLElement>(
		GISCUS_CONTAINER_SELECTOR,
	);
	if (!container) {
		stopObservingTheme();
		return;
	}

	observeThemeChanges();
	if (container.querySelector("iframe.giscus-frame")) {
		syncGiscusTheme();
		return;
	}
	if (container.querySelector('script[src="https://giscus.app/client.js"]')) {
		return;
	}

	const script = document.createElement("script");
	script.src = `${GISCUS_ORIGIN}/client.js`;
	script.async = true;
	script.crossOrigin = "anonymous";
	script.addEventListener("load", syncGiscusTheme, { once: true });

	for (const attribute of [
		"repo",
		"repoId",
		"category",
		"categoryId",
		"mapping",
		"strict",
		"reactionsEnabled",
		"emitMetadata",
		"inputPosition",
		"lang",
		"loading",
	]) {
		copyDataAttribute(script, container, attribute);
	}
	script.dataset.theme = getGiscusTheme();
	container.append(script);
}
