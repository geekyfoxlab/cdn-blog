import { getImage } from "astro:assets";
import path from "node:path";
import publishedPostImages from "virtual:published-post-images";
import type { ImageMetadata } from "astro";
import { blogConfig } from "@/config/site";

export type ImageSource = string | ImageMetadata;

function isLocalPath(value: string): boolean {
	return !/^(?:https?:|data:|\/)/i.test(value);
}

export function getPostImageKey(basePath: string, source: string): string {
	return path.posix
		.normalize(path.posix.join(basePath.replaceAll("\\", "/"), source))
		.replace(/^\.\//, "");
}

export function resolvePostImage(
	source: ImageSource | undefined,
	basePath = "",
): ImageSource | undefined {
	if (!source || typeof source !== "string" || !isLocalPath(source)) {
		return source;
	}

	return publishedPostImages[getPostImageKey(basePath, source)];
}

export async function getSocialImageUrl(
	source: ImageSource | undefined,
): Promise<string | undefined> {
	if (!source) return undefined;

	if (typeof source === "string") {
		if (source.startsWith("/")) {
			return new URL(source, `${blogConfig.siteUrl}/`).href;
		}
		if (/^https?:\/\//i.test(source)) {
			return new URL(source).href;
		}
		return undefined;
	}

	const image = await getImage({
		src: source,
		width: 1200,
		height: 630,
		fit: "cover",
		format: "webp",
		quality: 82,
	});
	return new URL(image.src, `${blogConfig.siteUrl}/`).href;
}
