import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const virtualModuleId = "virtual:published-post-images";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

function isInside(parent, candidate) {
	const relative = path.relative(parent, candidate);
	return (
		relative === "" ||
		(relative && !relative.startsWith("..") && !path.isAbsolute(relative))
	);
}

async function findMarkdownFiles(directory) {
	const files = [];
	const entries = await readdir(directory, { withFileTypes: true });

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findMarkdownFiles(entryPath)));
		} else if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(entryPath);
		}
	}

	return files;
}

function readFrontmatter(source) {
	const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!match) return undefined;

	try {
		return parse(match[1]);
	} catch (error) {
		throw new Error(
			`无法读取文章 Frontmatter：${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function collectImages({
	command,
	postsDirectory,
	srcDirectory,
	pluginContext,
}) {
	const files = await findMarkdownFiles(postsDirectory);
	const imagePaths = new Map();

	for (const markdownFile of files) {
		pluginContext?.addWatchFile(markdownFile);
		const source = await readFile(markdownFile, "utf8");
		const frontmatter = readFrontmatter(source);
		const image = frontmatter?.image;

		if (typeof image !== "string" || image.trim() === "") continue;
		if (/^(?:https?:|data:|\/)/i.test(image)) continue;
		if (command === "build" && frontmatter?.draft === true) continue;

		const imagePath = path.resolve(path.dirname(markdownFile), image);
		if (!isInside(srcDirectory, imagePath)) {
			throw new Error(
				`文章图片必须位于 src/ 目录内：${path.relative(srcDirectory, imagePath)}`,
			);
		}

		let imageStat;
		try {
			imageStat = await stat(imagePath);
		} catch {
			throw new Error(
				`文章封面不存在：${path.relative(srcDirectory, imagePath)}（来源：${path.relative(srcDirectory, markdownFile)}）`,
			);
		}
		if (!imageStat.isFile()) {
			throw new Error(
				`文章封面不是文件：${path.relative(srcDirectory, imagePath)}`,
			);
		}

		const key = path
			.relative(srcDirectory, imagePath)
			.split(path.sep)
			.join("/");
		imagePaths.set(key, imagePath);
	}

	const imports = [];
	const entries = [];
	let index = 0;
	for (const [key, imagePath] of imagePaths) {
		const importName = `postImage${index}`;
		imports.push(`import ${importName} from ${JSON.stringify(imagePath)};`);
		entries.push(`${JSON.stringify(key)}: ${importName}`);
		index += 1;
	}

	return `${imports.join("\n")}\nexport default {${entries.join(",")}};`;
}

function publishedPostImages() {
	let command = "dev";

	return {
		name: "published-post-images",
		hooks: {
			"astro:config:setup"({ command: currentCommand, updateConfig, config }) {
				command = currentCommand;
				const projectRoot = fileURLToPath(config.root);
				const postsDirectory = path.resolve(projectRoot, "src/content/posts");
				const srcDirectory = path.resolve(projectRoot, "src");

				updateConfig({
					vite: {
						plugins: [
							{
								name: "published-post-images-virtual-module",
								resolveId(id) {
									return id === virtualModuleId
										? resolvedVirtualModuleId
										: undefined;
								},
								async load(id) {
									if (id !== resolvedVirtualModuleId) return undefined;
									return collectImages({
										command,
										postsDirectory,
										srcDirectory,
										pluginContext: this,
									});
								},
								handleHotUpdate({ file, server }) {
									if (!file.startsWith(postsDirectory)) return;
									const module = server.moduleGraph.getModuleById(
										resolvedVirtualModuleId,
									);
									if (module) server.moduleGraph.invalidateModule(module);
									server.ws.send({ type: "full-reload", path: "*" });
								},
							},
						],
					},
				});
			},
		},
	};
}

export default publishedPostImages;
