import { blogConfig } from "@/config/site";

export function getCanonicalUrl(pathname: string): string {
	const canonicalUrl = new URL(pathname, `${blogConfig.siteUrl}/`);
	canonicalUrl.search = "";
	canonicalUrl.hash = "";
	return canonicalUrl.href;
}

export function getAbsoluteSiteAssetUrl(
	pathOrUrl: string | undefined,
): string | undefined {
	const value = pathOrUrl?.trim();
	if (!value) return undefined;

	if (value.startsWith("/")) {
		return new URL(value, `${blogConfig.siteUrl}/`).href;
	}

	if (value.startsWith("https://") || value.startsWith("http://")) {
		return new URL(value).href;
	}

	// Markdown 相对图片会由 Astro 生成哈希地址，不能在这里猜测其公开 URL。
	return undefined;
}
