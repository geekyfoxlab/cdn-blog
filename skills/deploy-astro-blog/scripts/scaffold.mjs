#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const templateDir = path.join(skillDir, "assets", "blog-template");

function parseArgs(argv) {
	const options = new Map();
	const flags = new Set();
	for (let index = 0; index < argv.length; index += 1) {
		const item = argv[index];
		if (!item.startsWith("--")) {
			throw new Error(`Unexpected argument: ${item}`);
		}
		if (["--help", "--install", "--git-init"].includes(item)) {
			flags.add(item.slice(2));
			continue;
		}
		const value = argv[index + 1];
		if (!value || value.startsWith("--")) {
			throw new Error(`Missing value for ${item}`);
		}
		options.set(item.slice(2), value);
		index += 1;
	}
	return { options, flags };
}

function printHelp() {
	console.log(`Usage:
  node scaffold.mjs \\
    --target /absolute/path/to/blog \\
    --name "Example Lab" \\
    --slug example-blog \\
    --blog-url https://blog.example.com \\
    --main-url https://example.com \\
    --description "记录技术实践与项目经验。" \\
    [--topics "技术写作,项目记录,学习笔记,工程实践"] \\
    [--git-init] [--install]

The target must be absent or empty. The script never overwrites a non-empty directory.`);
}

function requireOption(options, key) {
	const value = options.get(key)?.trim();
	if (!value) {
		throw new Error(`Missing required option: --${key}`);
	}
	return value;
}

function validateText(value, label, maxLength) {
	if (value.length > maxLength) {
		throw new Error(`${label} must be at most ${maxLength} characters`);
	}
	if (/["\\\r\n\0]/.test(value)) {
		throw new Error(`${label} cannot contain quotes, backslashes, newlines, or null bytes`);
	}
	return value;
}

function normalizeOrigin(value, label) {
	let url;
	try {
		url = new URL(value);
	} catch {
		throw new Error(`${label} must be a valid HTTPS URL`);
	}
	if (url.protocol !== "https:" || url.username || url.password) {
		throw new Error(`${label} must be an HTTPS origin without credentials`);
	}
	if (url.pathname !== "/" || url.search || url.hash) {
		throw new Error(`${label} must not contain a path, query, or fragment`);
	}
	return url.origin;
}

function walkFiles(root) {
	return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
		const absolutePath = path.join(root, entry.name);
		return entry.isDirectory() ? walkFiles(absolutePath) : [absolutePath];
	});
}

function replaceTokens(targetDir, replacements) {
	const unresolved = [];
	for (const filePath of walkFiles(targetDir)) {
		const buffer = fs.readFileSync(filePath);
		if (buffer.includes(0)) continue;
		let content = buffer.toString("utf8");
		const original = content;
		for (const [token, value] of Object.entries(replacements)) {
			content = content.replaceAll(token, value);
		}
		const remaining = content.match(/__[A-Z][A-Z0-9_]+__/g);
		if (remaining) unresolved.push(`${path.relative(targetDir, filePath)}: ${remaining.join(", ")}`);
		if (content !== original) fs.writeFileSync(filePath, content, "utf8");
	}
	if (unresolved.length > 0) {
		throw new Error(`Unresolved template tokens:\n${unresolved.join("\n")}`);
	}
}

function formatConstDeclaration(identifier, value) {
	const prefix = `const ${identifier} =`;
	const literal = JSON.stringify(value);
	return prefix.length + literal.length + 2 <= 80
		? `${prefix} ${literal};`
		: `${prefix}\n\t${literal};`;
}

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, stdio: "inherit" });
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
	}
}

function installDependencies(targetDir) {
	const corepack = spawnSync("corepack", ["pnpm", "--version"], {
		cwd: targetDir,
		stdio: "ignore",
	});
	if (corepack.status === 0) {
		run("corepack", ["pnpm", "install", "--frozen-lockfile"], targetDir);
		return;
	}
	run("pnpm", ["install", "--frozen-lockfile"], targetDir);
}

function main() {
	const { options, flags } = parseArgs(process.argv.slice(2));
	if (flags.has("help")) {
		printHelp();
		return;
	}

	const targetDir = path.resolve(requireOption(options, "target"));
	const name = validateText(requireOption(options, "name"), "Blog name", 80);
	const slug = requireOption(options, "slug");
	const description = validateText(
		requireOption(options, "description"),
		"Description",
		200,
	);
	const blogUrl = normalizeOrigin(requireOption(options, "blog-url"), "Blog URL");
	const mainUrl = normalizeOrigin(requireOption(options, "main-url"), "Main site URL");
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		throw new Error("Slug must contain lowercase letters, digits, and single hyphens only");
	}
	const topics = (options.get("topics") ?? "技术写作,项目记录,学习笔记,工程实践")
		.split(",")
		.map((topic) => validateText(topic.trim(), "Topic", 40))
		.filter(Boolean);
	if (topics.length < 1 || topics.length > 8) {
		throw new Error("Provide between 1 and 8 comma-separated topics");
	}

	const root = path.parse(targetDir).root;
	if (targetDir === root || targetDir === os.homedir() || targetDir.startsWith(`${skillDir}${path.sep}`)) {
		throw new Error("Refusing to use a broad or skill-internal target directory");
	}
	if (!fs.existsSync(templateDir)) {
		throw new Error(`Template not found: ${templateDir}`);
	}
	if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
		throw new Error(`Target directory is not empty: ${targetDir}`);
	}

	fs.mkdirSync(targetDir, { recursive: true });
	fs.cpSync(templateDir, targetDir, { recursive: true });
	const compactTopics = `[${topics.map((topic) => JSON.stringify(topic)).join(", ")}]`;
	const topicsLiteral =
		"\t\ttechnologyFocus: ".length + compactTopics.length <= 80
			? compactTopics
			: `[\n${topics
					.map((topic) => `\t\t\t${JSON.stringify(topic)}`)
					.join(",\n")},\n\t\t]`;
	replaceTokens(targetDir, {
		__BLOG_NAME__: name,
		__BLOG_NAME_DECLARATION__: formatConstDeclaration("blogName", name),
		__BLOG_SLUG__: slug,
		__BLOG_URL__: blogUrl,
		__BLOG_URL_DECLARATION__: formatConstDeclaration("siteUrl", blogUrl),
		__MAIN_SITE_URL__: mainUrl,
		__MAIN_SITE_URL_DECLARATION__: formatConstDeclaration(
			"mainSiteUrl",
			mainUrl,
		),
		__BLOG_DESCRIPTION__: description,
		__BLOG_DESCRIPTION_DECLARATION__: formatConstDeclaration(
			"description",
			description,
		),
		__BLOG_TOPICS__: topicsLiteral,
	});

	if (flags.has("git-init")) run("git", ["init", "-b", "main"], targetDir);
	if (flags.has("install")) installDependencies(targetDir);

	console.log(
		JSON.stringify(
			{
				status: "created",
				target: targetDir,
				name,
				slug,
				blogUrl,
				mainUrl,
				gitInitialized: flags.has("git-init"),
				dependenciesInstalled: flags.has("install"),
			},
			null,
			2,
		),
	);
}

try {
	main();
} catch (error) {
	console.error(`scaffold: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
