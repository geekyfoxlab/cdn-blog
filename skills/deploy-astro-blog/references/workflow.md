# GitHub 与 Cloudflare Pages 工作流

## 目录

1. 输入与模式
2. 新建博客
3. 接管现有项目
4. GitHub 私有或公开仓库
5. Cloudflare Pages Git 集成
6. 自定义域名
7. 发布与回滚

## 1. 输入与模式

执行前收集以下结构化输入：

| 字段 | 规则 |
| --- | --- |
| 模式 | `new` 或 `existing` |
| 项目目录 | 明确的绝对路径；禁止根目录、用户主目录和非空覆盖 |
| 博客名称 | 2-80 字符，不推断真实身份 |
| 项目 slug | 小写字母、数字、单连字符 |
| 博客 URL | HTTPS origin，不带路径/查询参数 |
| 主站 URL | HTTPS origin；独立于博客 |
| 描述 | 1-200 字符，不补写未经确认的个人经历 |
| 主题方向 | 1-8 个短文本 |
| 仓库可见性 | 默认 Private；由用户确认 |
| 自定义域 | 可选；必须是获得授权的完整 FQDN |

将外部变更拆成三次确认：创建/推送 GitHub、创建 Pages 项目、修改自定义域 DNS。一次调用可以连续执行，但不能把首次授权扩展到根域、Nameserver、邮件或其他子域。

## 2. 新建博客

1. 运行 `scripts/scaffold.mjs` 创建去品牌化模板。
2. 检查生成的 `src/config/site.ts`、About、README 和 `package.json`。
3. 使用 Node.js 22、pnpm `9.14.4` 安装依赖。
4. 按 Validation 参考运行四项检查和构建产物验证。
5. 浏览器验收本地 `pnpm preview`，再初始化 Git。

示例：

```sh
node <skill>/scripts/scaffold.mjs \
  --target /absolute/path/my-blog \
  --name "Example Lab" \
  --slug example-blog \
  --blog-url https://blog.example.com \
  --main-url https://example.com \
  --description "记录技术实践与项目经验。" \
  --topics "技术写作,项目记录,学习笔记,工程实践" \
  --git-init
```

不要使用 `--install` 掩盖运行时版本问题；先运行 `doctor.mjs`，确认版本后再安装。需要完全自动化且环境已确认时才追加 `--install`。

## 3. 接管现有项目

1. 先读 `package.json`、锁文件、Astro 配置、站点配置和 `.gitignore`。
2. 确认静态输出目录。Astro/Fuwari 默认是 `dist`，不能仅凭框架名称猜测。
3. 查找已有未提交修改，不覆盖用户工作。
4. 检查正式 `site`、Canonical、RSS、Sitemap、robots 和 404。
5. 检查草稿过滤、`public/` 内容和第三方脚本默认状态。
6. 只有构建通过后才创建远端和 Pages 项目。

不要把当前 Skill 的模板强行覆盖到现有项目。模板只用于 `new` 模式；`existing` 模式沿用原架构并做最小修改。

## 4. GitHub 私有或公开仓库

推荐顺序：

1. 确认本地 Git 状态和默认分支 `main`。
2. 运行敏感信息扫描；真实 `.env`、Token、私钥和私密文章不得提交。
3. 优先使用 GitHub connector 或已认证的 `gh` CLI 创建仓库。
4. CLI 不可用且用户指定系统浏览器时，使用已登录 Chrome 创建仓库。
5. Private 是默认推荐；不要因为 Pages 部署将源码改成 Public。
6. Cloudflare GitHub App 权限只授权目标仓库。
7. 推送后确认远端 SHA 与本地 HEAD 一致，并在 GitHub UI 确认可见性。

SSH 22 被网络阻断时，优先使用系统 Git 凭据的 HTTPS 推送。不要关闭 SSH 主机密钥校验，也不要在命令或日志中打印 Token。

## 5. Cloudflare Pages Git 集成

固定基线：

| 设置 | 值 |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node.js | `22` |
| pnpm | `9.14.4` |

步骤：

1. 使用已登录 Cloudflare 控制台进入 Workers & Pages。
2. 创建 Pages 项目并选择 GitHub Git 集成。
3. 只授权目标仓库，选择 `main`。
4. 填入固定参数，不添加 Cloudflare API Token。
5. 等待首次部署，记录提交 SHA、部署 ID、构建环境和日志结论。
6. 先验收 `*.pages.dev`，再处理自定义域。

Pages Git 集成支持 GitHub 私有仓库。`pages.dev` 是平台提供的源站/预览地址，不是强制替代自定义域。

## 6. 自定义域名

1. 先导出 zone 中完整 DNS 记录，并识别根域、`www`、MX/TXT 和其他子域。
2. 在 Pages 项目的 Custom domains 添加确切博客 FQDN。
3. 若存在同名 A/CNAME 冲突，只处理该 FQDN。
4. 等待域名状态 Active 和 SSL enabled。
5. Cloudflare zone 中通常生成代理 CNAME，目标是 `<project>.pages.dev`。
6. 使用控制台、独立 DoH、HTTPS 和至少两个网络共同验收。

禁止为了单个博客子域修改根域、Nameserver、`www`、邮件记录或无关验证记录。代理 CNAME 对外可能解析成 A 地址；不得将临时解析 IP 写成固定 DNS 目标。

## 7. 发布与回滚

合并或推送 `main` 后等待 Cloudflare webhook。部署列表应出现准确提交 SHA；打开 Details 确认：

- 检测到目标 Node/pnpm。
- `pnpm build` 成功。
- Pagefind 生成索引。
- `Success: Assets published!`
- `Success: Your site was deployed!`

回滚层级：

1. 代码：使用审查后的 revert 提交。
2. Pages：重新部署上一份成功部署。
3. DNS：只恢复最后一次验收通过的博客记录。
4. 数据：DNS 回滚不能恢复已经删除的数据；有旧服务时必须独立备份。

部署记录使用“某次基线提交/部署 ID”措辞。不要在同一个提交中声称自己是永远的“当前提交”，否则文档提交会立即让该字段过时。
