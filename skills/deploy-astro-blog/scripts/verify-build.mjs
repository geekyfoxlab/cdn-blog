#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function readOptions(argv) {
	const values = new Map();
	for (let index = 0; index < argv.length; index += 2) {
		const key = argv[index];
		const value = argv[index + 1];
		if (!key?.startsWith("--") || !value || value.startsWith("--")) {
			throw new Error("Use --project <dir> --expected-url <https-origin>");
		}
		values.set(key.slice(2), value);
	}
	const projectDir = path.resolve(values.get("project") ?? ".");
	const expectedValue = values.get("expected-url");
	if (!expectedValue) throw new Error("--expected-url is required");
	const expectedUrl = new URL(expectedValue);
	if (expectedUrl.protocol !== "https:" || expectedUrl.pathname !== "/") {
		throw new Error("--expected-url must be an HTTPS origin without a path");
	}
	return { projectDir, expectedOrigin: expectedUrl.origin };
}

function main() {
	const { projectDir, expectedOrigin } = readOptions(process.argv.slice(2));
	const distDir = path.join(projectDir, "dist");
	const requiredFiles = [
		"index.html",
		"about/index.html",
		"archive/index.html",
		"404.html",
		"rss.xml",
		"sitemap-index.xml",
		"robots.txt",
		"pagefind/pagefind.js",
	];
	const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(distDir, file)));
	const failures = missing.map((file) => `Missing dist/${file}`);
	if (missing.length === 0) {
		const indexHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
		const aboutHtml = fs.readFileSync(path.join(distDir, "about/index.html"), "utf8");
		const notFoundHtml = fs.readFileSync(path.join(distDir, "404.html"), "utf8");
		const robots = fs.readFileSync(path.join(distDir, "robots.txt"), "utf8");
		const rss = fs.readFileSync(path.join(distDir, "rss.xml"), "utf8");
		const sitemap = fs.readFileSync(path.join(distDir, "sitemap-index.xml"), "utf8");
		if (!indexHtml.includes(expectedOrigin)) failures.push("Homepage does not reference expected origin");
		if (!aboutHtml.includes(expectedOrigin)) failures.push("About page does not reference expected origin");
		if (!/noindex/i.test(notFoundHtml)) failures.push("404 page is missing noindex");
		if (!robots.includes(`${expectedOrigin}/sitemap-index.xml`)) {
			failures.push("robots.txt does not point to the expected Sitemap");
		}
		if (!rss.includes(expectedOrigin)) failures.push("RSS does not use expected origin");
		if (!sitemap.includes(expectedOrigin)) failures.push("Sitemap index does not use expected origin");
		for (const [name, html] of [
			["index.html", indexHtml],
			["about/index.html", aboutHtml],
		]) {
			if (/giscus\.app|cloudflareinsights\.com/.test(html)) {
				failures.push(`${name} loads a disabled third-party integration`);
			}
		}
	}
	const report = {
		projectDir,
		distDir,
		expectedOrigin,
		ok: failures.length === 0,
		requiredFiles,
		failures,
	};
	console.log(JSON.stringify(report, null, 2));
	if (!report.ok) process.exitCode = 1;
}

try {
	main();
} catch (error) {
	console.error(`verify-build: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
