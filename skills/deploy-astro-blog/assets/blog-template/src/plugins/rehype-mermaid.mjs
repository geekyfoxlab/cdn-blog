import { visit } from "unist-util-visit";

function textContent(node) {
	if (!node || !Array.isArray(node.children)) return "";
	return node.children
		.map((child) => (child.type === "text" ? child.value : textContent(child)))
		.join("");
}

function getCaption(node) {
	const meta = node.data?.meta;
	if (typeof meta !== "string") return "";
	const match = meta.match(/(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|([^\s]+))/);
	return (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function rehypeMermaid() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (!parent || index === undefined || node.tagName !== "pre") return;
			const code = node.children.find(
				(child) => child.type === "element" && child.tagName === "code",
			);
			if (!code || code.type !== "element") return;
			const classes = code.properties?.className;
			const isMermaid = Array.isArray(classes)
				? classes.includes("language-mermaid")
				: classes === "language-mermaid";
			if (!isMermaid) return;

			const source = textContent(code).replace(/\n$/, "");
			const caption = getCaption(code);
			const children = [
				{
					type: "element",
					tagName: "div",
					properties: {
						className: ["mermaid-canvas"],
						"data-mermaid-label": caption || "Mermaid 图表",
					},
					children: [],
				},
				{
					type: "element",
					tagName: "div",
					properties: { className: ["mermaid-source"] },
					children: [
						{
							type: "element",
							tagName: "pre",
							properties: { className: ["mermaid-source-code"] },
							children: [
								{
									type: "element",
									tagName: "code",
									properties: {},
									children: [{ type: "text", value: source }],
								},
							],
						},
					],
				},
			];
			if (caption) {
				children.push({
					type: "element",
					tagName: "figcaption",
					properties: {},
					children: [{ type: "text", value: caption }],
				});
			}

			parent.children[index] = {
				type: "element",
				tagName: "figure",
				properties: {
					className: ["mermaid-diagram"],
					"data-mermaid-source": source,
					"data-pagefind-ignore": true,
				},
				children,
			};
		});
	};
}

export default rehypeMermaid;
