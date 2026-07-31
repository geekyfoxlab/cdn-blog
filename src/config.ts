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
	themeColor: { ...blogConfig.appearance.themeColor },
	banner: { ...blogConfig.appearance.banner },
	toc: {
		enable: blogConfig.features.tableOfContents,
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: blogConfig.appearance.favicon.map((item) => ({ ...item })),
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
