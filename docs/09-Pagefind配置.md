# Pagefind 搜索配置

本站使用 Pagefind 生成静态全文搜索索引，不依赖后端服务。索引只在生产构建阶段生成，并随 `dist/` 一起发布到 Cloudflare Pages。

## 构建流程

```sh
pnpm build
```

该命令先运行 `astro build`，再执行 `pagefind --site dist`。成功后应能看到以下文件：

```text
dist/pagefind/pagefind.js
dist/pagefind/pagefind-entry.json
```

开发服务器不会生成 Pagefind 索引。开发环境输入关键词时，搜索面板会显示“开发环境未生成搜索索引”的中文提示，不会伪造文章结果。要验证真实检索，请先构建，再启动预览：

```sh
pnpm build
pnpm preview --host 127.0.0.1 --port 4322
```

在预览页面输入公开文章中的中文标题、标签或正文词语，确认结果链接、摘要和高亮内容正确。

## 索引边界

文章正文通过 `data-pagefind-body` 标记为主要索引内容。以下内容不会进入索引：

- `draft: true` 文章及其未公开路由；
- 404 页面、搜索面板和带 `data-pagefind-ignore` 的实现细节；
- Mermaid 原始源码与生成图表的重复内容；
- 代码中明确标记为忽略的 KaTeX 和装饰性元素。

生产构建会在内容查询、路由、首页、归档、标签、分类、RSS 和 Sitemap 层面统一过滤草稿，因此 Pagefind 只会扫描最终生成的公开 HTML。`public/` 目录会原样复制，不能把草稿或敏感内容放在那里并期待 Pagefind 自动过滤。

## 浏览器加载

导航栏在生产环境按需动态导入 `/pagefind/pagefind.js`，并设置摘要长度。加载成功后触发 `pagefindready`；索引缺失或加载失败时触发 `pagefindloaderror`。搜索组件会读取这两个状态并在面板中显示安静、明确的回退提示，不向控制台输出预期错误。

Pagefind 状态保存在页面级 `window.pagefindStatus` 中，避免组件水合与事件触发顺序产生竞态。导航栏位于 Swup 不替换的区域，所以索引只需加载一次；点击结果会先清理搜索面板，再交给 Swup 导航。

## 中文检索

页面根元素的 `lang` 来源于站点配置 `zh_CN`，生成的 HTML 使用 `lang="zh-CN"`。Pagefind 会据此选择语言索引并支持中文内容检索。若以后引入多语言文章，应重新评估语言标记和索引拆分策略，不要只复制现有配置。

## 故障排查

1. 确认使用的是 `pnpm preview`，而不是 `pnpm dev`；只有构建产物包含 Pagefind 文件。
2. 检查 `dist/pagefind/pagefind.js` 是否存在，并确认 Cloudflare Pages 的输出目录是 `dist`。
3. 浏览器网络面板中确认 `/pagefind/` 下的静态资源返回 `200`，且没有被自定义缓存规则拦截。
4. 若结果包含草稿或 Mermaid 源码，先检查文章是否仍为公开状态，以及相关元素是否保留 `data-pagefind-ignore`。
5. 修改 Pagefind 配置后删除旧的 `dist/` 再重新运行 `pnpm build`，避免用旧索引误判结果。

Pagefind 不提供服务端搜索、权限过滤或私有文章保护；任何不应公开的内容都必须在构建输入和 `public/` 目录层面隔离。
