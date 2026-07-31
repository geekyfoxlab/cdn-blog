import { defineCollection, z } from "astro:content";

const postSchema = z
	.object({
		title: z.string().trim().min(1, "文章标题不能为空"),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().trim().optional().default(""),
		image: z.string().optional().default(""),
		tags: z
			.array(z.string().trim().min(1, "标签不能为空"))
			.optional()
			.default([]),
		category: z.string().trim().optional().nullable().default(""),
		lang: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	})
	.superRefine((post, context) => {
		if (!post.draft && post.description.length === 0) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["description"],
				message: "公开文章必须提供独立描述",
			});
		}
	});

const postsCollection = defineCollection({
	schema: postSchema,
});
const specCollection = defineCollection({
	schema: z.object({}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
};
