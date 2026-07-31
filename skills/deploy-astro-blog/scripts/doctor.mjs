#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
	const projectIndex = argv.indexOf("--project");
	const projectValue = projectIndex >= 0 ? argv[projectIndex + 1] : ".";
	if (!projectValue || projectValue.startsWith("--")) {
		throw new Error("--project requires a directory path");
	}
	return {
		projectDir: path.resolve(projectValue),
		strict: argv.includes("--strict"),
	};
}

function commandVersion(command, args = ["--version"]) {
	const result = spawnSync(command, args, { encoding: "utf8" });
	if (result.error || result.status !== 0) return null;
	return (result.stdout || result.stderr).trim().split("\n")[0];
}

function main() {
	const { projectDir, strict } = parseArgs(process.argv.slice(2));
	const packagePath = path.join(projectDir, "package.json");
	if (!fs.existsSync(packagePath)) throw new Error(`package.json not found in ${projectDir}`);
	const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
	const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
	const pnpmVersion = commandVersion("pnpm");
	const checks = {
		projectExists: true,
		node: {
			value: process.version,
			expected: ">=22 <23",
			ok: nodeMajor === 22,
		},
		pnpm: {
			value: pnpmVersion,
			expected: "9.14.4",
			ok: pnpmVersion === "9.14.4",
		},
		packageManager: {
			value: packageJson.packageManager ?? null,
			expected: "pnpm@9.14.4",
			ok: packageJson.packageManager === "pnpm@9.14.4",
		},
		git: { value: commandVersion("git"), required: true },
		githubCli: { value: commandVersion("gh"), required: false },
		wrangler: { value: commandVersion("wrangler"), required: false },
	};
	const warnings = [];
	if (!checks.node.ok) warnings.push("Use Node.js 22 for the reproducible project baseline");
	if (!checks.pnpm.ok) warnings.push("Activate pnpm 9.14.4 with Corepack before installing");
	if (!checks.git.value) warnings.push("Git is required before creating the remote repository");
	if (!checks.githubCli.value) warnings.push("GitHub CLI is optional; use a signed-in browser when unavailable");
	if (!checks.wrangler.value) warnings.push("Wrangler is optional because Git integration is preferred");

	const requiredOk =
		checks.node.ok && checks.pnpm.ok && checks.packageManager.ok && Boolean(checks.git.value);
	console.log(JSON.stringify({ projectDir, requiredOk, checks, warnings }, null, 2));
	if (strict && !requiredOk) process.exitCode = 1;
}

try {
	main();
} catch (error) {
	console.error(`doctor: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 1;
}
