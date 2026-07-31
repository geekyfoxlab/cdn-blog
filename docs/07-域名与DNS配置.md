# 域名与 DNS 配置

## 站点边界

本项目只负责博客子域：

```text
博客：blog.example.com
主站：example.com（独立项目，继续由现有主站承载）
```

博客的 `siteUrl`、Canonical、RSS、Sitemap 和 Open Graph 根地址均为 `https://blog.example.com`。不要为了部署博客把根域改指向博客 Pages 项目。

## 审计记录

以下是迁移前和迁移后的记录（2026-07-31；控制台当前状态优先）：

| 主机名 | 记录 | 当前观察值 | 处理原则 |
| --- | --- | --- | --- |
| `example.com` | A（多条） | 主站现有记录（Squarespace/Coming Soon） | 主站记录，禁止修改。 |
| `blog.example.com` | CNAME（Proxied） | `example-blog.pages.dev` | 当前 Pages 目标，SSL 已启用。迁移前曾观察到未承载项目的旧 A `203.0.113.10`，只保留为审计记录。 |

当前权威 Nameserver 为 `nero.ns.cloudflare.com` 和 `christina.ns.cloudflare.com`。Cloudflare 控制台显示 `blog` 为代理 CNAME；由于代理和递归缓存，部分 `dig` 结果可能暂时显示旧 A 或 Cloudflare A 地址。站长已确认域名为新申请且没有旧项目，因此没有旧站数据迁移需求。

## 推荐迁移顺序

### 1. 先验收 `pages.dev`

先按 [Cloudflare Pages 部署](06-Cloudflare-Pages部署.md) 创建预览并验收。自定义域名和 DNS 在预览通过前保持不变。

### 2. 确认旧服务边界（已完成）

站长已确认域名内没有开发或部署过其他项目。迁移前仍完成以下记录：

- 迁移前 `blog` A 记录为 `203.0.113.10`。
- 域名没有需要迁移的网站文件、媒体、数据库、日志或旧服务配置。
- DNS 控制台中根域、`www`、MX/TXT 和其他子域不在本次变更范围。
- 凭据继续由账号系统或密码管理器保存，不写入仓库。

因此本次可以直接将 `blog` 交给 Pages 管理；迁移前旧 A 仅用于审计，不作为推荐回滚目标。

### 3. 获得范围明确的授权

授权必须明确包括：

- 允许使用 Pages Git 集成。
- 允许将本地分支改为 `main` 并提交/推送到指定 GitHub 仓库。
- 允许添加 `blog.example.com` 自定义域名。
- 允许仅替换 `blog` 主机记录，并说明是否允许删除旧 A `203.0.113.10`。

本次已获得“域名为新申请且只使用 `blog.example.com`，不修改根域”的授权；后续若要修改其他记录，仍需重新确认。

### 4. 在 Pages 添加自定义域名（已完成）

已在 Cloudflare Pages 项目的 **Custom domains** 中添加 `blog.example.com`，域名状态为活动，SSL 已启用；Cloudflare DNS 当前为代理 CNAME `example-blog.pages.dev`。若后续控制台要求重新验证，只操作该 `blog` 记录。

不要手工猜测 Pages 目标、IP 或 CNAME。Pages 的目标值可能因项目和账户而不同，应以控制台提供的值为准。

### 5. 处理冲突记录

如果已有 A 记录阻止 Pages 验证：

1. 导出并保存旧 `blog` A 记录完整信息。
2. 确认站长关于“没有旧项目”的范围说明。
3. 在得到授权后，仅删除/替换 `blog.example.com` 的冲突记录。
4. 保留根域现有记录、`www`、MX/TXT、验证记录和其他子域不变。
5. 等待 DNS 和证书状态稳定，再进行验证。

若 DNS 不在 Cloudflare 托管，需在当前 DNS 服务商执行控制台要求的子域记录变更；不要为了单个博客子域擅自迁移整个 zone 的 Nameserver。Nameserver 迁移会影响主站和所有记录，必须另行评估和授权。

## 验证清单

从至少两个网络环境检查，避免只依赖本机缓存。代理 CNAME 对外可能返回 Cloudflare A 地址，不能把解析到的 IP 当作 Pages 固定目标：

```sh
dig +short blog.example.com A
dig +short blog.example.com CNAME
curl -I https://blog.example.com/
curl -I https://blog.example.com/404-nonexistent/
```

验收标准：

- `blog.example.com` 的最终响应为 HTTPS，证书覆盖完整主机名且无 TLS 错误。
- 首页、公开文章、静态资源和 `/_astro/` 资源不出现 404。
- 不存在路径仍返回 404，而非错误的 200 首页回退。
- Canonical、RSS、Sitemap、robots 和分享图片使用博客域名。
- `example.com` 主站仍保持原服务和响应，不因博客迁移改变。
- DNS 控制台中只看到预期的 `blog` 变更；记录变更时间、操作者、旧值和新值。

证书处于 pending、解析结果混杂超过 TTL、HTTPS 异常或主站异常时，停止进一步变更，保留现状并回到 [Cloudflare Pages 部署](06-Cloudflare-Pages部署.md) 的回滚流程。

## 回滚与传播

DNS 切换前后的记录与最近一次线上验收共同构成回滚输入。需要恢复时：

1. 确认故障来自 DNS，而不是代码或 Pages 构建。
2. 仅恢复 `blog.example.com` 最后一次验收通过的代理 CNAME，不修改根域。
3. 记录 TTL、解析器和 HTTPS 状态，等待缓存传播。
4. 在旧服务恢复后，再决定是否撤销 Pages 自定义域绑定；不要边改 DNS 边删除 Pages 部署历史。

DNS 回滚不会撤销已经被缓存的页面。本次没有旧主机数据可恢复；未来若子域承载其他服务，切换前必须重新设计数据备份和记录回滚。

## 安全边界

- DNS 控制台启用多因素认证和最小权限；不要把登录凭据放入项目。
- 变更只针对 `blog`，提交前后都核对完整 FQDN，防止误操作根域。
- 不把 Cloudflare API Token 放进 GitHub Secrets，除非未来明确选择 API/Wrangler 部署并单独设计权限；当前推荐 Git 集成，无需该 Token。
- DNS 记录、证书和旧主机信息属于运维数据，分享截图时遮盖账户 ID、验证 Token 和内部 IP。
