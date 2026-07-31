import { blogConfig } from "./site";

export interface ResolvedGiscusConfig {
	enabled: boolean;
	repo: string;
	repoId: string;
	category: string;
	categoryId: string;
	mapping: typeof blogConfig.giscus.mapping;
	strict: "0" | "1";
	reactionsEnabled: "0" | "1";
	emitMetadata: "0" | "1";
	inputPosition: typeof blogConfig.giscus.inputPosition;
	lang: string;
	loading: typeof blogConfig.giscus.loading;
}

export interface ResolvedCloudflareWebAnalyticsConfig {
	enabled: boolean;
	token: string;
}

const publicEnvironment: Record<string, string | undefined> = {
	PUBLIC_GISCUS_REPO: import.meta.env.PUBLIC_GISCUS_REPO,
	PUBLIC_GISCUS_REPO_ID: import.meta.env.PUBLIC_GISCUS_REPO_ID,
	PUBLIC_GISCUS_CATEGORY: import.meta.env.PUBLIC_GISCUS_CATEGORY,
	PUBLIC_GISCUS_CATEGORY_ID: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID,
	PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN: import.meta.env
		.PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN,
};

function readPublicEnvironmentVariable(name: string): string {
	const value = publicEnvironment[name];
	return typeof value === "string" ? value.trim() : "";
}

function resolveValue(configuredValue: string, environmentVariable: string) {
	return (
		readPublicEnvironmentVariable(environmentVariable) || configuredValue.trim()
	);
}

function booleanDataAttribute(value: boolean): "0" | "1" {
	return value ? "1" : "0";
}

const giscusRepo = resolveValue(
	blogConfig.giscus.repo,
	blogConfig.giscus.environmentVariables.repo,
);
const giscusRepoId = resolveValue(
	blogConfig.giscus.repoId,
	blogConfig.giscus.environmentVariables.repoId,
);
const giscusCategory = resolveValue(
	blogConfig.giscus.category,
	blogConfig.giscus.environmentVariables.category,
);
const giscusCategoryId = resolveValue(
	blogConfig.giscus.categoryId,
	blogConfig.giscus.environmentVariables.categoryId,
);
const hasCompleteGiscusConfig =
	/^[^/\s]+\/[^/\s]+$/.test(giscusRepo) &&
	Boolean(giscusRepoId && giscusCategory && giscusCategoryId);

export const giscusConfig: ResolvedGiscusConfig = {
	enabled:
		blogConfig.features.comments &&
		blogConfig.giscus.enabled &&
		hasCompleteGiscusConfig,
	repo: giscusRepo,
	repoId: giscusRepoId,
	category: giscusCategory,
	categoryId: giscusCategoryId,
	mapping: blogConfig.giscus.mapping,
	strict: booleanDataAttribute(blogConfig.giscus.strict),
	reactionsEnabled: booleanDataAttribute(blogConfig.giscus.reactionsEnabled),
	emitMetadata: booleanDataAttribute(blogConfig.giscus.emitMetadata),
	inputPosition: blogConfig.giscus.inputPosition,
	lang: blogConfig.giscus.lang,
	loading: blogConfig.giscus.loading,
};

const cloudflareWebAnalyticsToken = readPublicEnvironmentVariable(
	blogConfig.cloudflareWebAnalytics.tokenEnvironmentVariable,
);

export const cloudflareWebAnalyticsConfig: ResolvedCloudflareWebAnalyticsConfig =
	{
		enabled:
			import.meta.env.PROD &&
			blogConfig.features.analytics &&
			blogConfig.cloudflareWebAnalytics.enabled &&
			Boolean(cloudflareWebAnalyticsToken),
		token: cloudflareWebAnalyticsToken,
	};
