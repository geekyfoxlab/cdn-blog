import { visit } from "unist-util-visit";

function rehypeImageCaption() {
	return (tree, file) => {
		visit(tree, "element", (node, index, parent) => {
			if (!parent || index === undefined || node.tagName !== "p") return;
			const children = node.children.filter(
				(child) => !(child.type === "text" && child.value.trim() === ""),
			);
			if (
				children.length !== 1 ||
				children[0].type !== "element" ||
				children[0].tagName !== "img"
			)
				return;

			const image = children[0];
			image.properties ??= {};
			const properties = image.properties;
			properties.loading ??= "lazy";
			properties.decoding ??= "async";
			const caption =
				typeof properties.title === "string" ? properties.title.trim() : "";
			if (!caption) return;

			delete properties.title;
			parent.children[index] = {
				type: "element",
				tagName: "figure",
				properties: { className: ["markdown-image"] },
				children: [
					image,
					{
						type: "element",
						tagName: "figcaption",
						properties: {},
						children: [{ type: "text", value: caption }],
					},
				],
			};
		});

		visit(tree, "element", (node) => {
			if (node.tagName !== "img") return;
			node.properties ??= {};
			const properties = node.properties;
			properties.loading ??= "lazy";
			properties.decoding ??= "async";

			const source =
				typeof properties.src === "string" ? decodeURI(properties.src) : "";
			if (file.data.astro?.localImagePaths?.includes(source)) {
				properties.sizes ??= "(min-width: 1024px) 48rem, calc(100vw - 3rem)";
			}
		});
	};
}

export default rehypeImageCaption;
