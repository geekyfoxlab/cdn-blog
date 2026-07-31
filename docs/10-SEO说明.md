# SEO 说明

## 站点边界

博客 SEO 的唯一根地址是：

```text
https://blog.example.com
```

`https://example.com` 是独立主站，只作为导航中的“主站”链接使用。博客的 Canonical、Open Graph URL、RSS 和 Sitemap 都不能指向主站。

根地址来自 `src/config/site.ts` 的 `blogConfig.siteUrl`，并同时传给 `astro.config.mjs` 的 `site`。不要在页面组件中再次硬编码域名。

## 页面元数据

统一 SEO 组件位于 `src/components/Seo.astro`，由 `src/layouts/Layout.astro` 接入。页面通过 `SeoProps` 传递标题、描述、类型、日期、标签、图片和 `noindex`，避免每个页面重复维护 head。

当前规则：

- 未传页面标题时，使用 `seo.defaultTitle`。
- 传入页面标题时，生成 `<页面标题> | Example Lab`。
- 页面描述为空时，回退到 `seo.defaultDescription`。
- 默认输出 `index, follow`；传入 `noindex` 时输出 `noindex, nofollow`。
- 可索引页面输出一个 Canonical；`noindex` 页面不输出 Canonical。
- Canonical 只使用 pathname，自动移除查询参数和 hash。
- 所有页面在 RSS 开启时输出 `/rss.xml` 的 alternate 链接。

页面查询参数不会创建新的 Canonical。例如 `/archive/?tag=Python` 的 Canonical 仍是 `https://blog.example.com/archive/`，避免标签筛选产生重复页面。

## Open Graph 与 Twitter Card

当前输出：

- `og:site_name`
- `og:url`
- `og:title`
- `og:description`
- `og:type`
- `og:locale`
- `twitter:card`
- `twitter:url`
- `twitter:title`
- `twitter:description`

文章页面还会输出发布时间、可选更新时间和每个标签对应的 `article:tag`。

默认分享图片 `seo.defaultOgImage` 当前为空，因此没有可用图片时不会输出 `og:image` 或 `twitter:image`。图片地址规则如下：

| `image` 值 | 页面封面 | 社交图片元数据 |
| --- | --- | --- |
| `/images/cover.png` | 支持 | 转换为博客域名下的绝对 URL |
| `https://example.com/cover.png` | 支持 | 保留完整绝对 URL |
| `./cover.png` | 通过公开文章封面清单解析并生成响应式图片 | 生成 1200x630 的优化 WebP，并把 `_astro/` 产物转换为博客域名下的绝对 URL |
| 空字符串 | 不显示 | 不输出图片元数据 |

相对封面只允许解析到 `src/` 内的文件；文件缺失或越出该目录会让构建失败。优化参数当前为 `width: 1200`、`height: 630`、`fit: cover`、`format: webp`、`quality: 82`。如果需要所有无封面页面也拥有统一分享图，可把资源放在 `public/` 并将 `defaultOgImage` 配置为根路径。

## 文章结构化数据

`src/pages/posts/[...slug].astro` 为公开文章输出 `BlogPosting` JSON-LD，包含：

- 标题与描述
- 标签关键词
- 作者显示名和已配置的 GitHub 主页；未配置 GitHub 时回退到博客根地址
- 发布日期与修改日期
- Canonical 对应的 `mainEntityOfPage` 和 `url`
- 页面语言
- 可解析为绝对地址时的图片

作者显示名目前仍是站点占位，不能在未确认真实资料时虚构个人身份。作者 URL 使用已确认的 GitHub 主页 `https://github.com/example`。若没有 `updated`，JSON-LD 的 `dateModified` 使用 `published`；Open Graph 的 `article:modified_time` 只在显式提供 `updated` 时输出。

## RSS、Sitemap 与 robots

| 资源 | 当前地址 | 行为 |
| --- | --- | --- |
| RSS | `https://blog.example.com/rss.xml` | 使用博客域名和公开文章，语言值为 `zh-CN`；`rss.enabled` 关闭时返回 404。 |
| Sitemap index | `https://blog.example.com/sitemap-index.xml` | 由 `@astrojs/sitemap` 在生产构建生成。 |
| robots.txt | `https://blog.example.com/robots.txt` | 允许抓取 `/`，并指向博客 Sitemap index。 |

Sitemap 显式排除 `/404/` 和 `/404.html`。文章路由只由生产环境中的非草稿内容生成，因此草稿不会进入 Sitemap 或 RSS。

## 草稿与搜索索引

生产构建的内容查询会过滤 `draft: true`，同一过滤逻辑用于首页、文章路由、归档、标签、分类和 RSS。由于草稿没有生成静态文章页面，随后运行的 Pagefind 也不会索引这些文章。

媒体入口也有独立边界：生产 Remark guard 会移除草稿 Markdown 图片节点，`published-post-images` 虚拟清单只导入公开文章引用的相对封面，因此仅由草稿引用的正文图片和封面不会进入生产 `_astro/` 资源。同一文件若被公开文章引用仍会输出；`public/` 也会整体发布，不能依赖草稿过滤保护这些文件。

404 内容带 `data-pagefind-ignore`，并输出 `noindex, nofollow`；Mermaid 图表容器也忽略 Pagefind，避免源码或 SVG 实现细节重复进入索引。当前 Pagefind 只在 `pnpm build` 后生成；`pnpm dev` 中的搜索面板会提示没有索引，不会伪造结果。真实中文检索应在构建后的 `pnpm preview` 中验证。

## 404 页面

`src/pages/404.astro` 构建为 `dist/404.html`，提供返回博客首页和前往主站的静态链接。该页面：

- 输出 `noindex, nofollow`。
- 不输出 Canonical。
- 从 Sitemap 排除。
- 不依赖 JavaScript 完成基本导航。

托管平台仍需配置为对未知路径提供该文件并保留 HTTP 404 状态；正式接入 Cloudflare Pages 时必须再次验证实际响应码。

## 公开文章校验

`src/content/config.ts` 要求公开文章具有非空 `title` 和 `description`。`description` 同时供列表、meta、Open Graph、Twitter、RSS 和 JSON-LD 使用，不能依赖自动摘要代替。

当前尚未加入 `coverAlt`、逐文章自定义 Canonical、SEO 标题覆写或 `noindex` Frontmatter。不要向文章任意添加这些字段并假设会被消费。

## 构建检查清单

运行：

```sh
pnpm check
pnpm type-check
pnpm exec biome check ./src
pnpm build
```

然后检查 `dist/`：

1. 首页、About、归档和公开文章各只有一个 Canonical，且都使用博客域名。
2. `dist/404.html` 有 `noindex, nofollow`，没有 Canonical。
3. Sitemap 只包含 `https://blog.example.com`，不含 404、草稿或主站 URL。
4. RSS 频道和文章链接使用博客域名，不含草稿。
5. robots.txt 指向 `https://blog.example.com/sitemap-index.xml`。
6. 生产输出中没有 Fuwari 演示域名 `fuwari.vercel.app`。
7. 有封面的文章按上表确认 `og:image`、`twitter:image` 和 JSON-LD `image` 都输出绝对 URL；相对封面应指向优化后的 `_astro/` WebP 产物。
8. `dist/_astro/` 不包含只被草稿 Markdown 或草稿封面引用的媒体，Pagefind 索引不包含草稿或 Mermaid 源码。

本地预览只能验证生成结果；正式上线后还应在 Cloudflare Pages 的实际域名上复查 HTTP 状态、重定向、缓存头和分享平台抓取结果。
