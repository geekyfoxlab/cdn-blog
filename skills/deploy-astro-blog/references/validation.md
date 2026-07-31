# 验收清单

## 本地质量门

在项目固定的 Node.js 22 与 pnpm `9.14.4` 中顺序执行：

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

非目标 Node/pnpm 下的成功结果只能作为补充，不能替代目标环境。Cloudflare 构建日志可作为目标 Linux 环境的最终证据。

## 构建产物

至少检查：

- `dist/index.html`
- `dist/about/index.html`
- `dist/archive/index.html`
- `dist/404.html`
- `dist/rss.xml`
- `dist/sitemap-index.xml`
- `dist/robots.txt`
- `dist/pagefind/pagefind.js`

确认 Canonical、RSS、Sitemap、robots 全部使用正式博客域，不使用 `localhost` 或 `pages.dev`。404 页面必须带 `noindex`。

## 本地浏览器

使用 `pnpm preview`，不要用开发服务器验收 Pagefind：

- 首页、About、归档和公开文章可访问。
- 未知路径展示 404。
- 搜索能命中公开页面，无结果有明确状态。
- 深浅色、移动端菜单、主站链接和返回顶部正常。
- 图片没有布局抖动、横向溢出或资源 404。
- 有 Mermaid 时检查首次加载、主题切换和页面切换后的重绘。
- Giscus/Analytics 关闭时没有对应第三方请求。

## Pages 预览

在 `pages.dev` 检查 HTTP 状态和内容：

```sh
curl -I https://<project>.pages.dev/
curl -I https://<project>.pages.dev/about/
curl -I https://<project>.pages.dev/404-does-not-exist/
```

首页/About 应为 200，未知路径应为 404。页面 Canonical 仍应指向正式博客域，这是预期行为。

## 自定义域

```sh
curl -I https://blog.example.com/
curl -I https://blog.example.com/about/
curl -I https://blog.example.com/404-does-not-exist/
```

验收标准：

- SSL 证书覆盖完整 FQDN 且校验成功。
- 首页/About/归档/RSS/Sitemap/robots 为 200。
- 未知路径为 404。
- HTML 包含正确站点名称和正式 origin。
- 页面没有意外的 Giscus 或 Web Analytics 脚本。
- Cloudflare 控制台只发生授权的博客记录变更。

## Git 与交接

- `git status --short --branch` 干净，HEAD 与 `origin/main` 一致。
- GitHub UI 显示预期的 Private/Public 状态。
- Pages 部署列表显示准确提交 SHA 和成功部署 ID。
- 记录域名、Pages 项目、构建参数、回滚点和已知警告。
- 不记录 Token、密码、私钥、账号恢复信息或完整敏感 DNS 值。
