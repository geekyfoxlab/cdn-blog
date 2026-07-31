export type SeoPageType = "website" | "article";

export interface SeoProps {
	title?: string;
	description?: string;
	image?: string;
	imageAlt?: string;
	lang?: string;
	type?: SeoPageType;
	publishedTime?: Date;
	modifiedTime?: Date;
	tags?: string[];
	noindex?: boolean;
}
