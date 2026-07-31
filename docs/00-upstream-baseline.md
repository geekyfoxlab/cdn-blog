# 上游基线

## 来源

本项目以 Fuwari 官方仓库为基础：

- 仓库：`https://github.com/saicaca/fuwari`
- 初始化提交：`6d39b0dec41282e7852e23e032998a5789abee28`
- 初始化日期：2026-07-31
- 模板包版本：`0.0.1`
- Astro 版本：`5.13.10`
- pnpm 版本：`9.14.4`

该仓库在初始化时没有可用的 Git tag 或 GitHub Release。因此，以上提交 SHA 是后续升级比较的唯一基线。当前工作树仍是未提交的本地项目，没有远程仓库。

## 初始化方式

工作目录在开始前已存在一个无提交的本地 Git 仓库。为了保留该仓库的 Git 元数据，初始化时复制了官方源码内容，但没有复制上游的 `.git` 目录，也没有添加远程仓库或创建提交。

这与官方 `pnpm create fuwari@latest` 的目标一致：获得一份独立维护的 Fuwari 项目，而不是直接在博客仓库中继承上游提交历史。

## 阶段 1：本地兼容性调整

阶段 1 为使上游源码通过严格检查，保留以下差异：

| 文件 | 调整 | 升级时的复核点 |
| --- | --- | --- |
| `src/components/LightDarkSwitch.svelte` | 将单个 `$state` 变量改为等价的 Svelte 响应式变量，修复 Astro 对 `client:only` 的组件属性推断。 | 若上游已修复 Svelte 5 组件类型，可恢复上游实现。 |
| `src/components/ArchivePanel.svelte` | 为查询参数数组提供默认值，并允许文章分类为 `null`，与 Content Collection Schema 保持一致。 | 对照上游组件属性和 `src/content/config.ts` 的分类类型。 |
| `package.json` | 将 `type-check` 调整为 Astro 应用适用的 `tsc --noEmit`，并把运行时范围固定为 Node.js 22。 | 若项目转为需要发布类型声明的库，再评估 `isolatedDeclarations`；Node 主版本升级需同步 CI、Pages 和文档。 |
| `package.json`、`pnpm-workspace.yaml` | pnpm 9 通过 `pnpm.onlyBuiltDependencies` 使用构建脚本白名单；工作区文件声明根包，并通过 `allowBuilds` 兼容 pnpm 11。只允许 `esbuild`、`sharp` 和 `@parcel/watcher` 执行构建脚本，并禁用 `swup` 的非必要安装后脚本。 | 升级 pnpm 或依赖后同步检查两处允许列表和安装行为。 |

## 阶段 2：站点接入差异

阶段 2 将博客业务配置与主站导航从主题默认值中隔离：

| 文件 | 调整 | 升级时的复核点 |
| --- | --- | --- |
| `src/config/site.ts` | 新增独立业务配置，集中管理域名、导航、作者占位、联系方式、主题色、图标/背景图、SEO、RSS、许可证和功能开关。 | 保持为本站配置源，不用上游文件覆盖。 |
| `src/config.ts` | 改为读取业务配置的 Fuwari 兼容层。 | 合并上游新增的主题配置字段，并继续从 `blogConfig.appearance` 映射外观配置。 |
| `astro.config.mjs`、`src/pages/rss.xml.ts` | 从业务配置读取正式博客域名。 | 检查 Astro 的 `site` 与 RSS 回退地址仍指向博客子域名。 |
| `src/types/config.ts` | 为导航新增显式外部地址/新标签选项，为头像新增替代文本。 | 若上游类型已覆盖这些能力，可合并实现。 |
| `Navbar.astro`、`NavMenuPanel.astro` | 将“外部地址”和“新标签打开”解耦。 | 主站链接应继续使用当前标签。 |
| `Footer.astro`、`src/components/widget/Profile.astro` | 接入主站入口、统一页脚配置和头像替代文本。 | 保留集中配置引用，避免重新写死域名。 |

## 阶段 3：基础博客能力差异

阶段 3 在保留主题结构的前提下补齐 SEO、公开内容边界和基础页面：

| 文件或范围 | 调整 | 升级时的复核点 |
| --- | --- | --- |
| `src/types/seo.ts`、`src/utils/seo-utils.ts`、`src/components/Seo.astro` | 新增统一 SEO 类型、Canonical/绝对资源 URL 工具和 head 元数据组件。 | 保持博客域名为唯一 Canonical 根；确认 noindex 页面不意外生成 Canonical。 |
| `src/layouts/Layout.astro`、`src/layouts/MainGridLayout.astro` | 将页面 SEO 属性向下传递，并支持文章类型、日期、标签和 noindex。 | 合并上游布局变更时保留 head 插槽和 SEO 参数。 |
| `src/pages/posts/[...slug].astro` | 增加文章 SEO 参数和 BlogPosting JSON-LD，包含 Canonical、作者主站 URL、日期、标签和可解析的绝对图片；补全文章 `h1`、封面替代文本及有效的相邻文章链接。 | 合并时保留阶段 4 的本地封面解析和绝对优化社交图片；继续检查标题语义和键盘导航。 |
| `astro.config.mjs`、`src/pages/robots.txt.ts`、`src/pages/rss.xml.ts` | Sitemap 排除 404；robots 允许根路径并指向博客 Sitemap index；RSS 输出标准 `zh-CN` 语言值。 | 复核输出域名、语言值和 404 过滤。 |
| `src/pages/about.astro`、`src/content/spec/about.md` | About 改为配置驱动，使用明确的个人信息占位和技术方向列表。 | 不要在升级或补文案时虚构个人经历。 |
| `src/pages/404.astro` | 新增静态 404 页面，提供博客首页与主站链接，输出 noindex。 | 保持无 Canonical、无 Sitemap 条目和无 Pagefind 内容。 |
| `src/content/config.ts`、`scripts/new-post.js` | 标题去空白后必须非空；公开文章必须提供非空 `description`；标签与分类去除首尾空白；新文章模板默认写入 `draft: true`。 | 新增字段时保持草稿与公开内容的校验边界，并同步模板。 |
| `frontmatter.json` | 将 Front Matter 编辑器的语言字段统一为 Schema 实际使用的 `lang`。 | Schema 字段变更时同步编辑器配置和写作文档。 |
| `src/content/posts/*.md`、`src/content/posts/guide/index.md` | 将 Fuwari 上游演示文章标记为 `draft: true`，避免示例内容发布。 | 后续发布前逐篇替换为已审核内容。 |
| `src/utils/content-utils.ts`、`src/components/PostPage.astro`、`src/pages/[...page].astro` | 复用生产草稿过滤，增加无公开文章空状态，在只有一页时隐藏分页，并为同日文章提供稳定 slug 排序。 | 新增内容查询必须继续过滤生产草稿。 |
| `src/components/ArchivePanel.svelte`、`src/pages/archive.astro` | 归档在 SSR 阶段分组，客户端读取 `tag`、`category` 和 `uncategorized` 查询参数并显示计数/空状态；归档使用 `client:load`。 | 保持 Svelte 与 Astro SSR 兼容，复核筛选结果和无文章状态。 |
| `src/components/control/ButtonLink.astro`、`src/components/widget/Tags.astro`、`src/components/widget/Categories.astro`、`src/components/PostMeta.astro`、`src/components/PostCard.astro` | 修复链接与按钮嵌套结构，补充标签/分类无障碍标签，并以文章标题作为封面替代文本回退。 | 主题升级后继续检查有效 HTML 和可访问名称。 |
| `package.json`、`pnpm-lock.yaml` | 将 Svelte 依赖精确更新到 `5.45.5`，消除归档页 `experimental_async_ssr` 构建警告。 | 升级 Astro/Svelte 时重新运行构建，避免回退到产生该警告的版本组合。 |

阶段 3 的构建仍是纯静态输出。Giscus、Cloudflare Analytics、Cloudflare Pages 和 PWA 未在该阶段接入；Mermaid 与图片管线的后续差异记录在阶段 4。

## 阶段 4：Markdown 与图片管线差异

阶段 4 在不引入服务端运行时的前提下增强文章渲染，并收窄生产媒体导入范围：

| 文件或范围 | 调整 | 升级时的复核点 |
| --- | --- | --- |
| `package.json`、`pnpm-lock.yaml` | 固定加入 `mermaid@11.16.0` 与 `yaml@2.8.2`。 | 升级 Mermaid 时复核安全模式、主题 API、渲染输出与延迟加载产物。 |
| `astro.config.mjs` | 配置 `[480, 960, 1440, 1920]` 图片断点、`constrained` 布局与响应式样式；接入草稿图片 guard、Mermaid 和 Caption 插件。 | 保持插件顺序，确认本地 Markdown 图片仍获得 `sizes`、`srcset` 和固有尺寸。 |
| `src/plugins/rehype-mermaid.mjs`、`src/utils/mermaid.ts`、`src/styles/markdown.css` | Mermaid 源码保存在 DOM 数据属性中；浏览器端动态加载 Mermaid，使用 `strict` 安全模式，并在主题变化和 Astro/Swup 页面载入后重绘。渲染失败或 JavaScript 不可用时保留 Expressive Code 源码回退。 | 检查源代码回退、无障碍名称、深浅色重绘、Swup 往返和客户端包体。 |
| `src/plugins/rehype-image-caption.mjs` | 将独占段落且带 Markdown `title` 的图片转换为语义化 `figure`/`figcaption`，并为本地正文图片补充 `sizes`。 | 不要把 `title` 同时当浏览器提示文本；复核图片不独占段落时的行为。 |
| `src/plugins/remark-draft-image-guard.mjs`、`src/plugins/published-post-images.mjs` | 生产构建先移除草稿 Markdown 图片节点；虚拟封面清单在开发环境包含草稿、生产环境只导入公开文章封面。 | 新增图片入口时必须复核草稿资源不会进入 `dist/_astro/`。 |
| `src/utils/image-utils.ts`、`ImageWrapper.astro`、文章页与卡片 | 取消跨 `src/` 的宽泛图片 glob；本地封面从清单解析，显示时生成响应式资源，社交元数据生成绝对的 1200x630 WebP URL。 | 保持 public、远程和本地资源三类路径的不同处理，验证 OG、Twitter 与 JSON-LD URL。 |
| `src/layouts/Layout.astro` | 显式导入八个全局样式文件，避免依赖旧图片 glob 的偶然 CSS 副作用。 | 上游合并时不要删除显式导入；新增全局样式时在布局入口登记。 |
| `src/layouts/Layout.astro` 的 PhotoSwipe 初始化 | 放大图使用 `currentSrc`，优先读取 `width`/`height` 属性并回退自然尺寸，同时传递 `alt`；PhotoSwipe core 只在打开图片时动态加载。 | 检查响应式图片选源、键盘操作、Swup 销毁/重建和替代文本。 |

阶段 4 仍保持纯静态输出。Giscus 与 Cloudflare Web Analytics 继续关闭，外部部署和 DNS 未在此阶段执行。

## 阶段 5：搜索、评论与统计差异

阶段 5 保持无后端静态架构，并将所有第三方接入设计为默认关闭：

| 文件或范围 | 调整 | 升级时的复核点 |
| --- | --- | --- |
| `src/components/Search.svelte`、`src/components/Navbar.astro`、`src/global.d.ts` | Pagefind 只在生产构建加载真实索引；开发环境显示明确提示，不生成伪造结果；全局状态避免组件水合与脚本加载竞态。 | 复核 Pagefind 模块路径、Swup 持久导航、并发搜索结果顺序和无索引回退。 |
| `src/config/integrations.ts`、`.env.example`、`src/env.d.ts` | 集中解析 Giscus 与 Cloudflare Web Analytics 的公开构建变量；配置值不完整时保持关闭。 | 新增变量必须显式列入 Vite 可静态替换的环境映射，并保持真实 `.env` 被忽略。 |
| `src/components/GiscusComments.astro`、`src/utils/giscus.ts`、文章页 | 仅文章页条件输出评论容器，按需加载 Giscus，并同步深浅色与 Astro/Swup 页面生命周期。 | 检查重复 iframe、主题消息目标源、路径映射和离开文章页后的观察器清理。 |
| `src/layouts/Layout.astro` | 仅在生产环境、两个统计开关和非空站点 Token 同时满足时异步注入 Cloudflare Web Analytics beacon。 | 保持默认无第三方请求，不把 Cloudflare API Token 当作公开站点 Token。 |
| `package.json`、`pagefind.yml`、`docs/09-Pagefind配置.md` | `pnpm build` 在 Astro 输出后生成 Pagefind 静态索引，并排除草稿、评论和实现细节。 | 升级 Pagefind 时复核 CLI 输出目录、中文索引、排除选择器和 Cloudflare Pages 构建。 |

评论和统计的代码已接入，但集中配置默认关闭且标识为空；未执行 GitHub、Giscus、Cloudflare 或 DNS 的外部配置。

## 升级原则

1. 在独立分支中获取目标 Fuwari 版本或提交。
2. 比较 `package.json`、`astro.config.mjs`、`src/config.ts`、内容 Schema、布局、导航、归档和插件目录，不覆盖 `src/config/site.ts`、SEO 扩展、图片清单和内容发布边界。
3. 将本站自定义配置优先放在独立模块中，减少直接改动主题文件。
4. 运行 `pnpm check`、`pnpm type-check`、`pnpm exec biome check ./src` 与 `pnpm build`，并手工检查文章、Mermaid、响应式图片、搜索、RSS、Sitemap、robots、404 和深浅色模式。
5. 确认没有覆盖本站配置、占位信息、草稿内容过滤和草稿媒体隔离后再合并。

完整操作见 [主题升级指南](12-主题升级指南.md)。
