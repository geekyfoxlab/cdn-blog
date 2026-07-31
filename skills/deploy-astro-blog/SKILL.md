---
name: deploy-astro-blog
description: Create, adopt, validate, publish, and hand off maintainable Astro/Fuwari blogs through GitHub and Cloudflare Pages. Use when Codex needs to scaffold a personal blog, deploy an existing Astro blog, create a private or public GitHub repository, configure Cloudflare Pages Git integration and CDN, bind a custom blog subdomain safely, diagnose DNS/SSL/Pagefind/build/deployment problems, or package the resulting project for another maintainer.
---

# Deploy Astro Blog

Build and deploy a static Astro/Fuwari blog in one guided invocation. Treat “one click” as one end-to-end agent workflow: account login, repository visibility, and DNS mutations still require explicit user confirmation.

## Resource routing

- Read [references/workflow.md](references/workflow.md) before any GitHub, Cloudflare, or DNS mutation.
- Read [references/validation.md](references/validation.md) before declaring local, preview, or production success.
- Search and read the matching section in [references/troubleshooting.md](references/troubleshooting.md) before re-diagnosing a known symptom.
- Use `scripts/scaffold.mjs` only for a new project.
- Use `scripts/doctor.mjs` for runtime/tooling preflight.
- Use `scripts/verify-build.mjs` after `pnpm build`.
- Copy from `assets/blog-template/` only through `scaffold.mjs`; do not edit the bundled template for a single user's project.

## Hard boundaries

1. Never commit or print tokens, passwords, private keys, cookies, browser storage, account recovery data, or real `.env` files.
2. Default GitHub repository visibility to Private unless the user chooses Public.
3. Never make the source repository public merely to enable Giscus. Keep comments disabled or use a separate public Discussions repository.
4. Modify only the exact custom-domain FQDN authorized by the user. Do not modify root domain, `www`, Nameserver, MX/TXT, email, validation, or unrelated subdomains.
5. Do not overwrite a non-empty project directory or discard uncommitted work.
6. Do not edit `dist/`; rebuild it.
7. Do not use raw DNS result IPs as a Pages target. Bind the Pages-provided CNAME/project domain.
8. Do not claim success until local checks, Pages logs, HTTP status, SSL, and browser behavior agree.

## Collect inputs

Use a structured dialog/popup when available. Gather only missing values:

- Mode: new project or existing Astro/Fuwari project.
- Absolute project directory.
- Blog name, slug, HTTPS blog URL, HTTPS main-site URL, description, and 1-8 topics.
- GitHub owner/repository name and Private/Public choice.
- Whether to deploy only to `pages.dev` or also bind a custom domain.
- Exact custom-domain FQDN and confirmation that it is unused or that old service data is backed up.
- Preferred signed-in browser when accounts are already authenticated there.

Do not ask for facts discoverable from the project, Git, DNS, GitHub, or Cloudflare UI. Do not infer personal names, biographies, email addresses, or social profiles.

## Choose a mode

### New project

Run:

```sh
node <skill>/scripts/scaffold.mjs \
  --target /absolute/path/to/blog \
  --name "Example Lab" \
  --slug example-blog \
  --blog-url https://blog.example.com \
  --main-url https://example.com \
  --description "记录技术实践与项目经验。" \
  --topics "技术写作,项目记录,学习笔记,工程实践" \
  --git-init
```

Use `--install` only after runtime preflight passes. The script refuses broad targets and non-empty directories.

### Existing project

Inspect before changing:

```sh
git status --short --branch
git log -5 --oneline
```

Read `package.json`, lock files, Astro config, site config, `.gitignore`, content schema, build scripts, and deployment files. Preserve the existing architecture and make the minimum changes needed for reproducible build and deployment. Never copy the bundled template over an existing project.

## Run local preflight

```sh
node <skill>/scripts/doctor.mjs --project /absolute/path/to/blog
```

Target Node.js 22 and pnpm `9.14.4`. If the local shell uses another version, switch runtimes or treat Cloudflare's target build as the final Linux verification. Do not silently rewrite the lock file with pnpm 11.

## Validate locally

Run sequentially:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm type-check
pnpm exec biome check ./src
pnpm build
node <skill>/scripts/verify-build.mjs \
  --project /absolute/path/to/blog \
  --expected-url https://blog.example.com
```

Then start `pnpm preview`, inspect desktop and mobile, test Pagefind with real content, and stop the server afterward. Development search is not a production Pagefind test.

## Create and push GitHub repository

Before mutation, summarize repository name, owner, visibility, branch, and files to be committed. Obtain explicit confirmation.

Prefer a GitHub connector or authenticated CLI. When the user explicitly requests system Chrome, read and follow the Chrome control skill and use the existing signed-in session. If SSH 22 is blocked, use authenticated HTTPS; never disable host-key checking or embed credentials in the URL.

After push, verify:

- GitHub UI shows expected visibility.
- Default branch is `main`.
- Remote SHA equals local HEAD.
- Cloudflare GitHub App, when installed, is limited to this repository.

## Deploy Cloudflare Pages

Use Git integration, not duplicate GitHub Actions deployment:

```text
Production branch: main
Root directory: /
Build command: pnpm build
Output directory: dist
Node.js: 22
pnpm: 9.14.4
```

Do not add Cloudflare API tokens to GitHub. Wait for the webhook and inspect the exact commit's Details page. Require both asset publication and deployment success messages.

First verify the generated `*.pages.dev` URL. Keep production Canonical on the intended custom domain even during preview validation.

## Bind a custom domain

Obtain a separate confirmation containing the exact FQDN. Inventory DNS first. In Pages Custom domains, add that FQDN and follow the platform-provided target. Only replace a conflicting record with the same name.

Wait for Active and SSL enabled. Treat proxy-expanded A responses and stale resolver caches according to the troubleshooting reference. Never modify root domain or Nameservers to solve a child-subdomain issue.

## Final production verification

Verify at minimum:

```text
/
/about/
/archive/
/rss.xml
/sitemap-index.xml
/robots.txt
/404-does-not-exist/
```

Require 200 for expected routes and 404 for unknown paths. Confirm correct certificate, site name, Canonical, Pagefind result, responsive layout, and absence of disabled Giscus/Analytics scripts.

## Handoff

Record:

- Repository owner/name, visibility, default branch, and stable commit.
- Pages project, build parameters, baseline deployment ID/URL, and production domain.
- DNS record changed, previous value, new value, and explicit untouched boundaries.
- Validation commands/results, known warnings, and rollback steps.
- Optional features that remain disabled.

Call versioned identifiers a “handoff baseline”, not permanently “current”. Keep credentials outside the repository and handoff document.

## Completion response

Report outcome first, then:

1. Changed: project, repository, Pages, domain, and documentation.
2. Verification: checks, build environment, deployment ID, routes, SSL, search, and Git state.
3. Risk: remaining runtime lifecycle, branch protection, resolver propagation, or optional integrations.

Provide direct project/document links and the production URL. State exactly what was not changed.
