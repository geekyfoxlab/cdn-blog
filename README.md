# CDN Personal Blog Template

一个基于 [Astro](https://astro.build) 和 [Fuwari](https://github.com/saicaca/fuwari) 的静态个人博客模板，适合部署到 Cloudflare Pages 等 CDN 平台。

模板默认包含：

- Markdown 文章、标签、分类、归档、RSS、Sitemap 和 robots.txt。
- Pagefind 静态搜索索引。
- Mermaid、KaTeX、Expressive Code、图片 Caption 和 PhotoSwipe。
- 本地评论：访客昵称和评论保存在当前浏览器，不需要数据库。
- `deploy-astro-blog` Codex Skill：让 AI 按固定流程创建仓库、配置 Pages、验收和交接。

## 快速开始

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

打开 `http://localhost:4321/` 预览。正式构建：

```sh
pnpm check
pnpm type-check
pnpm exec biome check ./src
pnpm build
pnpm preview
```

项目要求 Node.js `>=22 <23` 和 pnpm `9.14.4`。如果本机不是这个版本，本地可能出现 engine warning；Cloudflare Pages 里应固定 Node `22` 和 pnpm `9.14.4`。

## 配置站点

主要配置在 `src/config/site.ts`：

```ts
const siteUrl = "https://blog.example.com";
const mainSiteUrl = "https://example.com";
const githubUrl = "https://github.com/example";
const contactEmail = "hello@example.com";
```

把这些示例值改成你的博客域名、主站地址、GitHub 和邮箱。不要提交真实 `.env`、Token、密码、私钥或未公开文章。

## 写文章

创建文章：

```sh
pnpm new-post my-first-post
```

文章会生成到 `src/content/posts/my-first-post.md`。发布前补齐 `description`，并把 `draft` 改成 `false`：

```yaml
---
title: "文章标题"
published: 2026-07-31
description: "用一到两句话概括文章。"
image: ""
tags: ["Astro", "博客"]
category: "工程实践"
draft: false
lang: "zh_CN"
---
```

完整说明见 [使用这个模板搭建个人博客](docs/16-使用这个模板搭建个人博客.md)。

## 让 AI 一键部署到 CDN

本仓库内置了 Codex Skill：

```text
skills/deploy-astro-blog
```

安装到 Codex 本地 skills 目录：

```sh
mkdir -p ~/.codex/skills
cp -R skills/deploy-astro-blog ~/.codex/skills/deploy-astro-blog
```

然后新开一个 Codex 任务，对 AI 说：

```text
使用 deploy-astro-blog skill，帮我一键部署一个 Astro/Fuwari 个人博客到 Cloudflare Pages。

输入：
- 模式：new
- 项目目录：/absolute/path/my-blog
- 博客名称：Example Lab
- 项目 slug：example-blog
- 博客 URL：https://blog.example.com
- 主站 URL：https://example.com
- 描述：记录技术实践与学习笔记。
- 主题方向：技术写作,项目记录,学习笔记,工程实践
- GitHub 仓库：example/example-blog
- 仓库可见性：Private 或 Public
- 是否绑定自定义域：是/否
- 自定义域：blog.example.com

请先本地 scaffold、验证构建，再创建 GitHub 仓库、推送 main、配置 Cloudflare Pages Git 集成，并在每次外部变更前确认。
```

Skill 会遵循这些边界：

- 先本地创建项目和验证构建。
- GitHub 仓库默认建议 Private，Public 需要明确确认。
- Cloudflare Pages 使用 Git 集成：`pnpm build`、输出 `dist`、Node `22`、pnpm `9.14.4`。
- 绑定自定义域时只修改明确授权的完整 FQDN，不碰根域、`www`、MX/TXT、Nameserver 或其他子域。
- 不保存或打印 Token、密码、私钥、Cookie、真实 `.env`。

## 部署到 Cloudflare Pages

Cloudflare Pages 的固定参数：

| 设置 | 值 |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node.js | `22` |
| pnpm | `9.14.4` |

先验证 `*.pages.dev`，再绑定自定义域。绑定域名时只处理你的博客子域，例如 `blog.example.com`。

## 项目结构

```text
src/
├── components/   页面、导航、搜索、评论和主题组件
├── config/       站点业务配置
├── content/      Markdown 文章与 About 内容
├── layouts/      页面布局
├── pages/        Astro 路由
├── plugins/      Markdown 与构建插件
├── styles/       全局样式
└── utils/        内容、日期、URL、SEO 和图片工具

docs/             使用、部署和维护文档
scripts/          本地辅助脚本
skills/           Codex 一键部署 Skill
```

## 安全说明

这个模板是纯静态站点，不需要服务端数据库。默认评论只写入访客浏览器 `localStorage`，不会同步到站点后台或其他设备。若要公开评论流，可以单独评估 Giscus 或后端方案，并同步更新隐私说明。
