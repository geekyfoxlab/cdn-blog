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
		showMainSiteLink: boolean;
		mainSiteLinkLabel: string;
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

__BLOG_NAME_DECLARATION__
__BLOG_URL_DECLARATION__
__MAIN_SITE_URL_DECLARATION__
__BLOG_DESCRIPTION_DECLARATION__

export const blogConfig: BlogSiteConfig = {
	title: blogName,
	description,
	language: "zh_CN",
	siteUrl,
	mainSiteUrl,
	author: {
		name: blogName,
		bio: "个人简介待补充",
		avatar: "/favicon/favicon-light-192.png",
		avatarAlt: `${blogName} 临时站点图标`,
		technologyFocus: __BLOG_TOPICS__,
		githubUrl: "",
		contact: "",
		socialLinks: [],
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
		defaultTitle: `${blogName} | 个人博客`,
		defaultDescription: description,
		defaultOgImage: "",
		twitterCard: "summary",
	},
	rss: {
		enabled: true,
		title: `${blogName} RSS`,
		description,
	},
	footer: {
		copyrightHolder: blogName,
		showMainSiteLink: true,
		mainSiteLinkLabel: `返回 ${blogName} 主页`,
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
