# __BLOG_NAME__

这是一个基于 Astro 与 Fuwari 的静态个人博客，由 `deploy-astro-blog` skill 生成。

- 博客地址：__BLOG_URL__
- 主站地址：__MAIN_SITE_URL__
- 项目名称：`__BLOG_SLUG__`

## 本地开发

项目要求 Node.js 22 和 pnpm `9.14.4`：

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

## 写文章

```sh
pnpm new-post my-first-post
```

文章位于 `src/content/posts/`。发布前补齐 `description`，并将 `draft` 改成 `false`。

## 验证

```sh
pnpm check
pnpm type-check
pnpm exec biome check ./src
pnpm build
pnpm preview
```

生产构建过滤 `draft: true` 的文章，并在 `dist/` 生成 Pagefind 搜索索引。

## 评论

模板默认启用本地评论。昵称和评论内容保存在访客浏览器 `localStorage`，不需要数据库，也不会同步到其他设备。若需要公开评论流，再单独评估 Giscus 或后端方案。

## Cloudflare Pages

| 设置 | 值 |
| --- | --- |
| Production branch | `main` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node.js | `22` |
| pnpm | `9.14.4` |

优先使用 Cloudflare Pages Git 集成连接 GitHub 仓库。自定义域只能修改已授权的完整主机名，不要为了博客子域修改根域、Nameserver、MX/TXT 或其他子域。

不要向仓库提交 Token、密码、私钥、私有文章或真实 `.env` 文件。
