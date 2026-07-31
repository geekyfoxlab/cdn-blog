import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants.ts";
import { expressiveCodeConfig, siteConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

const HUE_COOKIE_NAME = "theme-hue";
const THEME_COLOR_COOKIE_NAME = "theme-color";
const THEME_COLOR_VERSION_COOKIE_NAME = "theme-color-version";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getConfigCarrier(): HTMLElement | null {
	return document.getElementById("config-carrier");
}

function getCookie(name: string): string {
	const value = document.cookie
		.split("; ")
		.find((item) => item.startsWith(`${name}=`))
		?.split("=")[1];
	return value ? decodeURIComponent(value) : "";
}

function setCookie(name: string, value: string): void {
	document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function deleteCookie(name: string): void {
	document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function getThemeColorVersion(): string {
	const configCarrier = getConfigCarrier();
	return (
		configCarrier?.dataset.themeColorVersion ||
		siteConfig.themeColor.version ||
		""
	);
}

function syncThemeColorVersion(): void {
	const currentVersion = getThemeColorVersion();
	if (
		currentVersion &&
		getCookie(THEME_COLOR_VERSION_COOKIE_NAME) !== currentVersion
	) {
		// 迁移旧版本缓存：主题色现在以 cookie 为准，清理历史 localStorage hue。
		localStorage.removeItem("hue");
		setCookie(THEME_COLOR_VERSION_COOKIE_NAME, currentVersion);
	}
}

export function getDefaultThemeColor(): string {
	const configCarrier = getConfigCarrier();
	return configCarrier?.dataset.themeColor || siteConfig.themeColor.color || "";
}

export function getThemeColor(): string {
	syncThemeColorVersion();
	return getCookie(THEME_COLOR_COOKIE_NAME) || getDefaultThemeColor();
}

export function applyThemeColor(color = getThemeColor()): void {
	const r = document.querySelector(":root") as HTMLElement;
	if (!r || !color) {
		return;
	}
	r.style.setProperty("--primary", color);
	r.style.setProperty("--btn-content", color);
	r.style.setProperty("--title-active", color);
	r.style.setProperty("--toc-item-active", color);
	r.style.setProperty("--codeblock-selection", color);
}

export function setThemeColor(color: string): void {
	setCookie(THEME_COLOR_COOKIE_NAME, color);
	applyThemeColor(color);
}

export function resetThemeColor(): void {
	deleteCookie(THEME_COLOR_COOKIE_NAME);
	deleteCookie(HUE_COOKIE_NAME);
	applyThemeColor(getDefaultThemeColor());
}

export function getDefaultHue(): number {
	const configCarrier = getConfigCarrier();
	return Number.parseInt(
		configCarrier?.dataset.hue || String(siteConfig.themeColor.hue),
		10,
	);
}

export function getHue(): number {
	syncThemeColorVersion();
	const stored = getCookie(HUE_COOKIE_NAME) || localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	setCookie(HUE_COOKIE_NAME, String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
	applyThemeColor();
}

export function colorFromHue(hue: number): string {
	const normalizedHue = ((hue % 360) + 360) % 360;
	return hslToHex(normalizedHue, 70, 45);
}

export function hueFromHex(color: string): number | null {
	const normalizedColor = toColorInputValue(color);
	const match = normalizedColor.match(
		/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i,
	);
	if (!match) {
		return null;
	}
	const [, rHex, gHex, bHex] = match;
	const r = Number.parseInt(rHex, 16) / 255;
	const g = Number.parseInt(gHex, 16) / 255;
	const b = Number.parseInt(bHex, 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	if (delta === 0) {
		return 0;
	}
	let hue = 0;
	if (max === r) {
		hue = ((g - b) / delta) % 6;
	} else if (max === g) {
		hue = (b - r) / delta + 2;
	} else {
		hue = (r - g) / delta + 4;
	}
	return Math.round(hue * 60 + (hue < 0 ? 360 : 0));
}

export function toColorInputValue(color: string): string {
	const hexMatch = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
	if (hexMatch) {
		const hex = hexMatch[1];
		if (hex.length === 3) {
			return `#${hex
				.split("")
				.map((char) => `${char}${char}`)
				.join("")}`.toLowerCase();
		}
		return `#${hex}`.toLowerCase();
	}

	const rgbMatch = color.match(
		/^rgba?\(\s*(\d{1,3})(?:\s+|,\s*)(\d{1,3})(?:\s+|,\s*)(\d{1,3})/i,
	);
	if (rgbMatch) {
		const [, r, g, b] = rgbMatch;
		return rgbToHex(Number(r), Number(g), Number(b));
	}

	return colorFromHue(getDefaultHue());
}

function hslToHex(h: number, s: number, l: number): string {
	const saturation = s / 100;
	const lightness = l / 100;
	const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = lightness - c / 2;
	let r = 0;
	let g = 0;
	let b = 0;

	if (h < 60) {
		[r, g, b] = [c, x, 0];
	} else if (h < 120) {
		[r, g, b] = [x, c, 0];
	} else if (h < 180) {
		[r, g, b] = [0, c, x];
	} else if (h < 240) {
		[r, g, b] = [0, x, c];
	} else if (h < 300) {
		[r, g, b] = [x, 0, c];
	} else {
		[r, g, b] = [c, 0, x];
	}

	return rgbToHex(
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255),
	);
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b]
		.map((value) =>
			Math.min(255, Math.max(0, value)).toString(16).padStart(2, "0"),
		)
		.join("")}`;
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	switch (theme) {
		case LIGHT_MODE:
			document.documentElement.classList.remove("dark");
			break;
		case DARK_MODE:
			document.documentElement.classList.add("dark");
			break;
		case AUTO_MODE:
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			break;
	}

	// Set the theme for Expressive Code
	document.documentElement.setAttribute(
		"data-theme",
		expressiveCodeConfig.theme,
	);
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}
