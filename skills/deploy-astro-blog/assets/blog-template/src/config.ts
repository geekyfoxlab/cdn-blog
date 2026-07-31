import { blogConfig } from "./config/site";
import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";

export const siteConfig: SiteConfig = {
	title: blogConfig.title,
	subtitle: blogConfig.description,
	lang: blogConfig.language,
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: false,
		src: "", // 启用横幅时使用 public 路径，或显式导入 src/assets 下的图片。
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: blogConfig.features.tableOfContents,
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
};

export const navBarConfig: NavBarConfig = {
	links: blogConfig.navigation.map((item) => ({ ...item })),
};

export const profileConfig: ProfileConfig = {
	avatar: blogConfig.author.avatar,
	avatarAlt: blogConfig.author.avatarAlt,
	name: blogConfig.author.name,
	bio: blogConfig.author.bio,
	links: blogConfig.author.socialLinks.map((item) => ({ ...item })),
};

export const licenseConfig: LicenseConfig = {
	enable: blogConfig.license.enabled,
	name: blogConfig.license.name,
	url: blogConfig.license.url,
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
