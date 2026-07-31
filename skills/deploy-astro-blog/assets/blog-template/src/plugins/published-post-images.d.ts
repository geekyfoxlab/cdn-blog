declare module "virtual:published-post-images" {
	import type { ImageMetadata } from "astro";

	const images: Readonly<Record<string, ImageMetadata>>;
	export default images;
}
