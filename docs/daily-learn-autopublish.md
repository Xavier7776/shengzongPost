# 每日 AI 技术精读：自动发布运行手册

> **2026-10-09 更新：主调度改为 ChatGPT 已有的每日定时任务（北京时间 08:30），并经授权的 Neon 连接向网站业务表写入内容。GitHub Actions 的每日 cron 已关闭，仅保留手动运行的外部 OpenAI 任务作为备用。ChatGPT 定时任务通过连接的应用写入时，可能受到应用可用性与操作审批的约束；未返回成功写入及回读结果时，不得宣称已发布。**

## 发布规则
- 目标：北京时间每天 **08:30**；主调度器为现有 ChatGPT 定时任务（Asia/Shanghai 精确日程）。手动 GitHub Actions 仅供应急；不再有并行 GitHub cron。
- 手动 GitHub Actions 仍只允许从 main 发起，PR 不会触发生产发文。
- 质量检查通过后无须人工批准；检查失败不产生公开文章，Workflow 红灯并保留 GitHub Actions 日志。
- 每个北京时间日期唯一刊号 `daily-learn-YYYY-MM-DD`。重新执行同一天任务不会覆盖已人工修改的文章。

## 初次启用前（生产需要人工操作）
1. 在 Neon 备份后执行 `supabase/migrations/054_learn_editions.sql`；验证旧文章仍可读取。当前迁移体系无法从全新空数据库完整重放，不能自动假定已完成迁移。
2. 在网站服务器 / Vercel 配置随机生成、至少32字符的 `LEARN_PUBLISH_SECRET`，并部署新增发布 API 及阅读器（本 PR 不部署）。
3. GitHub Actions secrets 同名配置 `LEARN_PUBLISH_SECRET`、`OPENAI_API_KEY`；Actions variables 配置 `LEARN_SITE_URL=https://你的域名/`。密钥需与服务端匹配。可选 `OPENAI_MODEL`（默认 `gpt-6.1-sol`）。
4. 合并并部署后，先手动触发 `workflow_dispatch` 且 dry_run=true；检查源采集、模型结构校验和内容深度。再手动执行真实发布（仅当日）。最后启用每天调度。
5. 运行 `npm run typecheck`、`npm test`、`npm run build`，验证 /learn、/blog/daily-learn-...；测试移动端图表、测验、旧文章兼容和 RSS。
6. 监控 GitHub Actions 的失败状态、Neon 记录与网站公开文章。禁用自动发布：在 GitHub Actions 禁用 workflow，或者移除服务端密钥（立即拒绝新请求）。

## API 协议
`POST /api/internal/learn/publish`
- Request: UTF-8 JSON，`Edition` v1 (见 `lib/learn/document.ts`)
- Headers: `x-learn-timestamp` 为 Unix 秒；`x-learn-signature` 为 HMAC-SHA256(secret, timestamp+"."+raw JSON bytes) 的十六进制表示。
- 2分钟时间偏移、180KB 体积限制、严格引用及结构校验，当天日期门禁。
- 201: 当日新文章创建；200: 幂等重试；400/401/409/413/422/500: 拒绝或失败。
- 权限仅允许插入固定 schema 的新精读文章，不能更新或删除任意 posts，不能直接访问管理员 API。
- replay：时间窗口限制和同日唯一约束降低重放影响；如需抗窗口内跨节点重放，可增加 request nonce 数据库表。
- 重要：结构校验、URL 域名校验和元数据可信来源只能降低风险，**无法机械证明论文观点正确**。在需要人工可信度审计的场景，不应开无人值守发布。

## 内容格式
- 独立 `learn_editions.document JSONB` 储存严格结构化文档；原 `posts.content` 留可读文本回退。
- 组件白名单：标题、段落、提示框、流程步骤图、**示意数据**图表、纯文本代码、自测题。
- 客户端只将数据作为文本渲染，不执行 LLM 生成的 JSX/HTML/JavaScript；代码块没有在线执行权限。
- 每段事实/图表引用有来源 ID；真实数值图表暂不支持，避免未经逐项核对的数据污染。图表仅展示标注为教学示例的数据。
- 第一版暂不自动引入外网版权图片，使用可解释的原生流程图/数据图；之后可增加严格许可核验后的图像管线。

## 质量门禁
1. 从最近7天 arXiv API 原始条目中筛选至少2条，限定主题类别并记录题名、摘要、日期、URL；没有来源则跳过发布。
2. 大模型生成长文，模型不得修改来源元数据；至多重试一次结构检查。
3. 服务端重新验证字段长度、20+要素、引用索引、组件类型、中文正文长度、图片/数据限制、发布日期与签名。
4. 自动检查不等同于事实校验。未引入人工或第二独立证据核查前，生产质量标准需要谨慎评估；敏感内容拒绝发布。

## 验收矩阵
- 正向：合规样刊签名发布 201；再次提交 200；页面 /learn 和 /blog/[slug] 可读；3类交互可用。
- 负向：无密钥、错误签名、过期签名、跨日期、无依据引用、伪造域名、短文、重复来源、错误节点都不得发布。
- 并发：同日两次请求最多创建一条 learn_editions 和对应公开文章；数据库异常应回滚。
- 日期唯一冲突必须使包含 posts 插入的整个 SQL 语句回滚，不能在 learn_editions 冲突时跳过插入而留下孤立公开文章。
- 回归：普通 HTML/Markdown 文章、现有社区评论、站点地图与管理后台不受影响。
- 精读文章被人工修改正文后，显示修改后的 HTML/Markdown 正文；无有效结构化记录或迁移未应用时保留原文章内容。
- 发布前执行测试并进行移动端可访问性检查；缺失任一关键验收，禁止打开 Cron。

## 合并前本地验证（2026-10-08）
- Windows 独立 worktree：85 个 Vitest 用例、类型检查、ESLint 与差异检查通过。
- `npm run build` 完整通过，生成 95 个静态页面；保留现有 metadataBase 与 Edge runtime 提示。
- 回归覆盖完整文档、签名与时间窗、流式请求大小、日期与来源、私有发布结果处理、缺表及旧文章/人工编辑正文回退。
- 数据库交互测试使用 mock；未在真实 PostgreSQL 执行迁移、并发与回滚测试，未调用真实模型或公开发布文章。生产启用前仍需完成上述验收矩阵。

## 外部内容生产与 Web 端解耦（2026-10-09）
- GitHub Actions 在独立 runner 中调用 OpenAI **Responses API**。`OPENAI_API_KEY` 只放 GitHub Actions Secrets，不放 Vercel；这属于计费的独立 API 调用，并非当前 ChatGPT 对话或 ChatGPT 定时任务自动执行。
- Vercel 不应保留 `XIAOMI_API_KEY`、`MIMO_MODEL`、`XIAOMI_BASE_URL`、`GEMINI_API_KEY` 或模型写作入口。发布接口仅验证签名与结构并入库。
- `LEARN_PUBLISH_SECRET` 仍由 Vercel 与 GitHub Actions 同时持有，它用于外部文章入库鉴权，不是模型凭据。
- 更新生产环境密钥前先部署删除模型路由的代码，确认人工评论审核、编辑器及文章页面正常。随后清理 Vercel 中不用的 AI Key；不要在密钥仍被旧生产代码使用时直接撤销。
- 如果 GitHub Actions 未配置 OpenAI API Key，定时任务**明确失败且不发布**。不能把 ChatGPT 订阅或日常任务当成 API 授权。
- 本次不重写已部署在 Supabase 的 OnlyUs 每日问题 Edge Function；其独立凭据、运行环境和部署单独治理。

## ChatGPT 每日自动写入路径
- 目前 Web 接口 `POST /api/internal/learn/publish` 需要 `LEARN_PUBLISH_SECRET` HMAC 且未配备可从定时任务调用的受权 HTTP POST 通道。因此 ChatGPT 定时任务暂使用已经授权的 Neon 连接，直接在 `neondb` 的 `posts` 和 `learn_editions` 中**单语句事务式插入**，不走无鉴权 API；不要谎称调用过 HTTP 发布接口。
- 目标：`crimson-cloud-17403928` / 默认分支 `br-old-truth-a1bnmt7i` / `neondb`；只写当日 `daily-learn-YYYY-MM-DD`，不得 UPDATE 或 DELETE 旧文章。内容必须吻合 `lib/learn/document.ts` schema，`posts.content` 由 `lib/learn/publish.ts` 的 `textVersion` 规则派生，否则页面会回退为普通文字。
- 必须先查当天是否已存在；生成后严格校验结构、引用、来源、日期、篇幅；插入后再读取 `posts`+`learn_editions` 双表确认。工具无法写入或需要审批时标记失败，不能伪造发布 URL。
- 由于数据库直写不主动调用 Next `revalidatePath`，`/learn` 和文章详情在 ISR 失效窗口之后才可见，最多可能延迟一分钟左右。强一致立即刷新如有需要应回归服务器鉴权发布 API。
- 说明：在 ChatGPT 任务编辑页可查看和暂停自动化，但实际能否无人值守取决于届时连接的 Neon 工具及授权审批要求；首次生产写入后必须验收运行记录。
