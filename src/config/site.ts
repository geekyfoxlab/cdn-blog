import type { SiteConfig as FuwariSiteConfig } from "../types/config";

export interface SiteNavigationItem {
	name: string;
	url: string;
	external: boolean;
	openInNewTab: boolean;
}

export interface SocialLink {
	name: string;
	url: string;
	icon: string;
}

export interface BlogSiteConfig {
	title: string;
	description: string;
	language: FuwariSiteConfig["lang"];
	siteUrl: string;
	mainSiteUrl: string;
	appearance: {
		themeColor: FuwariSiteConfig["themeColor"];
		banner: FuwariSiteConfig["banner"];
		favicon: FuwariSiteConfig["favicon"];
	};
	author: {
		name: string;
		bio: string;
		avatar: string;
		avatarAlt: string;
		technologyFocus: string[];
		githubUrl: string;
		contact: string;
		socialLinks: SocialLink[];
	};
	navigation: SiteNavigationItem[];
	seo: {
		defaultTitle: string;
		defaultDescription: string;
		defaultOgImage: string;
		twitterCard: "summary" | "summary_large_image";
	};
	rss: {
		enabled: boolean;
		title: string;
		description: string;
	};
	footer: {
		copyrightHolder: string;
		showHomeLink: boolean;
		homeLinkLabel: string;
	};
	license: {
		enabled: boolean;
		name: string;
		url: string;
	};
	giscus: {
		enabled: boolean;
		repo: string;
		repoId: string;
		category: string;
		categoryId: string;
		mapping: "pathname" | "url" | "title" | "og:title" | "specific" | "number";
		strict: boolean;
		reactionsEnabled: boolean;
		emitMetadata: boolean;
		inputPosition: "top" | "bottom";
		lang: string;
		loading: "lazy" | "eager";
		environmentVariables: {
			repo: "PUBLIC_GISCUS_REPO";
			repoId: "PUBLIC_GISCUS_REPO_ID";
			category: "PUBLIC_GISCUS_CATEGORY";
			categoryId: "PUBLIC_GISCUS_CATEGORY_ID";
		};
	};
	cloudflareWebAnalytics: {
		enabled: boolean;
		tokenEnvironmentVariable: "PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN";
	};
	features: {
		search: boolean;
		tableOfContents: boolean;
		comments: boolean;
		analytics: boolean;
	};
}

// 对应 blogConfig.siteUrl：博客正式地址，用于 Canonical、RSS、Sitemap、Open Graph 等。
const siteUrl = "https://blog.example.com";

// 对应 blogConfig.mainSiteUrl：独立主站地址，仅用于导航里的“主站”入口。
const mainSiteUrl = "https://example.com";

// 对应 blogConfig.author.githubUrl 和 author.socialLinks 中的 GitHub 链接。
const githubUrl = "https://github.com/example";

// 对应 blogConfig.author.contact，并用于 author.socialLinks 中的 mailto 邮箱链接。
const contactEmail = "hello@example.com";

// 对应 blogConfig.author.bio：侧栏 Profile 和 About 页显示的个人简介。
const authorBio = "记录技术实践与学习笔记";

// 对应 blogConfig.author.avatar：侧栏 Profile 和 About 页展示的头像图片路径。
const avatarSrc = "/favicon/favicon-light-192.png";

// 对应 blogConfig.author.avatarAlt：头像图片的替代文本，用于无障碍和图片加载失败场景。
const avatarAlt = "Example Lab 临时站点图标";

// 对应 blogConfig.appearance.themeColor.hue：默认主题色 Hue，范围 0 到 360，用于生成背景、按钮和辅助色。
const defaultThemeHue = 140;

// 对应 blogConfig.appearance.themeColor.color：主色精确值，支持 rgb(...)、#hex、oklch(...) 等 CSS 颜色；留空时使用 Hue 生成主色。
const defaultThemeColor = "rgb(20 184 166)";

// 对应 blogConfig.appearance.themeColor.version：默认主题色版本；修改后会刷新访客浏览器里旧的 hue 缓存。
const themeColorVersion = "2026-07-31-rgb";

// 对应 blogConfig.seo.defaultOgImage：无页面封面时使用的默认社交分享图。
const defaultOgImage = "";

// 对应 blogConfig.appearance.banner.src：站点横幅/背景图路径，需同时开启 appearance.banner.enable。
const bannerImage = "";

// 对应 blogConfig.description，并复用到 subtitle、默认 SEO 描述和 RSS 描述。
const description =
	"记录 Python、AI 应用开发、大模型与 Agent、数据采集和工程实践。";

export const blogConfig: BlogSiteConfig = {
	title: "Example Lab",
	description,
	language: "zh_CN",
	siteUrl,
	mainSiteUrl,
	appearance: {
		themeColor: {
			hue: defaultThemeHue,
			color: defaultThemeColor,
			version: themeColorVersion,
			fixed: false,
		},
		banner: {
			enable: false,
			src: bannerImage,
			position: "center",
			credit: {
				enable: false,
				text: "",
				url: "",
			},
		},
		favicon: [],
	},
	author: {
		name: "Example Lab",
		bio: authorBio,
		avatar: avatarSrc,
		avatarAlt,
		technologyFocus: [
			"AI 应用开发与 Agent",
			"Python数据采集",
			"大模型学习与实践",
		],
		githubUrl,
		contact: contactEmail,
		socialLinks: [
			{
				name: "GitHub",
				url: githubUrl,
				icon: "fa6-brands:github",
			},
			{
				name: "Email",
				url: `mailto:${contactEmail}`,
				icon: "material-symbols:alternate-email-rounded",
			},
		],
	},
	navigation: [
		{
			name: "首页",
			url: "/",
			external: false,
			openInNewTab: false,
		},
		{
			name: "归档",
			url: "/archive/",
			external: false,
			openInNewTab: false,
		},
		{
			name: "关于",
			url: "/about/",
			external: false,
			openInNewTab: false,
		},
		{
			name: "主站",
			url: mainSiteUrl,
			external: true,
			openInNewTab: false,
		},
	],
	seo: {
		defaultTitle: "Example Lab | Python、AI 与工程实践",
		defaultDescription: description,
		defaultOgImage,
		twitterCard: "summary",
	},
	rss: {
		enabled: true,
		title: "Example Lab RSS",
		description,
	},
	footer: {
		copyrightHolder: "Example Lab",
		showHomeLink: true,
		homeLinkLabel: "返回 Example Lab 主页",
	},
	license: {
		enabled: true,
		name: "CC BY-NC-SA 4.0",
		url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
	},
	giscus: {
		enabled: false,
		repo: "",
		repoId: "",
		category: "",
		categoryId: "",
		mapping: "pathname",
		strict: true,
		reactionsEnabled: true,
		emitMetadata: false,
		inputPosition: "bottom",
		lang: "zh-CN",
		loading: "lazy",
		environmentVariables: {
			repo: "PUBLIC_GISCUS_REPO",
			repoId: "PUBLIC_GISCUS_REPO_ID",
			category: "PUBLIC_GISCUS_CATEGORY",
			categoryId: "PUBLIC_GISCUS_CATEGORY_ID",
		},
	},
	cloudflareWebAnalytics: {
		enabled: false,
		tokenEnvironmentVariable: "PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN",
	},
	features: {
		search: true,
		tableOfContents: true,
		comments: true,
		analytics: false,
	},
};
