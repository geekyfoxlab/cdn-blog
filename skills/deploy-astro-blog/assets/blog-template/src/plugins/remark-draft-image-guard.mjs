import { visit } from "unist-util-visit";

export function remarkDraftImageGuard({ enabled = false } = {}) {
	return (tree, file) => {
		if (!enabled || file.data?.astro?.frontmatter?.draft !== true) return;

		visit(tree, ["image", "imageReference"], (node, index, parent) => {
			if (!parent || index === undefined || !Array.isArray(parent.children))
				return;
			parent.children[index] = {
				type: "text",
				value: typeof node.alt === "string" ? node.alt : "",
			};
		});
	};
}
