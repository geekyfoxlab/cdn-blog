# Giscus 评论配置

本项目使用 [Giscus](https://giscus.app/) 将 GitHub Discussions 作为文章评论区。评论组件是可选集成，默认关闭；没有完整配置时，页面不会输出评论容器，也不会请求 `giscus.app`。

博客源码仓库使用私有可见性，不符合 Giscus 对公开 Discussions 仓库的要求。未来启用评论时，应单独创建一个公开的评论仓库，不要把博客源码仓库改为公开，也不要在评论仓库复制私有源码或未发布内容。

## 当前状态

默认配置位于 `src/config/site.ts`：

```ts
giscus: {
  enabled: false,
  repo: "",
  repoId: "",
  category: "",
  categoryId: "",
},
features: {
  comments: false,
}
```

实际渲染前还会经过 `src/config/integrations.ts` 的完整性检查。以下条件必须同时满足：

1. `blogConfig.giscus.enabled` 为 `true`。
2. `blogConfig.features.comments` 为 `true`。
3. 仓库值符合 `owner/name` 格式。
4. `repoId`、`category` 和 `categoryId` 均为非空值。

任一条件不满足，`src/components/GiscusComments.astro` 返回空输出，不会报错。评论只由 `src/pages/posts/[...slug].astro` 引入，首页、归档、About 和 404 不会挂载评论区。

## 获取 GitHub Discussions 标识

这一步需要用户自行在 GitHub 和 Giscus 页面完成；本项目不会替用户创建仓库、开启 Discussions 或授权第三方应用。

1. 准备一个公开 GitHub 仓库，并在仓库 **Settings -> General -> Features** 中启用 **Discussions**。
2. 在仓库的 Discussions 中创建或确认一个用于文章评论的分类。常见选择是 `Announcements` 或 `Q&A`；分类名称可以按自己的社区规则调整。
3. 打开 [giscus.app](https://giscus.app/)，选择对应仓库和分类。Giscus 会检查仓库是否满足公开仓库、Discussions 已启用等条件。
4. 在生成的配置片段中复制以下值：
   - `data-repo` -> `PUBLIC_GISCUS_REPO`
   - `data-repo-id` -> `PUBLIC_GISCUS_REPO_ID`
   - `data-category` -> `PUBLIC_GISCUS_CATEGORY`
   - `data-category-id` -> `PUBLIC_GISCUS_CATEGORY_ID`

这些是用于定位公开仓库和分类的浏览器端标识，不是 GitHub API Token。不要把 GitHub Personal Access Token、Cloudflare API Token、密码或私钥填入这些变量。

## 本地或 Pages 配置

推荐把值放在未提交的环境文件中。`.env.example` 只提供空字段；真实 `.env` 文件已被 `.gitignore` 忽略。

```dotenv
PUBLIC_GISCUS_REPO=your-owner/your-public-repository
PUBLIC_GISCUS_REPO_ID=R_kg...
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=DIC_kw...
```

环境变量会覆盖 `blogConfig.giscus` 中同名的占位值。环境变量名称由 `blogConfig.giscus.environmentVariables` 集中定义，不要在组件中重新写一套名称。仅填写环境变量不会自动打开评论，还需要在 `src/config/site.ts` 同时修改：

```ts
giscus: {
  enabled: true,
  // repo、repoId、category、categoryId 可继续留空，使用 PUBLIC_GISCUS_*。
},
features: {
  comments: true,
}
```

配置变更后重新启动开发服务器或重新构建。Cloudflare Pages 中应在项目的 **Settings -> Environment variables** 配置构建变量，并分别确认 Preview 与 Production 环境的可见范围；不要把变量值打印到构建日志。

## 默认行为与生命周期

评论区域的初始化逻辑位于 `src/utils/giscus.ts`：

- 组件只输出一个带 Giscus 数据属性的容器，不在静态 HTML 中直接写入第三方脚本。
- Layout 首次加载时检查容器，再异步创建 `https://giscus.app/client.js`；脚本属性使用集中配置传入。
- 监听 `astro:page-load`，并在 Swup 的 `page:view` hook 重新检查容器。文章之间导航时会重新挂载，离开文章页时停止主题观察器。
- `mapping` 默认是 `pathname`，因此每篇文章按博客当前路径对应一个 Discussion。不要在启用后随意改变文章路径或尾斜杠策略，否则可能产生新的讨论串。
- 默认 `strict` 为 `1`、反应为开启、输入框位于底部、语言为 `zh-CN`、加载方式为 `lazy`。这些选项仍集中在 `blogConfig.giscus`，需要变更时只修改配置。

## 深浅色同步

主题状态由 `<html>` 的 `dark` class 表示。`src/utils/giscus.ts` 使用 `MutationObserver` 观察该 class，并通过目标源 `https://giscus.app` 向 Giscus iframe 发送 `setConfig.theme`：

- 有 `dark` class 时发送 `dark`。
- 没有 `dark` class 时发送 `light`。
- 切换站点的 Light/Dark/Auto 设置后，评论 iframe 会同步更新。

不要在文章 Markdown 中再放一个手写的 Giscus `<script>`，否则会与 Swup 生命周期产生重复 iframe。

## 验证清单

开启前先运行：

```sh
pnpm check
pnpm type-check
pnpm build
```

在 `pnpm dev` 或 `pnpm preview` 中打开一篇文章，检查：

- 页面只有一个 `#comments` 和一个 Giscus iframe。
- 首页、归档和 About 没有评论区。
- 浏览器 Network 中只在评论已启用且文章页打开后出现 `giscus.app` 请求。
- 切换亮色/暗色后 iframe 主题同步，Swup 从首页进入文章或在文章间切换后仍只保留一个评论区。
- 文章路径与对应 GitHub Discussion 映射正确。

默认配置下可以用下面的检查确认没有第三方评论脚本：

```sh
pnpm build
rg "giscus\.app|data-giscus-container" dist -g '*.html'
```

命令无输出是预期结果。构建后的客户端包可能保留初始化代码和服务地址字符串，但在没有评论容器时不会创建脚本或发起请求。

## 故障排查

### 页面没有评论区

确认两个开关都为 `true`，并检查四个 `PUBLIC_GISCUS_*` 是否在当前构建环境可见。仓库必须是 `owner/name` 格式；ID 前后不要有多余空格。修改环境变量后必须重新启动 Astro 或重新触发 Pages 构建，因为它们是构建时变量。

### Giscus 提示仓库或分类无效

回到 [giscus.app](https://giscus.app/) 重新选择仓库和分类，确认仓库公开、Discussions 已启用，且复制的是 `data-repo-id` 与 `data-category-id`，不是仓库数字 ID 或 GitHub API 凭据。

### 评论串与文章不对应

本项目默认使用 `pathname` 映射。检查正式 URL、语言前缀、尾斜杠和重定向是否一致；不要同时使用多个域名访问同一篇文章后再比较结果。

### 主题切换或 Swup 后评论重复/不更新

删除文章中手写的 Giscus 脚本，确认只保留 `GiscusComments.astro`。刷新后检查页面是否只有一个 `data-giscus-container`。若 iframe 被浏览器扩展拦截，先使用无扩展窗口复测，并检查控制台和 Network 中对 `giscus.app` 的阻断信息。

### 本地开发意外发起请求

本地开发只有在你主动打开两个评论开关并提供完整 `PUBLIC_GISCUS_*` 时才会加载 Giscus。要保持离线开发，关闭任一开关或不要提供这些变量；默认仓库状态已经满足离线条件。

## 关闭和回滚

关闭评论时将 `features.comments` 或 `giscus.enabled` 任一项改回 `false`，并从本地/Pages 构建环境移除 `PUBLIC_GISCUS_*`。重新构建后，文章 HTML 不再包含评论容器，也不会请求 Giscus。不要删除 GitHub Discussions 历史，除非另有数据保留决定；关闭博客侧集成不会删除已有讨论。

评论开启后涉及 GitHub Discussions、第三方 iframe、用户登录和公开评论内容。上线前应在隐私说明中告知这些请求与数据处理边界；本仓库默认不启用评论，也不会自动执行任何外部授权或 DNS 操作。

相关文档：[站点配置](05-站点配置.md)、[Cloudflare Pages 部署](06-Cloudflare-Pages部署.md)。
