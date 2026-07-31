# Cloudflare Pages 部署

## 状态与目标

本项目是纯静态 Astro/Fuwari 博客，目标链路如下：

```text
GitHub Repository -> Cloudflare Pages Git 集成 -> Pages CDN -> blog.example.com
```

该方案以 GitHub 仓库和 Cloudflare Pages 免费计划为默认前提，使用 Pages 自带的 Git 构建与全球 CDN，不额外部署付费服务器，也不在 GitHub Actions 中重复搭建生产发布链路。免费计划的具体配额可能调整，创建项目时应以账户控制台显示为准。

截至 2026-07-31，GitHub 与 Pages 预览部署已经完成：

- GitHub 私有仓库为 `example/example-blog`，默认分支为 `main`。
- Cloudflare Pages 项目为 `example-blog`，已通过 Git 集成成功部署 `example-sha`。
- Pages 预览地址为 `https://example-blog.pages.dev`，首次构建与静态资源验收通过。
- SSD 交接基线提交为 `example-baseline-sha`，部署 ID 为 `00000000-0000-4000-8000-000000000000`，对应预览地址为 `https://preview-id.example-blog.pages.dev`。
- 已绑定自定义域名 `blog.example.com`，Cloudflare DNS 中对应记录为代理 CNAME `example-blog.pages.dev`，SSL 已启用。
- `pnpm build` 的产物目录为 `dist/`；该目录是可丢弃的构建产物，不提交到仓库。
- `example.com` 是独立主站，本博客只使用它作为跨站入口，不能把根域接到本项目。

本文同时记录已完成的 GitHub/Pages/自定义域步骤和仍需遵守的域名迁移边界。

## 固定构建参数

在 Cloudflare Pages 项目中使用以下值：

| 设置 | 值 | 说明 |
| --- | --- | --- |
| Framework preset | Astro（若界面提供） | 仅作默认值，以下显式参数优先。 |
| Production branch | `main` | 需要先获得将本地未出生分支改名并推送的授权。 |
| Root directory | `/` | 仓库根目录；UI 显示为空时等价于根目录。 |
| Build command | `pnpm build` | 先执行 Astro 静态构建，再生成 Pagefind 索引。 |
| Output directory | `dist` | 相对于 Root directory。 |
| Node.js | `22` | 通过 `NODE_VERSION=22` 或 Pages 的 Node 版本设置指定。 |
| pnpm | `9.14.4` | 通过 `PNPM_VERSION=9.14.4` 指定；与 `packageManager` 和锁文件一致。 |

Cloudflare Pages Git 集成负责安装依赖和触发部署，不需要在仓库保存 Cloudflare API Token，也不需要额外使用 Wrangler 进行生产发布。

## 前置检查

执行外部操作前，负责人应逐项确认：

1. GitHub 目标为 `example/example-blog` 私有仓库；Cloudflare Git 授权只授予该仓库。
2. 本地分支已经改名为 `main`、完成提交并推送，remote 使用 SSH。
3. 已在本地按顺序通过 `pnpm check`、`pnpm type-check`、`pnpm exec biome check ./src` 和 `pnpm build`。
4. 已删除验证用文章，并确认 `dist/` 不含草稿路由、草稿媒体或临时内容。
5. 已准备环境变量策略。本地评论不需要环境变量；统计默认关闭，未确认配置前不要打开开关。
6. 已确认该域名未承载过旧项目或数据；迁移前 A `203.0.113.10` 只作为 DNS 审计记录，不作为旧服务回滚目标。

## 连接 GitHub（获批后）

推荐使用 Cloudflare Pages 的 Git 集成，而不是在 GitHub Actions 中保存部署密钥：

1. 在 Cloudflare Dashboard 中进入 **Workers & Pages**，创建 Pages 应用并选择 **Connect to Git**。
2. 授权 Cloudflare 访问目标 GitHub 仓库，权限范围只选择该仓库（若 GitHub 提供精细授权）。
3. 选择博客仓库，确认生产分支为 `main`。
4. 填入上表的构建参数，保存项目配置。
5. 只配置必要的 Pages 环境变量。变量在构建时会写入静态 HTML，日志中不得打印其值。
6. 触发第一次构建，记录项目名、部署 ID、构建日志和生成的 `*.pages.dev` 地址。

Pages 预览部署可能对非生产分支公开。不要把未审核的隐私文章、真实 Token 或内部链接放入会被预览构建发布的内容中。生产内容边界仍由 `draft: true` 过滤负责，但 `public/` 会整体发布。

## 首次验收：先用 pages.dev

在绑定自定义域名之前，必须先通过 Pages 分配的 `pages.dev` 地址验收。建议保存一次可复核的部署记录，并检查：

- 首页、About、归档、公开文章、标签/分类页面返回 200。
- 不存在的路径返回 HTTP 404，并展示 `dist/404.html` 内容。
- `/rss.xml`、`/sitemap-index.xml` 和 `/robots.txt` 存在且链接使用 `https://blog.example.com`，而不是主站或 `pages.dev`。
- 页面 Canonical、Open Graph、JSON-LD 的生产地址符合博客域名预期；切勿因验收临时把业务配置改成 `pages.dev`。
- Pagefind 能检索公开文章，草稿和 Mermaid 源码不进入索引。
- 图片、字体、Mermaid、深浅色切换、Swup 导航和移动端布局没有资源 404、重叠或横向溢出。
- 本地评论可渲染但不会请求第三方评论脚本；Cloudflare Web Analytics 在默认关闭状态下不会请求统计脚本。
- HTTPS 证书、响应头和缓存行为符合预期；记录响应头而不要把含敏感信息的日志提交到仓库。

验收失败时，只修复 Git 分支或 Pages 构建配置并重新生成预览；在通过前不要改 DNS。

### 2026-07-31 验收记录

- 构建提交：`example-sha feat: initialize Example Lab blog`
- 运行环境：Node.js `22.22.0`，pnpm `9.14.4`
- 构建结果：4 个静态页面，Pagefind `zh-cn` 索引生成成功，部署到全球网络成功。
- HTTP 验收：首页、About、归档、RSS、Sitemap、robots 和 Pagefind 资源返回 200；不存在路径返回 404。
- SEO 验收：Canonical、RSS、Sitemap 与 robots 继续使用 `https://blog.example.com`。
- 隐私验收：本地评论只使用浏览器存储；Giscus 与 Cloudflare Web Analytics 保持关闭，页面未注入对应第三方脚本。
- 结论：`pages.dev` 预览通过；自定义域已绑定，SSL active，`blog` 记录由 Cloudflare Pages 管理为代理 CNAME。

## 绑定博客自定义域名（已完成）

已获得“仅使用新申请的 `blog.example.com`，不修改根域”的授权，并完成以下动作：

1. 在 Pages 项目的 **Custom domains** 添加 `blog.example.com`。
2. 完成域名验证和证书签发，控制台状态显示活动，SSL 已启用。
3. 仅替换 `blog` 主机名冲突记录，当前为代理 CNAME `example-blog.pages.dev`。
4. 通过 HTTPS、HTTP 状态、Canonical、静态资源和系统 Chrome 完成验收。

绝不删除或修改 `example.com` 根域记录，也不触碰 `www`、MX、TXT、DKIM、DMARC 或其他子域记录。若后续验证需要修改权威 DNS/Nameserver，应停止并重新确认授权范围。

## 回滚

回滚必须可定位、可记录、可恢复：

| 故障范围 | 回滚动作 | 边界 |
| --- | --- | --- |
| 新代码构建失败 | 在 GitHub 通过审查后的 revert 提交，或在 Pages 重新部署上一版成功部署。 | 不使用 `git reset --hard` 覆盖未提交工作。 |
| Pages 新部署有运行问题 | 在 Pages 部署列表选择上一份成功部署执行 **Rollback**（界面名称可能为重新部署/回滚），记录部署 ID。 | 不删除整个项目，不清空构建历史。 |
| 自定义域证书/绑定失败 | 暂停域名验证，必要时从 Pages 移除自定义域绑定，保留 `pages.dev` 预览继续诊断。 | 不因此修改根域或其他 DNS。 |
| 博客 DNS 记录被误改 | 恢复最后一条已验收的代理 CNAME `example-blog.pages.dev`，并等待 TTL/缓存传播。 | 本次确认没有旧项目，不应默认恢复迁移前的旧 A。 |

DNS 回滚不是数据备份。本次站长已确认域名为新申请且没有旧项目，迁移前 A `203.0.113.10` 仅保留为审计记录；未来若 `blog` 承载新服务，变更前仍需重新导出记录并设计独立回滚。

## 安全与隐私边界

- GitHub Actions 只做检查和构建，不部署生产；工作流权限保持 `contents: read`。
- 不在仓库、Frontmatter、构建日志、截图或聊天中写入 GitHub/Cloudflare API Token、密码、私钥或私有 URL。
- 本地评论写入访客浏览器 `localStorage`，不进入构建产物、服务端日志或 Pages 环境变量；清理浏览器站点数据会删除这些评论。
- `PUBLIC_GISCUS_*` 和 Web Analytics site token 会进入浏览器，是公开配置；它们不能替代 Cloudflare API Token，也不能赋予管理权限。
- Giscus 会把评论区域交给 `giscus.app` 和 GitHub Discussions；启用前应在隐私说明中告知第三方请求、用户登录和评论公开性。当前文章页不挂载 Giscus。
- Web Analytics 默认关闭；仅在明确接受其数据收集范围后启用，且只在生产构建注入 beacon。本地开发不会加载。
- Cloudflare 免费计划的配额和产品限制会变化，部署前应以账户当前页面为准，不在文档中承诺固定额度。

## 相关文档

- [域名与 DNS 配置](07-域名与DNS配置.md)
- [站点配置](05-站点配置.md)
- [Giscus 配置](08-Giscus配置.md)
- [Pagefind 配置](09-Pagefind配置.md)
- [常见问题](13-常见问题.md)
