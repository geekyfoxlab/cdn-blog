# 问题与稳定解法

## 使用方式

遇到症状时先匹配本文件，再执行最小诊断。每项均按“现象 → 根因 → 稳定解法 → 验证 → 禁止做法”组织，避免重新探索已经确认的路径。

## 1. 登录账号在系统浏览器，内置浏览器没有登录

**现象**：GitHub/Cloudflare 页面要求重新登录，OAuth 流程不方便。

**根因**：内置浏览器和系统 Chrome 使用不同会话；登录态不会自动共享。

**稳定解法**：用户明确指定系统 Chrome 时，读取并使用 Chrome 控制技能，复用已有标签页和登录态。先确认目标账号，再进行外部变更。

**验证**：GitHub 页面能看到目标仓库，Cloudflare 页面能看到正确账户和 zone。

**禁止做法**：不要擅自切回内置浏览器，不要读取 cookies、密码或浏览器存储，不要让用户在聊天中发送 Token。

## 2. GitHub 私有仓库能否部署 Cloudflare Pages

**现象**：担心 Pages 只支持公开仓库，或为了部署准备把源码公开。

**根因**：混淆了 Git 仓库可见性、GitHub App 授权和公开站点可访问性。

**稳定解法**：保持仓库 Private，通过 Cloudflare GitHub App 只授权目标仓库。Pages 构建产物本身仍公开。

**验证**：GitHub UI 显示 `Private`；Cloudflare 项目显示正确仓库和自动部署已启用。

**禁止做法**：不要为了 Pages 改成 Public，不要授权整个 GitHub 组织，不要把 Cloudflare API Token 放入仓库。

## 3. 私有源码仓库无法直接使用 Giscus

**现象**：评论组件不显示，或 Giscus 配置要求公开 Discussions 仓库。

**根因**：Giscus 通过公开 GitHub Discussions 工作；私有源码仓库不适合作为公开评论仓库。

**稳定解法**：默认关闭评论。需要评论时另建最小权限的公开 Discussions 仓库，并单独完成隐私与内容治理评估。

**验证**：默认页面不请求 `giscus.app`；启用后评论只指向确认的公开仓库。

**禁止做法**：不要公开源码仓库来迁就评论，不要把 Personal Access Token 注入前端。

## 4. 为什么已经有自定义域，还需要 `pages.dev`

**现象**：认为只能使用 `*.pages.dev`，或将 Canonical 临时改成预览域。

**根因**：`pages.dev` 是 Pages 项目源站与预览地址；自定义域是其上层绑定，两者并存。

**稳定解法**：先用 `pages.dev` 验收，再在 Pages Custom domains 添加博客 FQDN。生产 `siteUrl` 和 Canonical 始终保持自定义域。

**验证**：Pages 项目同时列出自定义域和 `pages.dev`，两者返回相同站点，自定义域 SSL active。

**禁止做法**：不要删除 `pages.dev`，不要将业务 Canonical 改成预览域。

## 5. 自定义域存在旧 A，Pages 需要 CNAME

**现象**：Pages 域名验证冲突，DNS 控制台已有同名 A。

**根因**：同一主机名不能同时保留互相冲突的 A 与 CNAME；Pages Git 集成期望项目域名指向 `<project>.pages.dev`。

**稳定解法**：先确认旧主机用途和授权范围。只替换完整博客 FQDN 的冲突记录；Cloudflare 同 zone 通常会创建代理 CNAME。

**验证**：DNS 控制台中博客记录为代理 CNAME，Pages 显示 Active/SSL enabled。

**禁止做法**：不要触碰根域、`www`、Nameserver、MX/TXT 或其他子域；不要手工猜 Pages IP。

## 6. `dig` 仍看到旧 A，但浏览器和 Cloudflare 已正常

**现象**：本机 `dig`、甚至指定 Nameserver 的 UDP 查询仍返回旧 A，而 Cloudflare DNS UI 是新 CNAME，HTTPS 已加载 Pages。

**根因**：可能同时存在递归缓存、网络 DNS 拦截/合成地址和 Cloudflare 代理 CNAME flattening。代理记录公开查询本来就可能返回 A，而不是暴露 CNAME。

**稳定解法**：联合使用 Cloudflare 控制台、独立 DNS-over-HTTPS、至少两个网络和 HTTPS 内容/证书判断。记录 TTL，等待传播。

**验证**：DoH 返回 Cloudflare 地址；HTTPS 页面内容与 `pages.dev` 一致，响应头 `server: cloudflare`，证书覆盖完整 FQDN。

**禁止做法**：不要把某次 `dig` 得到的 IP 写回 DNS，不要因为单一解析器结果反复切换记录。

## 7. 根域由 Squarespace/其他主站承载

**现象**：zone 中有多个根域 A、`www` CNAME 和邮件记录，博客只需要一个子域。

**根因**：博客、主站和邮件共享一个 DNS zone，但属于不同服务边界。

**稳定解法**：在变更前导出记录，只操作明确授权的博客 FQDN。将根域、`www`、邮件和其他子域列入禁止变更清单。

**验证**：博客上线后主站和邮件记录值未变化。

**禁止做法**：不要为了单个子域迁移整个 Nameserver，不要批量清理“看起来无关”的记录。

## 8. 本机显示 Node 23/24、pnpm 11，而项目要求 Node 22/pnpm 9

**现象**：`node --version`、`pnpm --version` 与项目固定版本不一致；构建虽成功但有 engine/legacy 警告。

**根因**：shell PATH、Corepack 或工具运行时覆盖了项目版本。

**稳定解法**：先运行 `doctor.mjs`。本地使用版本管理器切到 Node 22 和 pnpm `9.14.4`；Pages 明确配置 `NODE_VERSION=22`、`PNPM_VERSION=9.14.4`。

**验证**：Cloudflare 日志显示 `Detected ... nodejs@22.x, pnpm@9.14.4`，并执行 `pnpm build` 成功。

**禁止做法**：不要把非目标运行时的成功当作唯一验收，不要仅为消除警告随意修改锁文件。

## 9. pnpm 报 `onlyBuiltDependencies` legacy/ignored

**现象**：pnpm 11 提示 `package.json#pnpm.onlyBuiltDependencies` 不再读取。

**根因**：模板以 pnpm 9 为固定基线，同时通过 `pnpm-workspace.yaml#allowBuilds` 兼容新版本。

**稳定解法**：在目标 pnpm 9 上验收；保留两个安装脚本白名单入口，直到正式升级基线。

**验证**：只允许 `esbuild`、`sharp`、`@parcel/watcher` 执行需要的安装脚本，构建通过。

**禁止做法**：不要删除白名单或全局允许依赖安装脚本来消除提示。

## 10. Cloudflare Node 22 有维护期或 patch engine 警告

**现象**：构建日志提示 Node 22 接近 EOL，某个工具希望更高 patch 或 Node 24。

**根因**：平台镜像和依赖的生命周期会前进，项目固定基线可能落后。

**稳定解法**：若构建仍成功，将警告记录为风险；另开依赖/Node 升级任务，在独立分支验证 Node 24、Astro、Sharp 和 Pagefind。

**验证**：升级分支通过完整本地检查、Pages 预览和浏览器回归后再改生产基线。

**禁止做法**：不要在域名上线任务中顺手升级主版本，不要忽略真实的安装失败。

## 11. 开发环境搜索没有结果

**现象**：`pnpm dev` 中搜索不可用，或有人准备写假结果绕过。

**根因**：Pagefind 只在 `pnpm build` 后扫描 `dist` 生成静态索引。

**稳定解法**：开发环境显示明确提示；真实搜索使用 `pnpm build && pnpm preview` 验收。

**验证**：`dist/pagefind/pagefind.js` 存在，公开内容能命中，无结果状态正确。

**禁止做法**：不要伪造搜索数据，不要将草稿加入生产索引来测试。

## 12. 草稿文章或图片可能泄漏到生产

**现象**：草稿不显示，但资源可能仍被打包；`public/` 文件总会发布。

**根因**：内容过滤和资源收集是两个入口；Astro 引用资源与 `public/` 复制行为不同。

**稳定解法**：保留生产内容查询过滤、Markdown 草稿图片 guard 和公开封面清单。敏感文件永远不进入仓库或 `public/`。

**验证**：生产没有草稿路由、RSS/Sitemap/Pagefind 条目或仅由草稿引用的媒体。

**禁止做法**：不要将“draft 不显示”等同于“文件不会发布”。

## 13. 404 页面看起来正确，但 HTTP 状态可能是 200

**现象**：浏览器看到 404 UI，托管平台却回退首页并返回 200。

**根因**：静态平台的未知路径回退策略可能覆盖 `404.html` 状态。

**稳定解法**：在 Pages 预览和自定义域分别用 `curl -I` 检查未知路径。

**验证**：未知路径 HTTP 状态为 404，页面包含 `noindex`。

**禁止做法**：不要只凭页面文案判定 404 成功。

## 14. `pages.dev` 预览的 Canonical 指向自定义域

**现象**：预览页面 Canonical 不是当前浏览地址，误以为 SEO 配置错误。

**根因**：Canonical 描述正式内容归属，不应随临时预览域变化。

**稳定解法**：保留正式博客 `siteUrl`；在预览阶段只验证预期 Canonical，不改配置。

**验证**：预览和正式域的 Canonical 均指向正式博客 URL。

**禁止做法**：不要为预览构建动态替换 Canonical 为 `pages.dev`。

## 15. 评论/统计关闭后仍出现第三方请求

**现象**：页面请求 `giscus.app` 或 `cloudflareinsights.com`。

**根因**：开关、环境变量和生产条件没有同时约束，或模板被直接注入脚本。

**稳定解法**：评论/统计要求功能开关、集成开关和完整配置同时成立；默认全部关闭。运行 `verify-build.mjs`。

**验证**：默认 HTML 不包含对应域名，浏览器网络也无请求。

**禁止做法**：不要将 Cloudflare API Token 当 Web Analytics site token，不要提交真实 `.env`。

## 16. GitHub SSH 22 推送被网络关闭

**现象**：`Connection closed ... port 22`，重试仍失败。

**根因**：当前网络或代理阻断 SSH 22，不代表仓库权限丢失。

**稳定解法**：先确认本地提交安全、远端未前进。使用系统已有 Git 凭据通过 HTTPS 推送；成功后用 HTTPS fetch 更新 tracking ref。保留原 remote，除非用户要求修改。

**验证**：本地 HEAD 与 `origin/main` SHA 一致，GitHub UI 显示提交。

**禁止做法**：不要关闭 `StrictHostKeyChecking`，不要盲信未知 SSH 443 主机指纹，不要在 URL 中嵌入 Token。

## 17. Pages webhook 没有立刻显示新提交

**现象**：GitHub 已有新 SHA，Cloudflare 部署列表几十秒内仍是旧提交。

**根因**：GitHub webhook、Cloudflare 队列和 Dashboard 前端缓存存在短暂延迟。

**稳定解法**：等待 30-90 秒并刷新项目部署页；搜索准确短 SHA。不要立即创建重复项目或手动上传。

**验证**：新 SHA 出现在 Production，生成唯一部署 URL和 Details。

**禁止做法**：不要因短暂延迟重连 GitHub App、删除项目或改生产分支。

## 18. 文档提交导致“当前部署 ID”立刻过时

**现象**：为了记录当前 SHA/部署 ID 提交文档，新的文档提交又触发下一次部署。

**根因**：版本控制内的“当前”是自引用状态，提交本身会改变它。

**稳定解法**：记录“交接基线提交/部署 ID”或追加部署事件，不声称永远当前。最新状态以 GitHub/Pages 控制台为准。

**验证**：记录字段能明确对应某次已完成部署，后续提交不会让历史记录变成错误。

**禁止做法**：不要用无休止的新提交追逐“当前部署 ID”。

## 19. Cloudflare 显示 Uploaded 0 files

**现象**：部署成功，但日志显示上传 0 个文件，怀疑没有发布。

**根因**：提交只改文档或输出资产与上一版字节相同，Cloudflare 复用已有 237 等资产。

**稳定解法**：检查 `Success: Assets published!` 和 `Success: Your site was deployed!`，再验证部署 URL。

**验证**：新提交有独立部署 ID/URL，正式域 HTTP 验收通过。

**禁止做法**：不要为了产生上传量修改静态资产或清缓存。

## 20. 构建成功但有 Mermaid chunk/Browserslist 警告

**现象**：Vite 提示大于 500 kB，Browserslist 数据过期。

**根因**：Mermaid 图表模块较大但按需加载；浏览器数据提示不等于构建失败。

**稳定解法**：记录警告，确认 Mermaid 仍是动态导入。依赖更新单独执行，不阻塞无关部署。

**验证**：构建退出码 0，普通页面不提前加载 Mermaid，图表页能渲染和回退。

**禁止做法**：不要为了消除警告把 Mermaid 打进主包，也不要在上线中顺手批量升级依赖。

## 21. 临时项目复用 `node_modules` 后 pnpm 要求清理

**现象**：将另一个项目的 `node_modules` 软链接到新项目后，pnpm 报 `ABORTED_REMOVE_MODULES_DIR_NO_TTY` 或准备删除依赖目录。

**根因**：pnpm 的虚拟存储、项目路径和版本元数据绑定到原项目，软链接不是可复现安装。

**稳定解法**：在临时项目中执行独立的 `pnpm install --frozen-lockfile`；测试环境已有 store 时可追加 `--offline`。CI 环境显式设置 `CI=true`。

**验证**：新项目拥有自己的 `node_modules/.pnpm`，后续 check/build 不触发目录清理确认。

**禁止做法**：不要复制或软链接另一个项目的 `node_modules`，不要用 `--force` 掩盖依赖布局问题。

## 22. 干净安装构建失败：`The btn-regular-dark class does not exist`

**现象**：原项目复用已有 `node_modules` 时可以构建，但新脚手架执行独立的冻结安装后，PostCSS 在 `src/styles/markdown.css` 的 `@apply btn-regular-dark` 处失败。

**根因**：`btn-regular-dark` 是 `main.css` 中定义的自定义组件类，不是 Tailwind 原生 utility。Astro/Vite 会将两个 CSS 入口作为独立的 PostCSS 处理单元，Tailwind 不保证 `@apply` 能解析另一个入口文件中的自定义类。旧依赖目录或旧缓存可能暂时掩盖这个边界错误。

**稳定解法**：让每个 CSS 入口独立可编译。将复制按钮需要的原生 Tailwind utilities 直接写入 `markdown.css`，并在 `.copy-btn.success` 中显式声明成功态背景；不要跨文件 `@apply` 自定义类。同步修改项目源码和 Skill 的 `assets/blog-template/`。

**验证**：在全新目录运行 `scaffold.mjs`，执行独立的 `pnpm install --frozen-lockfile`，再运行 check、type-check、Biome 和 build；确认 `dist` 生成，复制按钮默认、hover、点击成功态及深色模式均正常。

**禁止做法**：不要复用旧 `node_modules` 作为验收，不要清缓存后反复碰运气，不要通过关闭 PostCSS/Tailwind 检查或使用 `--force` 掩盖错误。

## 23. 脚手架生成成功，但 Biome 要求重新排版配置

**现象**：短名称、短描述和少量主题通过检查，换成长描述或多个主题后，`src/config/site.ts` 被 Biome 判定为需要换行。

**根因**：直接替换模板 token 只保证语法有效，不保证替换后的动态内容仍符合 80 列格式；按 100 列决定主题数组是否折行也与 Biome 默认行宽不一致。

**稳定解法**：由 `scaffold.mjs` 使用 `JSON.stringify` 生成完整 TypeScript `const` 声明，并按声明是否超过 80 列选择单行或缩进换行。不要只替换等号右侧字面量，否则长值换行时可能在等号后留下空格。主题数组同样按包含属性前缀后的 80 列阈值决定单行或多行。Markdown 和页面文案仍使用经过字符校验的原始文本 token。

**验证**：分别使用单主题和八主题、短描述和长描述生成项目；不执行 formatter，直接运行 `biome check ./src`，两组都应通过，并确认没有未解析 token。

**禁止做法**：不要把 `biome format --write` 当作脚手架正确性的前置条件，不要简单放宽全项目行宽来适配生成器，也不要手工维护两套格式模板。

## 24. 并行运行 pnpm 检查后出现 `.bin` ENOENT 和 TypeScript 假错误

**现象**：干净安装成功后，同时执行 `pnpm check`、`pnpm type-check` 和 `pnpm exec biome check`，日志出现 `Failed to create bin ... ENOENT`；随后 TypeScript 报出原本不存在的隐式 `any` 或泛型错误。

**根因**：多个 pnpm 进程可能同时检查或重链接同一项目的 `node_modules`，尤其在非基线 pnpm 版本下会竞争修改 `.bin` 和虚拟存储链接。类型检查此时读到不完整的依赖声明，产生连锁假错误。

**稳定解法**：同一项目的依赖安装和所有 pnpm 验证命令严格顺序执行。若已经发生竞态，只移走或删除该测试项目的精确 `node_modules` 目录，再运行一次冻结安装；随后依次执行 Astro check、type-check、Biome 和 build。

**验证**：串行执行时不再出现 `.bin` ENOENT；同一套源码的类型检查恢复为通过，生产构建正常。

**禁止做法**：不要并行调用同一工作目录中的 pnpm 命令，不要使用 `--force` 修补已竞争损坏的依赖布局，不要因此修改业务类型来消除假错误。
