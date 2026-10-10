# M10-A 接口权限与安全验证（2026-10-10）

基线 a5267471f7c7fc231e6e0ca7edf30f5a6460fe34，独立 Windows 工作树 `codex/security-threat-model-v2`。这是实施报告；M10 尚未整体验收。

本轮修复剩余 API 页面重定向鉴权、跨站写入与无 Content-Length 流式请求上限、Markdown/打印页消毒、受控 URL 获取、文件签名、验证码消费竞态、新登录会话密码版本及日志脱敏。未执行生产 SQL 写入或迁移、未修改密钥/调度/发布通道。

## 写接口权限矩阵

“作者”只有普通用户权限：文章最终写入/审核仍归管理员，普通作者通过投稿请求。ADMIN_API_KEY 仅被 requireAdminApi 明确接受；它不能冒充用户修改个人资料。游客可用注册/找回密码、联系、订阅、公开统计等刻意公开入口，但仍受来源/大小/对应额度约束。OnlyUs 浏览器直连 Supabase 为独立产品边界，不能用此表证明其 RLS/认证已验收。

| 路由 | 方法 | 游客 | 普通用户 | 作者 | 管理员 | 服务端 Key | 实际大小限制 | 服务端权限依据 |
|---|---|---|---|---|---|---|---|---|
| /api/admin/learn/[slug] | PATCH | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream；修订契约另限 220000 bytes | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/admin/shop/cursors/[id] | PATCH, DELETE | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/admin/shop/cursors | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/admin/shop/cursors/upload | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 11 MiB request + file cap | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/admin/shop/frames/[id] | PATCH, DELETE | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/admin/shop/frames | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/admin/shop/pets/import | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/analytics/track | POST | 允许受限 | 同游客 | 同游客 | 同游客 | 同游客 | 4 MiB stream | public stats; signed user is optional |
| /api/auth/dev-bypass | POST | 仅本地开发 | 仅本地开发 | 仅本地开发 | 仅本地开发 | 仅本地开发 | 4 MiB stream | NODE_ENV development only |
| /api/auth/register | POST | 允许受限 | 同游客 | 同游客 | 同游客 | 同游客 | 4 MiB stream | public purpose endpoint; origin/body guard; existing quota policy |
| /api/bookmarks | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/comments/[id] | PATCH, DELETE | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/comments | POST, PATCH | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/contact | POST | 允许受限 | 同游客 | 同游客 | 同游客 | 同游客 | 4 MiB stream | public purpose endpoint; origin/body guard; existing quota policy |
| /api/edit-requests/all/[id] | PATCH | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/edit-requests | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/follows | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/gallery/[id]/like | POST | 允许受限 | 同游客 | 同游客 | 同游客 | 同游客 | 4 MiB stream | public purpose endpoint; origin/body guard; existing quota policy |
| /api/gallery/[id] | DELETE, PATCH | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/gallery/upload | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 11 MiB request + file cap | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/internal/learn/publish | POST | 拒绝 | 拒绝 | 拒绝 | 拒绝（角色不足） | ADMIN_API_KEY 无效；独立发布签名 | 180000 bytes publisher inner cap | HMAC + timestamp + edition date + evidence + conflict validation |
| /api/newsletter | POST | 允许受限 | 同游客 | 同游客 | 同游客 | 同游客 | 4 MiB stream | public purpose endpoint; origin/body guard; existing quota policy |
| /api/notifications/read-all | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/notifications | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/posts/[slug] | PATCH, DELETE | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/posts/batch | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/posts/image | POST, DELETE | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 11 MiB request + file cap | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/posts | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/posts/view | POST | 允许受限 | 同游客 | 同游客 | 同游客 | 同游客 | 4 MiB stream | public stats; signed user is optional |
| /api/projects/[id] | PATCH, DELETE | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/projects | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/projects/upload | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 11 MiB request + file cap | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/reactions | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/research/points | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/research/reports/[id] | DELETE | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/research/reports | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/security/csp-report | POST | 允许受限 | 同游客 | 同游客 | 同游客 | 同游客 | 32 KiB | public purpose endpoint; origin/body guard; existing quota policy |
| /api/shop/cursors/equip | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/shop/cursors/purchase | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/shop/frames/equip | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/shop/frames/purchase | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/slides/[id] | PATCH, DELETE | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/slides | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 4 MiB stream | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/slides/upload | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 11 MiB request + file cap | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/upload-md | POST | 拒绝 | 拒绝 | 拒绝 | 允许 | 允许 | 11 MiB request + file cap | signed session + live DB admin OR explicit server ADMIN_API_KEY |
| /api/user/avatar | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 11 MiB request + file cap | signed current account; object ownership in DAL/handler |
| /api/user/forgot-password | POST, PATCH | 允许受限 | 同游客 | 同游客 | 同游客 | 同游客 | 4 MiB stream | public purpose endpoint; origin/body guard; existing quota policy |
| /api/user/password | POST, PATCH | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/user/profile | PATCH | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 4 MiB stream | signed current account; object ownership in DAL/handler |
| /api/user/upload | POST | 拒绝 | 仅本人范围 | 同普通用户 | 本人范围 | 拒绝（需用户会话） | 11 MiB request + file cap | signed current account; object ownership in DAL/handler |

| /api/auth/[...nextauth] | POST | 登录协议 | 登录协议 | 登录协议 | 登录协议 | 不替代 OAuth/CSRF | NextAuth delegated | NextAuth CSRF/OAuth protocol |

共 50 个 custom 写路由 / 61 个方法，加 NextAuth 独立 POST；用户态评论、关注、反应等允许操作公开对象，用户 ID 来自会话；资料/通知/收藏/研报/投稿记录则按本人对象绑定。匿名统计的会话读取是可选，不能因为函数导入 getServerSession 就误判其必须登录。

## 关键验证和兼容边界

- 50 个受保护方法的匿名/伪造身份请求均 401/403，验证拒绝时不读取上传流、不调用数据库/图片/邮件/文件服务；登录用户/管理员/Key 的正向案例另测，不把匿名测试当成完整角色覆盖。
- CSRF：Origin 或 Referer 与请求 URL origin 必须一致；浏览器 Cookie 写请求缺失来源和 same-origin 元数据时拒绝。无 Cookie 的显式服务端 Key 客户端可用，Key 由权限函数校验。NextAuth 采用它自己的 CSRF 协议。签名发布接口保留自己的 HMAC 协议且未激活。
- 请求体默认 4 MiB，上传 11 MiB；逐块计数，虚报/缺少 Content-Length 不绕过限制。实际文件 5/8/10 MiB 原有规则保留。PNG/JPEG/GIF/WebP magic 校验不是完整解码器，图片服务仍负责解码；SVG/伪装 HTML 被拒绝。
- Markdown allowlist 原实现移到 shared/markdown，lib/html shim 保留；Work、Skills、PDF 的 HTML 同步消毒。PDF Markdown 在服务端消毒后传给客户端；其首屏 JS 从 103 kB 降为 90.7 kB（本地生产构建，非流量统计）。
- PDF 附件只获取本站 Cloudinary 账户 URL，禁止重定向且同时限制声明大小和实际字节 10 MiB/20 秒。宠物资源只允许固定 codex-pets.net 资源路径、无凭据/端口/片段/路径穿越；key 为有限字母数字连字符。下载 Edge route 保留既有 64 MiB/60 秒限制。
- 验证码 HMAC 用既有 NEXTAUTH_SECRET，按重置/邮箱验证用途隔离；账号/原密码/未过期 token 同一条件 UPDATE 消费，只允许一个成功。迁移兼容未过期旧原文 token，无新列或 DDL。六位 reset code 不能用作全局邮箱验证。
- 新登录 JWT 绑定密码 HMAC 版本，改密后下一请求 user 消失、写入口拒绝；每次读取当前 DB 身份/邮箱/角色。GitHub ID 映射真实 DB ID，配置缺失或账号非管理员拒绝。旧 JWT 没有版本，保留到原有效期，不能宣称所有历史会话已撤销。
- 新 CSP Report-Only 观察 unsafe-eval/HTTP 图片移除效果，保留原执行策略保证 hydration。报告只记录白名单 directive 和 scheme，不保存任意 URL/样本/邮箱/IP/Cookie；32 KiB 上限、单实例限流，尚未严格 CSP 切换。
- 邮件显示名转义、验证链接 token 编码；错误只记录固定 scope、随机 request ID、SQLSTATE 样式代码，不序列化异常/SQL/请求输入。公开错误消息为固定内容，正常业务冲突保留。
- 联系、用户上传、评论提交、投稿复用现有 Neon auth_rate_limits 持久额度；未新增迁移。公开统计/订阅/Gallery like 的旧单实例额度不代表分布式防刷完成。

## 风险处置与后续 M10-B

| 风险 | 当前处置 | 下一步 / 验收 |
|---|---|---|
| 高：积分购买 check-then-write，扣费/流水/所有权分步 | 源码确认竞态；本轮未修改购买语义 | 独立原子事务 PR，重复/不同商品并发、失败回滚、账本一致性真实 SQL 测试；不用 GREATEST 掩盖不足余额 |
| 高：评论/收藏/阅读奖励以及投稿审批多步写入 | 已登记，未宣称重放幂等完成 | 同上，对实际奖励规则和审批 CAS 验证 |
| 高：历史无密码版本 JWT | 兼容保留、新登录已版本化 | 准备历史会话失效方案及影响；切断已有会话需要单独明确决策 |
| 中：头像/光标/宠物向 public 目录写文件 | 输入校验已补；生产持久性未修复 | 复用既有 Cloudinary，确认 URL 契约与失败行为；不增加存储密钥 |
| 中：公开统计/订阅等单实例限流 | 大小/来源保护；不宣称持久防刷 | 复用现有持久限流及可清理窗口；测试多实例并发 |
| 中：框架依赖安全公告 | 现有安装 audit 风险未自动 force 修复 | M12 官方支持版本/依赖可达性矩阵与分阶段升级 |
| 中：CSP 宽执行规则 | Report-Only + 脱敏报告 | 收集真实浏览器观测，再独立评估收紧，不直接删除 unsafe-inline |

## 权限与环境变量只读核查

- GitHub 当前连接账号在仓库有 admin 权限；现有分支保护/CI 门槛保留，未降级权限或旁路规则。
- Vercel 只读取加密变量元数据（未解密值）。XIAOMI_API_KEY / XIAOMI_BASE_URL / MIMO_MODEL 在 Vercel 中仍存在，Web 模型调用已移除；它们仍被独立 Supabase `generate-daily-question` 源码引用，不能据此删除其他平台密钥。先确认 Vercel 部署引用后准备单独清理/轮换审批。Research 与 OnlyUs 公共 URL/anon key 为产品需要，保留。
- Neon 连接器执行身份 neondb_owner：非 superuser，但有 createdb/createrole/bypassrls、公有 schema 权限较宽。它不是已证明的 Vercel runtime DSN 身份，运行时角色待核查；不能混称应用已最小权限。连接器 list_project_permissions 返回 INVALID_ARGUMENT，成员/共享权限清单未取得。
- 权限降级、专用 app role/grants、DSN 轮换、Key 删除均未操作。现有 Neon 08:30 发布链路保留；生产 publish_runs 迁移/独立审计仍待审批，文章存在不能证明自动任务成功。

## 验证记录

- Windows npm ci、typecheck、ESLint、57 文件 / 407 测试、完整 build:ci 已通过；新增真实 PGlite 验证码竞态，未用生产数据库写测试。
- 首次构建暴露 Edge download 不支持 node:crypto 日志依赖，已修为标准 crypto.randomUUID，完整构建重跑通过。首次新增测试括号语法错误已修；未把失败当成通过。
- 本地生产产物 Chrome 154 / 390、1024、1440：真实 NextAuth credentials+CSRF、管理员正常访问/普通用户拒绝、同源资料保存、跨站403/超大413、即时角色撤销、新登录会话改密后401及重登录通过。Work/Skills/PDF 攻击脚本/事件/javascript URL 不执行，GFM 表格保留，零页面和控制台错误（m10-local.json，2026-10-10T04:30:45Z）。测试数据缓存通过本地管理员项目 PATCH 正常失效后验收，未把项目缺失页 200 当成正文通过。Preview/正式生产验收尚未登记。
- NextURL 将 loopback IP 规范化为 localhost，首轮误拒绝正常 Origin；已按实际 Host 同源校验并拒绝 Host 分隔符/伪造 forwarded-host，增加回归，完整构建与浏览器重跑通过。
- 证据路径：`D:/download/search-v2-validation/m10-{tests,typecheck,lint,build,privacy-tests,authorized-tests}.log`。每个断言范围如上，测试数量不是完整渗透测试结论。

- PR [#24](https://github.com/Xavier7776/shengzongPost/pull/24) 为 Draft；首轮 02c876a 的 CI 38024384281 / job 114131988146 全步骤成功、Preview dpl_EZEhtvDnhQWbeBpjttcZEYg6rdkb READY。最终复核补充 legacy JWT picture 输出消毒（407 用例）后将按新 head 重验；不复用旧 head 门禁作为最终合并证据。
- 浏览器上传补测的外部模块替身未覆盖 webpack 内联 SDK，未取得成功结果；缺少模拟 API key 报错，演练进程已关闭，无远端写入。该结果不算验收通过。实际文件/parser 成功拒绝路径已在隔离接口测试覆盖；Preview 中真实管理员上传/外部存储联调仍待可用登录会话。M10-B 同时检查 uploadLarge provider 异常/超时行为。
