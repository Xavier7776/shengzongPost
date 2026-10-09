# shengzongPost 全量建设执行总计划（Codex 分阶段实施版）

> **当前执行授权（2026-10-09）**：用户直接要求“你持续执行,直到计划完成”，覆盖本文原有“每阶段停下/不连续执行/另问合并”的模板约束。持续按依赖实施，完成已验证 PR 的合并与只读生产验收。生产 DDL/DML、密钥、调度和 Alias 变更仍须各自单独明确批准；未实测门槛不能勾选。下方基线和旧日志保留为历史证据，以最新登记为准。

> **版本**：v1.0　｜　**基线核对日期**：2026-10-09（北京时间）　｜　**项目**：[`Xavier7776/shengzongPost`](https://github.com/Xavier7776/shengzongPost)
> **执行方式**：一阶段一分支、一目标一 PR、测试通过再合并、上线后复核；每阶段完成后更新本文件的状态。
> **用途**：将本文件交给 Codex，并指定要执行的阶段编号。**不要让 Codex 一次性执行整份计划。**
> **建议在仓库中保存为**：`docs/SHENGZONGPOST_EXECUTION_PLAN.md`（复制该文件进入仓库即可；不需要新建业务数据库表）。

---

## 00. 先读这一页：执行规则与最短路径

### 现在应该做什么

1. **先执行 M00：收尾搜索 V2 的 PR #13。** 核对最新提交、搜索 URL 历史语义、Preview 真机/浏览器与 CI，然后准备合并；不要重复实现搜索 V2。
2. **再执行 M01：补齐 CI/测试触发与构建门槛。** 当前 GitHub 工作流的 `pull_request.paths` 未覆盖 `lib/**`、`components/**`、`package*.json` 等关键路径；纯底层代码变更有漏测风险。
3. **然后优先执行 M02 → M03 → M04：每日专刊发布可靠性、可追溯性与缓存一致性。** 这是当前最重要的工程质量主线。
4. **后续按 M05 → M12 执行。** 学习进度、SEO、性能、代码治理、框架升级都不应该抢在发布链路稳定性之前。

### 必须遵守的边界

- **不在网站运行时增加 LLM/AI 自动生成接口。** 文章内容的生成由现有 ChatGPT 每日任务完成；网站负责**校验、持久化、展示、监控**。不要重新引入 MiMo/Gemini/OpenAI 等模型 API 费用。
- **不改动现有每天 08:30（Asia/Shanghai）的精读任务调度，也不同时启用第二个自动发布 cron。** GitHub 的 `.github/workflows/daily-learn.yml` 当前为 `workflow_dispatch` 手动兜底；该备用流程包含外部 API 配置，但不是日常生产主通道。
- **不把“ChatGPT 已输出成功消息”当成发布成功。** 必须分别验证 Neon 写入、文章与 Edition 一致性、公开页面可达以及缓存最终可见。
- **生产数据库新迁移、生产数据删除/批量修改、密钥变更、历史内容大规模改写：每次都必须单独获得明确批准。** 先在 Neon 临时分支验证 SQL，提交方案与回滚说明。
- 不用旧版 GitHub 代码生成未经检查的 Secret；不将明文 Key、连接串、邮箱/IP、生产登录信息放入 Git、日志、PR 评论或测试快照。
- 默认**一个 PR 只完成一个阶段**，超出本阶段的发现单独登记；禁止顺手大范围重构、升级依赖或修改生产环境。
- 每次开始时先重新获取 **最新 `main` + 未合并 PR + Actions + Vercel + 必要的 Neon 只读信息**；本文件内的 SHA 只是 2026-10-09 快照，不能代替实时检查。

### 每次交给 Codex 的通用入口指令

```text
仓库：Xavier7776/shengzongPost。
请先读取 docs/SHENGZONGPOST_EXECUTION_PLAN.md（如还未放入仓库，则先读取我给你的同名 MD 文件）。
此次只执行阶段 MXX，严格按“前置条件—实施清单—测试—验收—回滚”进行。
先拉取最新 main，核对开放 PR，检查任务是否已经实现，避免重复改造。
从最新 main 创建独立 codex/* 分支；先补可重复执行的失败用例/边界测试，再修改源码。
不要执行本阶段以外的功能、不要修改生产数据库或密钥、不要触发未经批准的生产数据更改。
完成 npm ci、npm run typecheck、npm run lint、npm test、npm run build、git diff --check。
创建 PR，附变更文件、前后差异、测试数量、关键截图/真实接口回放、性能证据及回滚方案。
CI 与 Vercel Preview 都通过后才标记 ready；无法实测的门槛明确标记待验收，不得虚报。
只有我明确确认合并后才合并；不要连续自动执行后续阶段。
```

### 基线事实（截止 2026-10-09）

| 事项 | 当前快照 | 处理原则 |
|---|---|---|
| `main` | `ed7821e9e2965b0250e0ac4907c370fc08edacd2` | 实施前重新核对 |
| Vercel Production | 对应 `ed7821e9e296` 的部署 **READY** | READY ≠ 浏览器 E2E 完整通过 |
| 已合并 PR | #5–#12：宽屏阅读、管理员鉴权、账号限流、HTML 安全、学习中心、发布只读看板、下载代理、博客全库标签与热门 | 不要重复 PR |
| 搜索 V2 | **[PR #13](https://github.com/Xavier7776/shengzongPost/pull/13)**：Draft、未合并；head `ac148b18ea74a3c343d544451c0c411de3fc4a80` | **M00 首先收尾** |
| PR #13 已知检查 | GitHub Actions 成功；Vercel Preview `dpl_CGvWcEhkhV2WuAb7ZAMYBqYw66pb` READY；Codex 报告 185 项测试、PGlite SQL 测试及本地桌面/手机回放通过 | Preview 受 Vercel Authentication 限制，在线浏览器操作仍待独立复核 |
| Neon | `crimson-cloud-17403928` / 主分支 `br-old-truth-a1bnmt7i` / `neondb`；055 账号限流迁移已应用验证 | **不要重复执行 055** |
| 文章/专刊 | 最近一次核对：115 篇文章、104 篇已公开，1 期 `learn_editions`；随发布变化 | 仅作为快照，严禁写死到程序 |
| 栈 | Next.js 14.2.35 / React 18 / TypeScript / NextAuth v4 / Neon PostgreSQL / Vercel / Cloudinary / Resend | 升级放到独立阶段 |
| 每日精读 | ChatGPT 定时任务于北京时间 08:30 执行；存在 ChatGPT → Neon 直接写入路线 | **不能假设计划任务在无人值守时一定具有 Neon 写权限** |
| 持续建设 | ChatGPT 每天约 16:00 执行代码建设检查 | 避免与 Codex 同时编辑同一阶段、造成冲突 |

> **状态符号**：`[ ]` 未开始；`[x]` 已验收；`[-]` 已开始/受阻。请只在真实验收后勾选，顺手补 PR 链接与日期。

---

## 01. 项目最终目标与完成定义

### 产品定位

项目保持为**个人技术博客 + AI 工程学习中心 + 作品集**，而不是商业化 AI 在线应用。主要服务三个真实场景：

1. **访客**：准确搜索技术文章、Skills、图库；浏览高质量深度精读；快速理解作者的工程能力。
2. **学习者**：按 Agent、RAG、工程、多模态主题有序学习，浏览、练习、自测、记录进度，找到可核验的原始资料。
3. **站点维护者**：通过后台管理文章/项目，稳定发布每日专刊，及时知道失败原因，可恢复、可回滚、可审计。

### 总体完成指标（目标值，不是当前实测值）

| 维度 | 完成目标 | 测量方式 |
|---|---|---|
| 搜索正确性 | 已发布记录可搜索、真实 Facet、分页完整、草稿泄漏 **0** | 真实 SQL 回放 + API + E2E |
| 自动精读 | 已知产出日**至多 1 篇正式刊物**；发布前结构校验率 100%；成功汇报必有回读证据 | Neon 查询、任务日志、管理员看板 |
| 运行可靠性 | 重大故障能被定位；发布缺失/漂移可发现；错误不被伪装成“无结果” | Vercel Logs、Neon、告警记录 |
| 文章更新 | 发布/改稿/撤回后在定义的 SLA 内从 Blog、Learn、详情、RSS、Sitemap 一致可见 | 多入口 E2E（明确缓存 TTL） |
| 响应体验 | 手机 390px 不横向溢出；能使用导航/代码/目录；重要页面 Lighthouse 性能和无障碍达标 | 桌面 + 移动端测量 |
| 搜索延迟 | 在现有数据量下先测 P50/P95，**候选目标**暖请求 P95 < 800ms（从客户端量，不能只报 DB 耗时） | 至少 100 次、有并发场景、注明环境 |
| 品质与溯源 | 原始资料可访问、有发布时间及出处；示例数据与论文实测值可区分 | 内容抽检、来源链接校验 |
| 工程治理 | 所有受影响核心目录改动必跑 CI；合并前 Preview、上线后 smoke | Actions、Vercel 与回归报告 |
| 数据保护 | 不因迭代丢失文章、用户、学习记录；可以演练恢复 | Neon 还原分支/备份恢复演练 |

### 目标架构（保持低成本）

```mermaid
flowchart TD
  A[访客/学习者] --> B[Next.js 页面 / Search / Learn / Work]
  B --> C[受控 Route Handlers / Server Components]
  C --> D[Neon PostgreSQL: posts / skills / learn_editions]
  C --> E[Cloudinary / Resend / NextAuth]
  F[ChatGPT 08:30 专刊任务] --> G{受控发布/验证契约}
  G --> D
  D --> H[发布后回读 + 内容一致性]
  H --> I[只读管理员健康度 / 异常告警]
  J[GitHub PR/Actions] --> K[Vercel Preview]
  K --> L[生产部署 + 冒烟/回滚]
```

**特别说明**：图中的“受控发布契约”是最终目标，目前 ChatGPT 仍可能直接写 Neon；不得误认为发布 API 已被任务自动调用。

---

## 02. 优先级、阶段依赖与执行节奏

建议以**阶段及验收门槛**驱动，不以日历硬性截止。工程量是单人 + Codex 的粗估，实际以回归范围和生产问题为准。

| 顺序 | 阶段 | 建议 PR/分支 | 估算 | 依赖 | 风险 |
|---:|---|---|---:|---|---|
| 00 | 搜索 V2 验收与合并 | 既有 **PR #13** | 0.5–1 天 | 无 | 中 |
| 01 | CI 覆盖、构建和发布门禁 | `codex/ci-quality-gates-v2` | 1–2 天 | M00 | 低 |
| 02 | 每日刊物发布校验与回读 | `codex/learn-publish-integrity-v2` | 2–4 天 | M01 | 中 |
| 03 | 发布状态、异常追踪与告警 | `codex/learn-publish-ops-v2` | 2–4 天 | M02 | 中；可选迁移需批准 |
| 04 | 全站缓存与 RSS/Sitemap 同步 | `codex/content-cache-consistency-v2` | 2–4 天 | M02 | 中 |
| 05 | 技术内容质量、图表与勘误 | `codex/learn-provenance-quality-v2` | 3–6 天 | M02–M04 | 中 |
| 06 | 搜索质量基准与性能优化 | `codex/search-quality-benchmark-v2` | 2–4 天 | M00 | 低；索引需批准 |
| 07 | 学习中心 V3（学习进度、自测） | `codex/learn-progress-v3` | 4–7 天 | M02/M05 | 中；云端同步需批准 |
| 08 | 文章系列、相关推荐与导航 | `codex/content-discovery-v2` | 2–4 天 | M06/M07 | 低 |
| 09 | SEO、资源与页面性能 | `codex/seo-web-vitals-v2` | 3–6 天 | M04 | 中 |
| 10 | 安全与隐私第二轮治理 | `codex/security-hardening-v3` | 3–6 天 | M01 | 中 |
| 11 | 数据与备份、运维观察体系 | `codex/data-reliability-v2` | 2–5 天 | M02–M04 | 中；DML/DDL 需批准 |
| 12 | Next.js LTS 与依赖升级 | `codex/next-lts-upgrade` | 4–8 天 | M00–M11 稳定 | 高 |
| 13 | 可选功能、代码清理与长期维护 | 若干独立小 PR | 按需 | 以上阶段 | 按需 |

建议每次最多**一个正在实现的阶段 + 一个等待用户验收的 PR**。凡是写生产 DB、改变认证、改公共发布链路或升级 Next/React，都应有独立回滚方案与上线窗口。

---

## M00 · 搜索 V2 收尾与正式上线（优先立即执行）

**现状**：PR #13 已有完整实现、PGlite SQL 测试与 Preview；不要从头重构。
**目标**：上线全局相关性排序、跨类型 Facet 及分页，让 `/search` 与 `/blog` 行为可预测。

### Codex 执行清单

- [x] 再次检查 PR #13 是否被其他任务更新、合并；核对 head SHA、Action 结果和 Preview 的**同一提交**。
- [x] 检查 `app/search/SearchClient.tsx`：自动防抖搜索目前使用 `router.push` 更新 URL；**仅输入停顿更新采用 `router.replace`**，显式按回车提交/点击历史词、切类型/切排序/分页继续 `router.push`。这样不会把每次停顿输入变成一条浏览器历史。补前进、后退与刷新回归。
- [x] 复核 `lib/db-search.ts` 的 `UNION ALL` / materialized CTE：草稿不可检索、字段权重、特殊字符转义、稳定排序与空页 Facet；避免逻辑和 `lib/search.ts` 类型分叉。
- [x] 对 `q=Agent/RAG/Transformer/%/_/中文/不存在词`、筛选 type、排序 newest、page 1/2/最后页及无结果使用 Preview 或可信本地浏览器执行测试。
- [x] 旧 `/api/search?limit=...` 兼容；`/api/posts/public?limit=4` 不泄漏未公开数据；空搜索不触发不必要查询。
- [x] 检查页面 1440×900、1024×768、390×844，横向滚动、Tab、错误/超时/重试与搜索历史可用。
- [x] 更新 PR #13，**真实记录** CI、PGlite/Neon 只读对照、Vercel Preview、浏览器 QA；对 Vercel Authentication 限制明确备注，不能把本地浏览器当成线上已测。
- [ ] 测试全通过后标记 Ready，用户验收通过再合并；核对 Production READY 并做搜索 smoke。

### 验收硬门槛

1. 草稿搜出条数 0，Facet 与 `total` 不受 `pageSize` 影响；Agent 等跨页结果无重复或遗漏（固定数据快照）。
2. 输入过程不会在浏览器历史中产生大量中间关键词页面；浏览器后退可返回**上次有意义的查询**。
3. 从 `/blog` 点击「全站搜索」后查询内容完整；SQL 参数化没有通配符扩大与拼接注入。
4. typecheck、lint、全量单测、生产构建、Preview 均通过；Production READY，后台/公开文章访问未回归。

**回滚**：Git revert PR #13 的合并提交 + Vercel 回滚到前一稳定部署。不改数据或索引，回滚成本低。

**结果登记**：PR `#13` ｜ 合并 SHA `________` ｜ CI `________` ｜ Preview `________` ｜ Production `________` ｜ 完成日期 `________`

---

## M01 · CI、测试矩阵与合并门槛（先补底盘）

**发现的具体问题**：当前 `.github/workflows/web-runtime-ci.yml` 只在部分路径变更时触发，漏掉 `lib/**`、`components/**`、`package.json`、`package-lock.json`、`next.config.js` 等核心修改。Actions 有 `typecheck/lint/test`，但主要依赖 Vercel 执行 Next 生产构建。

### 实施清单

- [ ] 更新 GitHub Actions 触发范围，至少包含 `lib/**`、`components/**`、`app/**`、`features/**`、`shared/**`、`__tests__/**`、`scripts/**`、`package*.json`、`tsconfig*.json`、`next.config.*`、`vitest*`、`public/**`、`.github/workflows/**`；酌情使用排除 docs-only 条件优化时间，但**不能漏核心代码**。
- [ ] 强制每个 PR 同时跑：`npm ci`、`npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 与 `git diff --check`。构建所需环境变量用安全的**测试值/Mock**，不可把生产 Secret 暴露给不可信 PR。
- [ ] 版本化 Node/npm，核对与 Vercel 实际构建版本；锁文件与 package.json 不匹配时 CI 立即失败。
- [ ] 配置 PR 合并门槛：CI 成功、Preview READY、安全高风险审查、测试数量/覆盖范围说明；若权限不足以启用 GitHub Branch Protection，提交说明，不谎称已生效。
- [ ] 补 API 认证矩阵（游客、普通用户、管理员、已降权旧 JWT、API Key）和基础发布/搜索 smoke。
- [ ] 统一 `test`、`typecheck`、`lint`、`build` 输出，避免“单项通过”被误写为“全项通过”。
- [ ] 新增 `docs/operations/release-checklist.md` 与 `docs/operations/rollback.md`；每次部署保留 commit 与 deployment ID。

### 验收

- 只改 `lib/` 触发完整 CI；只改 `components/` 触发；只改 `package-lock.json` 触发。
- 所有检查对应正确的 commit SHA；故意注入类型错误，验证 CI 能**阻止合并**，然后撤回测试错误。
- `npm run build` 通过，现有 `/blog`、`/learn`、`/search`、`/admin` 正常工作。

**回滚**：仅恢复原工作流、分支保护配置；业务数据不变。

**结果登记**：PR `________` ｜ 完成日期 `________`

---
## M02 · 每日专刊发布契约与写入回读（最高业务优先级）

**代码基线**：`lib/learn/document.ts` 定义 Edition v1（2–5 条来源、15–50 个内容块及必要练习/引用）；`lib/learn/publish.ts` 已有原子 INSERT、Slug 幂等和 `revalidatePath`；`app/api/internal/learn/publish/route.ts` 有 HMAC 校验。但当前 ChatGPT 自动任务曾使用 Neon 直接写入，**并不天然执行服务器里的 `validateEdition()`、重复冲突检查或缓存刷新**。

### 设计原则：保留能用的 08:30 发布通道，逐步收紧

1. **定义一个纯函数契约**：`validateEdition → normalize/canonicalize → fingerprint → render textVersion → publish → readback → public visibility`。Schema v1 必须保持向后兼容；新增字段须版本化。
2. **统一幂等性判断**：相同日期、相同内容重跑 → 返回 already-published；相同日期、**不同内容**重跑 → 必须显式 conflict，而不是仅因为存在 Slug 就报告成功。
3. **统一写入前质量门槛**：Schema 合法、2–5 个可信来源、来源日期合法、段落引用存在、内容块数量和实作练习达到要求；**结构合格 ≠ 实验事实正确**。
4. **统一写入后核验**：核查 `posts` 与 `learn_editions` 的一对一关系、`published=true`、Slug、日期、主题、JSON 版本、`posts.content === textVersion(document)` 及引用来源与 JSON 完整性。发现不一致 → 报告失败，禁止虚报。
5. **公网可见性**：区别数据库已经成功与 Vercel ISR 缓存尚未刷新；在规定重试窗口做只读 GET，区分 `db_ready` 和 `public_ready`，绝不二次盲写。
6. 发布资格和后台管理继续需要受控权限；不得将数据库管理员凭据放入客户端或将 HMAC Secret 显示在浏览器。

### PR 设计（建议拆成 M02-A 和 M02-B）

**M02-A：不需要迁移的服务端修复**

- [ ] 提炼 `lib/learn/publish.ts` 可重用的内容指纹函数（例如 SHA-256，统一 UTF-8 和 canonical serialization）；确保判重基于完整内容而不仅是日期。
- [ ] 验证相同日期重试的语义：原文一致 → no-op；不同 Edition/标题/正文 → `409 conflict`；部分写入/孤儿关联 → 记录异常并停止。
- [ ] 对 API 成功响应区分 `created`、`alreadyExists`、`verified`，`verified=true` 必须由真实回读支持。
- [ ] 补回归：并发两次发布，同内容重试，冲突内容重试，数据库失败，写入成功但回读失败，JSON/正文漂移，来源超时，服务端缓存失效异常。
- [ ] 保证阅读器对旧 Edition v1 的渲染无损；不可通过“重新生成正文”批量改写已发布文章。

**M02-B：核对 ChatGPT 调度路线**

- [ ] 检查现有 08:30 定时任务最近三次运行记录，区分执行、写库、回读、公网页面状态。调度工具是否能够**无人值守使用 Neon Connector 写权限**必须通过实际一次日程运行确认，不能由手动运行推断。
- [ ] **策略 A（当前优先）**：如果任务稳定支持受限 Neon 写入，则把前校验/冲突拒绝/回读 SQL 作为强制发布协议；发布端的纯验证规则须与 `validateEdition v1` 有一致性测试，避免人工拼 SQL 漏字段。
- [ ] **策略 B（条件可用）**：若 HMAC 发布 API 能在任务环境真实访问、且站点 `LEARN_PUBLISH_SECRET` 已安全配置并可签名，则可切换为受控 HTTP API。先对 Preview 做签名/时戳/401/409/422/重复请求测试，再进行**受监督的生产切换**。不能提前停用策略 A，避免断更。
- [ ] 不恢复 GitHub Actions 定时的第二套日更工作流；如未来取消含外部付费 API 的手动备用脚本，须先确认替代恢复路线可用。
- [ ] 发布完成后检查 `/blog/daily-learn-YYYY-MM-DD`、`/learn`、`/admin/learn`；超时仅说明“公开页面延迟”，绝不重复创建专刊。

### 验收场景（至少 10 项）

| 场景 | 期望结果 |
|---|---|
| 第一次有效发布 | 插入 1 篇 `posts` 和 1 条 `learn_editions`，结构与正文一致 |
| 同一内容重复执行 | **0** 新记录，结果说明 already-published |
| 同日期不同内容 | 显式冲突，不覆盖现有专刊 |
| 只有 Post、没有 Edition | 判定异常，不谎报成功 |
| Edition JSON 无效 | 发布前拒绝，不写业务表 |
| 引用不存在/无可信来源 | 拒绝发布并给出字段级原因 |
| 写入完成但外部不可见 | `db_ready` 且 `public_pending`，进行有界重试 |
| 数据库失败 | 失败状态明确，不返回 201/200 成功 |
| 并发触发两次 | 最终只有一个正式刊物，无两次归档 |
| 旧结构化文章 | Edition v1 仍可稳定渲染、来源可见 |

**上线依赖**：若改为新的发布 API，需要先验证密钥与环境兼容，密钥变更需用户批准；若只是服务端幂等逻辑，不需要生产迁移。
**回滚**：恢复旧发布服务/旧任务提示词；不回滚已成功写入的历史刊物，先只读核验后决策。严禁 `DELETE` 重试恢复。

**结果登记**：PR `________` ｜ 08:30 无人值守测试 `________` ｜ 写入/回读检查 `________` ｜ 完成日期 `________`

---

## M03 · 出版状态追踪、告警与失败恢复（生产可观察）

**现状**：`/admin/learn` 已经能**只读**检查最近 60 期的 Edition Schema、公开标记和正文一致性；它不包含任务启动、候选稿生成失败、调度器未运行的历史，也不能保证“今天没文章”一定是故障。

### M03-A：不迁移、先完成状态看板与巡检

- [ ] 增加最近 7/30 天的实际出版日历，以北京时间解释日期，区分“未到调度窗口 / 尚未见刊 / 已存在且合规 / 不合规 / 公网待刷新”。
- [ ] 只把**设定了应发布期望**的日期纳入缺刊告警；例如当天 08:30 之后给予合理宽限到 09:30，不因时区或计划停刊误报警。
- [ ] 看板统计最近一次实际成功日期、连续出版天数、异常刊物列表、结构检查耗时、最近一次已知数据库观察时间。
- [ ] 为数据库检查、结构验证和公网 GET 分别返回状态；无法取得任务历史时标为 `unknown`，不能说“任务运行失败”。
- [ ] 对异常发通知前先做去重与冷却期，避免一天几十封重复邮件；机密日志不得入邮件。
- [ ] 保留管理员权限检查先于任何私有记录读取；看板为只读，故障巡检本身不写文章。

### M03-B：可选持久化审计（**需要新的 DDL 授权**）

只有 M03-A 无法满足调查要求时才提出新迁移，比如 `056_learn_publish_runs.sql`；**不要擅自执行**。

建议最小字段：

```text
attempt_id UUID
edition_date DATE
source ('chatgpt_task' | 'signed_api' | 'manual')
status ('started' | 'validated' | 'db_written' | 'db_verified' |
        'public_verified' | 'conflict' | 'failed' | 'unknown')
post_slug TEXT NULL
content_sha256 CHAR(64) NULL
schema_version INTEGER NULL
source_count INTEGER NULL
started_at / finished_at TIMESTAMPTZ
error_category TEXT NULL
error_detail_sanitized TEXT NULL
```

- [ ] 在 Neon 临时分支执行 DDL，验证唯一约束、索引、操作回滚，不包含任何已有文章删除或覆盖。
- [ ] 提交给用户单独批准生产迁移，批准后**先 DDL、后代码部署**。
- [ ] 审计写入要能区分未开始和没有发回状态，且幂等；日志对失败消息做脱敏，不存模型密钥或原文敏感内容。
- [ ] 监控任务产生状态需要确定**任务进程能调用的真实通道**，不能创建仅在服务器端可用、计划任务却连不上的“伪审计”。

### 验收

- 最近 7 天显示数据准确，任务未知时绝不标为成功。
- 人为构造一个过期/缺失的**测试日期**，告警只触发一次；异常恢复后状态自动清除。
- 无用户批准时不在生产创建审计表；若不需要 M03-B，也可只交付 M03-A。

**回滚**：关闭告警配置/看板新功能；对审计表遵循非破坏性保留策略，不自动 DROP 表。

**结果登记**：PR `________` ｜ 迁移授权（如有）`________` ｜ 完成日期 `________`

---

## M04 · 文章发布、页面、RSS 与 Sitemap 缓存一致性

**具体问题**：`app/blog/[slug]/page.tsx` 存在 `revalidate = 60`；`app/feed.xml/route.ts` 存在 `revalidate = 3600`；`app/api/posts/route.ts` 与 `app/api/posts/[slug]/route.ts` 多处只调用 `revalidateTag('posts') / revalidateTag('post-...')`，但现有普通 Neon SQL 读取没有完整的对应 Tagged Cache 契约；批量操作则调用了 `revalidatePath`。**使用 Neon 直接写库无法自动触发站点进程缓存失效。**

### 实施清单

- [ ] 编写 `docs/architecture/cache-contract.md`：列出 `/blog`、`/blog/[slug]`、`/learn`、`/feed.xml`、`/sitemap.xml`、`/search`、管理员页面的真实缓存层、失效方式及最长可见延迟。不要把 ISR 与应用内 `fetch` 缓存混淆。
- [ ] 给文章后台 `create/update/unpublish/delete/batch` 建立**统一的 `invalidatePublishedContent` 服务函数**；按旧 Slug/新 Slug、发布状态、目录、首页、博客分类、精读列表、RSS 与 Sitemap 正确失效。
- [ ] 判断 `revalidateTag` 是否有真正的标签依赖；若没有，优先采用 Next 14 兼容的 `revalidatePath`/明确 TTL，移除无效调用及误导注释；只有确实配置了被标记的缓存后才继续使用 tag。
- [ ] `getPostBySlug`、`getAllPosts`、公开列表必须统一 `published = true`；撤回/删除后 RSS、sitemap 与相邻上一篇/下一篇导航不得残留。
- [ ] 技术精读直接 Neon 写入的场景：定义**最终一致性 SLA**（如详情/列表 ≤ 2 分钟，RSS ≤ 5 分钟作为候选目标）；依赖 ISR TTL 时明确说明不能承诺“立刻刷新”。
- [ ] RSS 需要检查 `pubDate/lastBuildDate` 和只展示公开文章；缩短 3600 秒 TTL 是否划算，以实际订阅和 Neon 成本评估。
- [ ] Sitemap 不应把查询参数 URL 如 `/skills?view=trending` 视为独立内容页面；要结合 canonical/robots 规则审查，别让搜索筛选 URL 制造重复收录。
- [ ] SEO 中 `lastModified` 应来自真实内容更新时间，不要每次生成都把所有静态页面伪装成“刚更新”。

### 集成测试矩阵

| 操作 | Blog 列表 | 文章详情 | Learn | RSS | Sitemap | 搜索 |
|---|---|---|---|---|---|---|
| 创建并公开 | 可见 | 200 | 专刊时可见 | 纳入 | 纳入 | 可搜索 |
| 修改标题/Slug | 新题/新址 | 旧 URL 处理明确 | 更新 | 更新 | 更新 | 更新 |
| 撤回为草稿 | 消失 | 不公开/404 | 消失 | 移除 | 移除 | 移除 |
| 删除 | 消失 | 404 | 无孤儿 | 移除 | 移除 | 移除 |
| 外部直接写 Neon | TTL 到期可见 | 同上 | 同上 | 在约定 SLA 内 | 在约定 SLA 内 | 动态查询可见 |

### 验收

- 使用隔离测试文章或临时数据库分支验证状态流转（不得用生产真实文章做破坏性测试）。
- 在规定 TTL/SLA 内所有公开入口一致，无“列表删了、RSS 仍在/详情仍可开”的回归。
- 新缓存方案不能引入每请求大量重复查询；记录页面 TTFB 变化。

**回滚**：撤销统一缓存服务的代码变更，恢复已知工作 TTL，保留业务数据。

**结果登记**：PR `________` ｜ 缓存矩阵记录 `________` ｜ 完成日期 `________`

---

## M05 · 技术精读可信来源、图表与内容勘误体系

**原则**：构建有证据的高质量技术专栏，**不追求每天堆字数**。现有 Edition v1 要求近期 arXiv/GitHub Release 来源，图表中的 `illustrative: true` 表示示意，不应被当作论文实测。

### M05-A：内容证据与质量门槛

- [ ] 从真实来源提取：标题、唯一 URL、发表/更新日期、作者/组织、研究问题、方法、实验数据、局限；不能把摘要中的宣称改写为“本地已复现”。
- [ ] 每个关键结论均对应 `sourceId` 和来源的具体章节/表格/实验条件；术语、定量数值和示例数据要清晰区分。
- [ ] 独立“证据声明”类型：**论文作者报告 / 官方发布说明 / 个人教学示意 / 本站复现实测**，不允许混用。
- [ ] 检查来源 URL 可访问性、出版日期与论文版本；访问失败时标记“待复核”，不能凭模型记忆填具体值。
- [ ] 一期正文结构建议：问题 → 场景 → 方法对比 → 架构图 → 实验与证据 → 失败边界 → 复现练习 → 自测 → 原始资料 → 延伸阅读。
- [ ] 公开文章增加“发现错误/提交勘误”入口。内容修订可更新文章，但要**留有版本或更正说明**；对于已存在 Edition JSON，不能只改 `posts.content` 而造成结构化正文漂移。

### M05-B：Edition Schema v2（谨慎版本化）

- [ ] 若需要支持**真实数据图表**，扩展 `chart` 为 `dataOrigin: 'illustrative'|'paper'|'reproduced'`、坐标定义、指标单位、数据点来源与实验条件。允许真实定量图必须附 evidence；示意图不得标为 benchmark。
- [ ] 添加显式 `claimSourceRefs` / `evidenceLocation`（论文节/图表编号、Commit/Release 版本），原始链接只能使用安全来源白名单；任意外部 URL 不能直接变为可信凭据。
- [ ] 增加 `version:2` 渲染分支，而不是直接修改并使旧 `version:1` 失效；兼容已有 `/blog/daily-learn-*` 及 `/admin/learn`。
- [ ] 为原始结果表与复现结果表分别明确样本数、指标方向、比较基线、置信区间（如有）、是否带随机种子。
- [ ] 用历史文章跑回归：标题/引用/练习/测验/代码不丢失，SEO/OG 正常。

### 验收

- 随机抽检至少 10 条关键表述，全部有可信来源，抽检结果留在 PR 描述；出现无法核验的数据则主动改为“示例”或删去。
- 至少 2 种图表（示意 vs 论文来源）UI 标注清晰，且不能仅凭 `illustrative:false` 放行。
- Edition v1 老文章 100% 通过加载与可视化回归；修改正式数据时留有明确变更记录。

**回滚**：站点可禁用 v2 新渲染而继续服务 v1；不得自动把历史内容降级或覆写。

**结果登记**：PR `________` ｜ 来源抽检 `________` ｜ 完成日期 `________`

---
## M06 · 搜索质量评测、性能和成本治理

**现状**：搜索 V2 PR #13 已在开发分支实现 PostgreSQL `UNION ALL` / 统一相关性评分 / Facet / OFFSET 分页。Codex 报告单次数据库执行约 9–16ms、网络往返约 84–304ms；**这些是开发期个别观测，不是 P95，也未证明高并发能力**。

### 实施清单

- [ ] 建立 `__tests__/fixtures/search-relevance-queries.json`（或同等测试集），不少于 30 条真实中文/英文、缩写、全文仅命中、标签仅命中、长词、零结果、特殊字符输入。每条指定“预期命中类型及前 3 候选”的人工标准。
- [ ] 指标包括 Recall@20（已知相关文档）、MRR@10、nDCG@10（有等级标注才用）、零结果率、Facet 准确率、异常率与客户端 P50/P95/P99；不要只用文章标题匹配数量代替检索质量。
- [ ] 记录数据快照时间、文章总量、Skills 数、Gallery 数；比较新旧算法时使用同一快照。
- [ ] 在 Neon **只读查询**下运行 `EXPLAIN (ANALYZE, BUFFERS)`，检查顺序扫描、内容字段重复读取、长 JSON 转换、无必要的三表全扫。
- [ ] 同时测冷启动、暖连接、2/5/10 并发场景。API 超时和 500 不得渲染为 0 结果；记录真实网络 RTT，避免只引用数据库执行时间。
- [ ] 审查短词 `%/_`、1 字 CJK 的命中结果过多、全文字段含 HTML/Markdown 标记导致噪声问题；可在规则层增加最低查询价值、标题权重或召回摘要提取，但必须用查询集证明收益。
- [ ] **性能未成为瓶颈则不要盲目加索引**。若确需 `pg_trgm`/表达式索引/全文索引，先给出两套替代方案、成本与磁盘/写入开销，Neon 临时分支做 A/B 并**单独申请生产迁移授权**。
- [ ] 对 OFFSET 在并发发布场景的漂移给予已知限制提示；增长到大量结果后再评估 keyset/cursor，不在当前小数据量强行引入复杂机制。

### 验收

- 测试集覆盖四种内容来源与中英文；相同快照排序可复现。
- 新实现的相关性指标不得低于搜索 V2 基线（若有实测退步必须解释并调整）；至少提交 30 条查询的对照表。
- 在真实预览环境报告至少 100 次请求的 P50/P95、失败率、数据量；默认候选目标 P95 < 800ms，实际门槛以评测结果与用户体验确认。
- 无新增生产迁移时只读运行，不触发线上流量异常。

**回滚**：回退排序/查询层到上一个稳定策略；独立可选索引不得未经批准 DROP。

**结果登记**：PR `________` ｜ 评测文件 `________` ｜ P95 `________` ｜ 完成日期 `________`

---

## M07 · 技术学习中心 V3：从“看过”到“学会”

**现状**：`/learn` 已支持 Agent/RAG/工程/多模态分类、最新一期、归档和本地浏览记录；文章页有章节目录、自测与练习。**当前“浏览过”不是学习完成**，不能用打开一次页面替代学习结果。

### 先做纯前端、本地保存的 M07-A（不需要数据库迁移）

- [ ] 定义四种可区分的状态：`not_started`、`in_progress`、`practice_done`、`completed`。以**实际动作**（明确点击完成、自测满足标准）推进，不以一次打开页面自动完成。
- [ ] 页面标注「已浏览」与「已完成」区别。完成标准建议：至少完成本期自测，并主动确认动手实践；是否强制做完每道题可配置。
- [ ] 保存每期阅读位置、上次章节、自测作答摘要、完成时间；存储于 localStorage 时包含 Schema 版本、异常 JSON 容错、容量上限及重置按钮。
- [ ] 在 `/learn` 增加“继续学习”“已完成数量”“待练习”筛选；对当前页面的已完成项建立明显但不过度打扰的视觉标识。
- [ ] 考虑多个窗口、刷新和无痕模式：无法访问存储时降级为可读，不弹出系统错误。
- [ ] **不收集或上传敏感学习行为**，除非用户明确选择账号同步。

### 再考虑 M07-B：账号同步（可选，单独权限与迁移）

- [ ] 先设计独立的 `learning_progress` 用户记录（用户 ID + 文章 ID + 版本/完成状态/更新时间）与访问规则；不允许根据客户端提交任意 user_id 覆盖他人记录。
- [ ] 采用乐观并发/幂等更新；明确跨设备冲突时按哪条规则合并。
- [ ] 如需建表，按 Neon 临时分支测试 → 用户批准生产迁移 → 先库后代码部署的顺序实施。
- [ ] 跨账号退出/登录不能把 A 用户本地学习记录错误同步给 B 用户；提供隐私说明和清除机制。

### 验收

- 阅读位置保存、返回继续、答题后完成、手动取消完成、刷新、跨标签页等场景均有测试。
- 不登录也可读文章，数据库宕机不阻断已加载的本地学习记录。
- “已浏览/已学习/已通过自测/已完成”含义清楚、不混淆。

**回滚**：关闭新学习进度 UI，保留原有 `ReadingHistory`；本地状态可安全忽略、不得清空用户旧阅读历史。

**结果登记**：PR `________` ｜ 完成日期 `________`

---

## M08 · 技术系列、相关推荐与作品集联动

这一阶段不新增 AI 运行时。站点已经拥有较多历史技术文章和 `/work` 项目页面，重点是“读完之后去哪”和“从项目反向找到相关技术”。

### 实施清单

- [ ] 给文章建立**可管理的系列/主题关系**（例如 Agent 架构、Agentic RAG、长期记忆、检索评测、多模态工程、系统开发实践）；先从标签和手工策展开始，不必创建向量库。
- [ ] 每篇文章底部加入相关内容建议：同系列优先 → 同标签 → 相近主题 → 最近更新；推荐原因可解释，不推荐草稿。
- [ ] 同一文章不能推荐自己；列表不产生循环导航、重复 Slug 或未公开路径。
- [ ] `/learn` 可提供明确的学习路线：基础知识 → 架构理解 → 代码实践 → 实验评估；不能暗示某文章是官方必修课程。
- [ ] `/work/Mnemo` 等项目页增加“技术决策/架构设计/Benchmarks/工程迭代”的**相关博客入口**，将作品集与技术深度互相连通。
- [ ] 增加“上一篇/下一篇”语义：按发布时间而非仅靠 ID 的先后，避免旧文章补录造成顺序错乱。若实现变更，请兼容已有博客。
- [ ] 站内推荐只依据公开元数据；不要读取他人的个人历史来生成推荐。

### 验收

- 相关内容至少 3–5 条且无自己/草稿/重复 Slug；空系列安全降级。
- 手机端卡片可读；有键盘焦点与无障碍描述。
- 项目页可从入口导航至技术文章，返回仍保留当前位置。

**回滚**：隐藏推荐模块并保留原导航，不修改旧文章正文。

**结果登记**：PR `________` ｜ 完成日期 `________`

---

## M09 · SEO、Web Vitals、资源优化与无障碍

### SEO 正确性

- [ ] 给 `/blog/[slug]`、`/learn`、`/work/[slug]` 提供准确 canonical、OG/Twitter 摘要、发布日期/更新时间、Article JSON-LD/Breadcrumb 等；禁止将测试/后台/搜索参数页作为独立索引目标。
- [ ] Sitemap 只包含真实公开页面；取消不应入索引的带查询参数项。RSS 只包含已发布文章，GUID 稳定，`pubDate` 真实。
- [ ] 文章内自动生成的标题 ID 保持稳定，目录锚点在刷新和多个版本之间可定位；避免 React hydration 错误。
- [ ] 首页与技术精读首页要描述清楚内容定位，并对原创技术文章设定合理摘要与内部链接。
- [ ] 验证 Google Search Console、Bing Webmaster 和结构化数据检查工具：先记录现状再优化。**没有已连接的站长账号时不得宣称提交成功。**

### 性能与前端

- [ ] 在 390px 手机、1024px 笔记本和 1440px 桌面分别建立 Lighthouse 基线，记录 LCP/CLS/INP/TTFB、JS 体积、图片传输体积。
- [ ] 减少非首屏交互组件的初始 JS；搜索、3D/WebGL、图表、评论及大型富文本编辑器按需加载，避免阅读页加载后台编辑器依赖。
- [ ] 使用符合实际的图片宽高与 loader，优化 Cloudinary 格式和懒加载；不破坏旧图片源、点击放大和附件链接。
- [ ] Markdown 长代码、架构图、表格横向滚动只在自身容器内，整页移动端不得横溢。
- [ ] 检查触控区域、Tab 焦点顺序、ARIA 对话框、Esc 关闭、动态内容播报、对比度和 `prefers-reduced-motion`。

### 候选门槛（以同一测量条件比较）

- 核心阅读页 Core Web Vitals：LCP p75 < 2.5s，CLS p75 < 0.1，INP p75 < 200ms 为目标；在没有足够实用户样本时报告实验室结果，不能冒充真实用户 P75。
- Lighthouse（移动端）性能、SEO、Accessibility 的候选目标 ≥ 90；具体评测应记录设备条件、网络、工具版本与 URL。
- 每一次优化 PR 至少提供“基线 vs 改造后”的相同场景对照。

**回滚**：保留上一版图片配置与组件懒加载策略；恢复前确保访问路径和缓存可用。

**结果登记**：PR `________` ｜ Lighthouse 对比 `________` ｜ 完成日期 `________`

---

## M10 · 安全/隐私第二轮治理与威胁模型

**已有防护**：PR #6 的管理员实时角色校验、#7 的 Neon 限流与账号绑定验证码、#8 的 HTML 白名单、#11 的 Cloudinary 代理来源限制。此阶段应针对剩余威胁建模，不重复上述工作。

### 实施清单

- [ ] 建立权限矩阵：游客、普通登录用户、文章作者、管理员、服务端 API Key；逐个检查所有写入接口（上传、Gallery、项目、投稿审核、批量操作、用户资料、积分、评论等）。API 端必须校验，不能只隐藏按钮。
- [ ] 查 `app/api/**` 的请求体大小限制、错误响应、限流/防刷、数据库对象归属与审计日志。特别检查文章/图片上传与外部 URL 获取，杜绝开放代理和 SSRF。
- [ ] 认证端评估：NextAuth v4 会话/JWT 与 DB 即时角色、OAuth 管理员约束、验证码存储与过期清除、成功改密后旧会话处理、并发请求竞态。
- [ ] 复核现有 CSP 包含 `script-src 'unsafe-inline' 'unsafe-eval'`、`img-src https: http:` 等宽策略；**先采用 Report-Only 观测，再逐步收紧**。不要直接去掉脚本许可导致 Next.js Hydration 故障。
- [ ] 检查外链 `target=_blank` 是否带 `rel`；用户输入 URL 安全 scheme；头像、外部图片、Cloudinary、RSS 等输出编码。
- [ ] 保持用户密码/验证 Code/Secret 不打印日志；错误日志可以关联随机 request ID，但不要包含会话 Cookie 或邮箱全文。
- [ ] Neon/Vercel/GitHub 权限最小化，检查是否存在未使用环境变量与遗留外部 AI API Key；清理密钥时必须走独立审批和轮换流程。
- [ ] 为访问控制、HTML 攻击向量、CSRF/权限提升、限流并发/重放、假 Cloudinary 域名编写自动回归。

### 验收

- 至少形成接口权限表及风险处置列表，所有高风险写入口有拒绝路径测试。
- CSP/上传等安全修改需 Preview 浏览器验证；不允许把“静态检查通过”当成 XSS/CSRF 渗透测试通过。
- 不造成正常管理员和已验证用户无法登录、无法投稿或无法下载附件。

**回滚**：独立撤销危险拦截规则，保留审计记录；生产密钥不自动恢复旧值，须安全轮换。

**结果登记**：PR `________` ｜ 安全检查报告 `________` ｜ 完成日期 `________`

---

## M11 · Neon 数据治理、备份和恢复演练

### 核心目标

避免“代码发布成功了，但数据误操作后无从恢复”。Neon 分支是测试/恢复能力之一，但**不能替代经过验证的独立备份策略**；是否具有 PITR、保留期和恢复点须以当前项目实际计划为准。

### 实施清单

- [ ] 清点关键数据域：`posts`、`learn_editions`、`users`、`comments`、`skills`、`gallery_images`、`auth_rate_limits`、`projects`、学习记录（如有）。记录主外键、唯一性、索引和典型增长率。
- [ ] 盘点 migration 目录与真实 schema 的漂移；输出 `schema-drift-report.md`，不自动应用陈旧 SQL，也不重复执行 055。
- [ ] 审查孤儿数据/引用失效：Edition 不存在的 post、孤立附件、删除文章后的评论/反应记录；先生成**只读报告**，不能擅自清理。
- [ ] 查询 Neon 支持的 PITR、备份、分支还原及保留周期，定义可接受的 RPO/RTO，并记录费用。若需要定期导出，建议脱敏/加密并存到经过授权的安全位置。
- [ ] 至少进行一次**临时分支恢复演练**：只在隔离环境恢复与比对文章数、关系、随机记录哈希；严禁在主分支做清库/还原测试。
- [ ] 估算检索、列表、tag COUNT、学习进度和发布审计的查询增长；只有证据充分时才申请新索引，记录索引写放大与存储开销。
- [ ] `auth_rate_limits` 如需过期桶清理，采用受控低频维护任务；先跑只读候选数量查询，生产 DELETE 需要明确审批，不能假设“定期清理”可自行执行。

### 验收

- 恢复演练能够在隔离环境取得准确文章与账号数量、Edition 一致性结果；不需要变更主分支数据。
- 备份/恢复步骤有命令、权限前提、执行人、成功标识与回滚原则。
- 生产级删除/迁移方案必须单独列出 SQL、影响行数预估、事务条件、失败处理和批准记录。

**回滚**：本阶段以报告和演练为主；若无明确批准，不在生产执行 DML/DDL。

**结果登记**：PR `________` ｜ 恢复演练日期 `________` ｜ RPO/RTO `________`

---

## M12 · Next.js 受支持版本与生态依赖分阶段升级

**当前基线**：`next: ^14.2.35`、React 18、NextAuth v4、Tiptap v3、Vitest v4、Neon Serverless SDK、Cloudinary loader 和 Next 14 版本的 `next lint`/页面 API。升级具有交叉影响，应放到发布、搜索、缓存稳定后。

### 原则

- [ ] 先确认升级时**官方仍受支持的 Next.js LTS 版本**和安全公告，选择可维护目标；不要只为追求最新版本直接切主线。
- [ ] 建立依赖兼容矩阵：React、NextAuth、ESLint、TypeScript、Tiptap、Recharts、PGlite、Neon、Vercel 的最低/最高版本和破坏性变更。
- [ ] 升级计划分两次以上：先测试环境和工具链，再 Next/React/路由相关变化；使用独立预览分支、绝不一并重写 UI。
- [ ] Next 14 的 `params/searchParams`、缓存 API、Route Handler、`next/image`、Edge Runtime、`next lint` 及 App Router 行为变化需要逐项迁移，不可只修改 package.json 版本。
- [ ] 并发请求、ISR、账号 Session/鉴权、专刊服务器渲染、博客 HTML 清洗、搜索查询、上传/下载、管理员编辑器和构建页面数量均要覆盖 E2E。
- [ ] CSP、严格模式、字体/图片加载和客户端 hydrate 在升级前后分别比对。

### 验收

- `npm ci` 干净安装，typecheck/lint/unit/build 全绿，Vercel Preview READY；关键页面和管理员可操作性通过浏览器回归。
- 对比 Bundle 体积、LCP、JS 报错、HTTP 500 和数据库查询量。严重退步阻断合并。
- 确认无未弃用 API、无锁文件不一致、无“只在本地运行”的依赖。

**回滚**：保留原 package-lock + Next 14 分支和 Vercel 部署作为回退锚点；如升级涉及迁移，请另设迁移审批，不能通过 Git revert 假装数据库自动回退。

**结果登记**：PR `________` ｜ 目标版本 `________` ｜ 回归报告 `________` ｜ 完成日期 `________`

---

## M13 · 可选增强与长期代码整理（最后执行，按价值择优）

以下功能不应在前面质量门槛未完成时插队：

- [ ] **统一编辑器**：管理员编辑、普通用户投稿和预览共用数据结构；保留各自权限/审查流程，不强行合并业务页面。
- [ ] **阅读辅助**：代码一键复制、公式清晰排版、长图查看、打印友好模式、PDF 导出（如确有用户需求）与 Markdown 复制。
- [ ] **项目作品集**：`/work` 的每个重点项目用技术案例模板展示需求、架构、难点、评测结果、迭代与可信证据，不只是产品宣传。
- [ ] **组件与样式清理**：检查高体积 `app/globals.css` 和多处布局逻辑，逐步拆出 scoped 模块；删除真正不再被引用的代码，不能靠文件名猜测死代码。
- [ ] **仪表盘优化**：管理员运营页按真实使用频率重新组织，减少无意义统计和重复点击。
- [ ] **用户社区功能**：评价、收藏、贡献勘误等先明确滥用防护、数据保留和审核责任；没有运营资源则不增加社交复杂度。
- [ ] **国际化**：只有长期读者来源和维护资源证明需要时再做；搜索与中文教学体验优先。

**每项增强独立 PR**；必须有用户价值证据、回归测试和关闭/回滚方式，不把“重构行数”当成果。

---
## 03. 每个阶段通用验收门禁（必须全部通过）

### A. 开工前检查（Preflight）

- [ ] 已读取最新 `main`、开放 PR、近 5 次提交；确认本阶段不与其他 PR、现有 ChatGPT 16:00 建设任务发生修改冲突。
- [ ] 已确定目标用户、改动范围、明确不改范围、所需权限、数据库是否需要迁移。
- [ ] 已留存当前生产部署 commit SHA 与 Vercel deployment ID 作为回滚锚点。
- [ ] 如涉及生产 DDL/DML/密钥：已获得**针对本次具体 SQL/操作**的用户批准；否则只在临时环境操作。

### B. 代码与测试（PR Gate）

```bash
# 每个独立分支的基础验证命令；以项目实际 npm scripts 为准
npm ci
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

- [ ] 回归测试覆盖**正向、拒绝、异常、重试和兼容旧数据**；数据库测试使用模拟与实际 PostgreSQL 语义双层验证（视阶段需要）。
- [ ] 不在用户可见应用中新增付费模型依赖；不绕过管理员权限、内容安全过滤或 Editor 校验。
- [ ] 敏感配置使用环境变量，不打印 Secret；如性能或质量发生回归，明确记录并修复。
- [ ] GitHub Actions 的该提交检查全部成功；Vercel Preview 必须对应同一 SHA 且为 READY。
- [ ] 对用户实际可见的变化提供前后截图/浏览器验收；不能拿“构建成功”替代 E2E。

### C. 合并与生产验收（Release Gate）

- [ ] 审阅变更文件：没有未审查的迁移、依赖、认证绕过、无关重构、生产数据修改。
- [ ] 高风险操作有用户批准与回滚说明；合并前记录 PR 编号及目标 SHA。
- [ ] 合并后检查 `main` 新 SHA、Vercel `production READY` 与部署日志；生产 smoke 不涉及删除真实业务数据。
- [ ] 检查 `/`、`/blog`、`/learn`、`/search`、任一公开文章及 `/admin/learn` 的适当授权行为；测试移动 390px 与桌面 1440px。
- [ ] 查询新部署后的错误日志；历史错误不得被误判为新部署回归，按 `deploymentId` 和时间范围筛选。
- [ ] 记录真实结果后更新计划状态；若失败应暂停后续阶段，必要时回滚。

### 最小回归冒烟集

| 页面/功能 | 验收动作 | 错误时优先排查 |
|---|---|---|
| `/blog` | 打开列表、标签筛选、分页、热门排序 | SSR、Neon、ISR、标签 Count |
| `/search?q=Agent` | 分类/分页/排序、刷新与前进后退 | URL 状态、SQL、Facet、Request race |
| `/learn` | 四主题、最新刊物、浏览记录、文章跳转 | Edition 读取、内容 JSON、LocalStorage |
| `/blog/daily-learn-YYYY-MM-DD` | 文章与目录、代码、图表、来源、练习 | LearnArticle、客户端 Hydration、缓存 |
| `/admin/learn` | 未登录受阻、管理员可看出版状态 | RBAC、Edition 验证、后台 DB 读取 |
| `/feed.xml` 与 `/sitemap.xml` | 只包含公开内容，时间/域名正确 | 缓存 TTL、日期、Published 过滤 |
| `/work` | 项目图文/外链正常 | Cloudinary、静态元数据 |
| `/api/download` | 本站 Cloudinary PDF/MD 正常，恶意 URL 拒绝 | #11 来源策略与 stream cap |
| 登录/注册/改密 | 已存在账户正常登录、错误/限流路径表现正确 | #7 Neon `auth_rate_limits`、NextAuth、邮件 |

**备注**：真实登录、验证码发送、管理员写入用独立测试账号或受控账号，不使用虚假的生产成功回执。必要时手工验收，不滥用真实邮箱/手机号。

---

## 04. 发布操作手册（可复制给 Codex）

### 模板 A：执行某一个阶段

将 `MXX` 改为当前阶段编号。**不要把全部 M00–M13 当作一次 Codex 指令。**

```text
请执行 shengzongPost 的 MXX 阶段。
输入计划文档：docs/SHENGZONGPOST_EXECUTION_PLAN.md。
以最新 main 为基线，先确认任务未被其它 PR 实现。
只完成 MXX 中列出的实施与验收范围。先阅读当前源码和测试，再提出 1 段实施摘要及潜在风险。
创建 codex/xxx 独立分支，按失败用例 -> 实现 -> 回归的顺序完成。
除非我明确批准，否则不做生产数据库迁移/删改真实数据/修改密钥/生产发布或大版本升级。
给出 PR、测试/构建证据、可用预览 URL、生产风险和回滚方法。
完成本阶段后停止，不自动执行下一阶段。发现阻塞时停止危险操作并报告需要的授权或资源。
```

### 模板 B：只做 PR 评审与验收，不改代码

```text
只评审当前 shengzongPost 开放 PR；不创建新功能 PR。
检查最新 main 和 PR head SHA，一一验证 GitHub Actions、Vercel Preview、source diff。
围绕权限、数据一致性、竞态、缓存、性能、SEO、响应式、历史数据兼容做代码审查。
如有阻断问题，指出文件/位置、复现方式、修复建议和对应测试，不要虚报验收。
无风险时输出“可合并”和仍缺少的真人浏览器验收项。
```

### 模板 C：发布后生产只读验收

```text
对 shengzongPost 刚合并的 PR 执行只读生产验收。
获取 main 合并 SHA、Vercel production 最新 deployment ID 与 READY 状态。
按 docs/SHENGZONGPOST_EXECUTION_PLAN.md 第 03 节执行页面/API smoke。
重点检查当前部署时段产生的新 HTTP 500、认证回归、公开文章和每日精读状态。
不执行任何生产删除、后台批量修改、创建账号或发送验证码；需要实测登录时先请求许可。
输出验收通过/失败、证据、阻塞和是否需要回滚。
```

### 模板 D：确实需要 Neon 新迁移时（先申请批准）

```text
当前阶段发现可能需要 Neon schema 变更。先停止主分支写操作。
输出：为何需要迁移、完整 SQL、影响表和列、兼容/锁定风险、应用顺序、回滚策略、成本、旧数据安全性。
仅使用 Neon 临时分支执行 DDL 和非生产的读取/写入测试，回报临时分支 ID、结构检查结果及受影响记录数。
给我明确的批准问题；没有批准时，不将临时迁移应用生产，也不合并依赖迁移的新代码。
```

---

## 05. 进度看板（每做完一个阶段就更新）

| 阶段 | 当前状态 | PR/提交 | CI | Preview | Production | 人工/浏览器验收 | 日期 |
|---|---|---|---|---|---|---|---|
| M00 搜索 V2 | [x] 已合并，正式域名验收通过 | [#13](https://github.com/Xavier7776/shengzongPost/pull/13) / `e4b894b` | 最终 head run 37904129515 通过 | dpl_7A4r3Dt2HzUB3cv66QfqridBTgok READY | dpl_8czf41qX1VyuLzqvE9orrLLz8LVS READY | 正式域名 Edge 三尺寸及完整搜索流程通过；真机未测 | 2026-10-09 |
| M01 CI 门禁 | [-] 实施和远程门禁验证中 | `codex/ci-quality-gates-v2` | 本地 196 tests/typecheck/lint/build 通过；远程待验 | 待提交 | 不变 | main 强制 validate/Vercel 已确认 | 2026-10-09 |
| M02 发布完整性 | [ ] | — | — | — | — | — | — |
| M03 发布监控 | [ ] | — | — | — | — | — | — |
| M04 缓存一致性 | [ ] | — | — | — | — | — | — |
| M05 来源与图表 | [ ] | — | — | — | — | — | — |
| M06 搜索评测 | [ ] | — | — | — | — | — | — |
| M07 学习中心 V3 | [ ] | — | — | — | — | — | — |
| M08 内容推荐/作品集 | [ ] | — | — | — | — | — | — |
| M09 SEO/性能 | [ ] | — | — | — | — | — | — |
| M10 安全二轮 | [ ] | — | — | — | — | — | — |
| M11 数据与恢复 | [ ] | — | — | — | — | — | — |
| M12 Next LTS | [ ] | — | — | — | — | — | — |
| M13 可选增强 | [ ] | — | — | — | — | — | — |

### 已完成且不应重复建设的模块（维护基线）

| PR | 已实现 |
|---|---|
| [#5](https://github.com/Xavier7776/shengzongPost/pull/5) | 技术精读宽屏/章节导航 |
| [#6](https://github.com/Xavier7776/shengzongPost/pull/6) | RBAC、草稿访问限制、评论 SQL 修复 |
| [#7](https://github.com/Xavier7776/shengzongPost/pull/7) | Neon 分布式账号限流、验证码账号绑定；055 已应用 |
| [#8](https://github.com/Xavier7776/shengzongPost/pull/8) | 历史/未来 HTML 清洗与 XSS 防护 |
| [#9](https://github.com/Xavier7776/shengzongPost/pull/9) | `/learn` 分类/历史/分页/SEO |
| [#10](https://github.com/Xavier7776/shengzongPost/pull/10) | `/admin/learn` 只读发布健康度 |
| [#11](https://github.com/Xavier7776/shengzongPost/pull/11) | Cloudinary 安全下载代理 |
| [#12](https://github.com/Xavier7776/shengzongPost/pull/12) | 真正按浏览量热门、全库标签计数、跨页标签筛选 |

### 变更日志模板（复制填入本节）

```text
执行日期：YYYY-MM-DD
阶段：MXX
基线 main：<完整 SHA>
PR：<链接>  Head：<SHA>
变更文件：<清单>
关键设计决策：<一至三条>
自动验收：Typecheck / Lint / Vitest NN / Build / GitHub Actions
数据库：只读 / 临时分支 / 已批准迁移编号 / 无变更
Vercel Preview：<URL+READY/ERROR>
人工验收：桌面 / 手机 / 具体接口 / 尚未执行
合并：待批准 / 已合并 SHA
Production：未发布 / BUILDING / READY / ERROR
回滚锚点：<旧稳定 SHA / Vercel deployment ID>
遗留问题：<明确记录>
下一阶段：MYY
```

---

## 06. 推荐的首轮执行批次（避免一下子做 14 个阶段）

### 第 1 批：先形成发布质量闭环（3 个 PR）

- [x] **M00 / PR #13**：修复防抖浏览器历史、完成 Preview 验收、合并上线。
- [ ] **M01 / PR #14（建议编号，需以 GitHub 实际编号为准）**：CI 路径覆盖与 `npm run build` 必跑。
- [ ] **M02-A / 下一独立 PR**：专刊相同日期冲突检测、写入回读、任务发布协议，不需要生产迁移。

**第一批完成标志**：搜索上线、任何核心代码变更都受 CI 保护、每日专刊重复执行不产生数据冲突或虚假成功回执。

### 第 2 批：让发布可观察、页面保持一致（2–3 个 PR）

- [ ] M03-A 出版 7/30 天日历与缺刊/漂移告警（不建新表）。
- [ ] M04 文章缓存、RSS 与 sitemap 同步。
- [ ] 如确有需要，单独设计 M03-B 的审计表迁移并**明确申请生产 DDL 批准**。

**第二批完成标志**：漏刊可识别、错误能排查、撤稿不会继续出现在公开入口，缓存延迟有清晰 SLA。

### 第 3 批：内容可信和学习体验（3–4 个 PR）

- [ ] M05 高质量来源与证据质量治理（先不破坏 Edition v1）。
- [ ] M06 搜索效果/性能基准和可选索引评估。
- [ ] M07 学习进度本地版（云同步仅在必要时申请迁移）。
- [ ] M08 文章系列与作品集联动。

**第三批完成标志**：文章有可追溯证据，读者可找到相关学习路线，学习完成度有真实定义。

### 第 4 批：长期工程化（按价值实施）

- [ ] M09 SEO/Web Vitals；M10 安全二轮；M11 备份恢复演练。
- [ ] M12 Next.js LTS 升级。
- [ ] M13 逐项选择真正有价值的可选功能与清理。

**第四批完成标志**：能够稳定构建、观测、回滚、恢复，并对外展示可信的工程成果。

---

## 07. 做与不做的决策表

| 情况 | 推荐决策 | 不推荐的做法 |
|---|---|---|
| Codex 想重写 Search V2 | 先验收/修复 PR #13，再做评测 | 重复开发另一套 Search |
| 每日发文偶发失败 | 先完善回读、幂等、任务日志、告警 | 直接新增第二条定时任务同时发文 |
| ChatGPT 定时任务缺少 Neon 权限 | 明确报错，调查连接、选受监督 fallback | 谎报“已发布”、调用未配置的 HMAC API |
| 要添加 AI 生成按钮 | 保持网站无模型运行时，内容生成留在外部任务 | 引入额外付费模型 Key 与调用 |
| 页面更新延迟 | 区分 ISR/函数缓存/CDN/外部 SQL，给出 TTL 与失效表 | 无证据地加 `revalidateTag` 并宣称实时 |
| 搜索 SQL 快但用户慢 | 测真实网络 RTT、冷启动、慢请求分布 | 只展示 EXPLAIN 9ms 说体验已优化 |
| 准备新索引/表 | Neon 临时分支验证并请示生产迁移 | 趁上线直接修改主数据库 |
| 发现重要缺陷 | 停止后续功能，单独高优先级 hotfix + 回归 | 把事故修复混入大功能 PR |
| Next.js 需要升级 | 独立分支，兼容矩阵 + Preview 全量验收 | 把 React/Next/编辑器/数据库一口气升级 |

---

## 08. 最后验收：什么时候可称为“优秀且长期可维护的技术博客”

只有以下条件**同时满足且有证据**，才建议宣布本轮建设阶段收官：

- [ ] 从任何已发布文章均可通过标题/标签/正文检索；分页、分类数量准确，草稿严格隔离。
- [ ] 最近 30 天预定出版的技术精读有完整“应发/已发/异常/改正”记录；每一次声称成功都有 Neon 回读证据。
- [ ] 发布、修改、撤回、删除在 Blog/Learn/文章/RSS/Sitemap/Search 的缓存约定内一致。
- [ ] 重要技术数字有来源、示意图显式标注，错误可更正并留下解释。
- [ ] 技术学习中心支持从阅读到自测、练习、完成状态，且隐私边界明确。
- [ ] 至少完成一次真实数据库隔离恢复演练及一次完整的生产回滚演练（不破坏业务数据）。
- [ ] 关键页面桌面与移动端可访问，Lighthouse 与真实用户指标有基线和改造后数据。
- [ ] 下一版框架依赖处于受支持的稳定路线；关键 CI 路径无遗漏。
- [ ] 网站 runtime 仍不依赖外部付费 AI 生成接口；每日文章任务与站点可独立维护。
- [ ] 每个阶段有完整 PR、验收证据、上线 SHA 和可执行回滚方案。

---

**计划维护规则**：这是一份可执行的活文档。每次 Codex 完成一个阶段，只更新该阶段勾选、PR/版本信息、验收证据和下一步，不要把过去已经验证过的设计重新讨论一遍。**第一个执行动作仍是：使用通用入口指令，指定 `M00`，完成 PR #13 的最后验收。**

### 2026-10-09 实施记录：M00（开始执行）

- 基线 main：`ed7821e9e2965b0250e0ac4907c370fc08edacd2`；沿用既有隔离分支 `codex/search-v2-global-relevance-pagination` 与 Windows 工作树 `D:\download\worktrees\shengzongPost-search-v2`。开工及推送前实时检查只有 PR #13 开放，原 head `ac148b18ea74a3c343d544451c0c411de3fc4a80`，未合并、Draft，无新冲突。
- 改动：自动防抖 URL 更新改为 replace；显式 Enter、历史、分类、排序和分页保留 push；修复历史键盘访问及清空后的展开。SQL 算法和数据库结构保持原实现。
- 回归：先复现失败用例后修复；新增 5 项测试及既有防抖断言，覆盖连续输入的 replace、显式 push、键盘历史与旧 limit 兼容。
- 自动验收：Windows `npm ci`、typecheck、lint、28 文件 / 190 测试、生产 build（92 静态页面）、diff check 通过。构建使用忽略目录 `.tmpbuild`；metadataBase 为既有提示，后续 M09 处理。
- 数据库：只读核对，Agent 112 条跨 6 页无重复遗漏，独立 strpos 查询计数一致；中文、%、_、反斜杠、引号及旧文章正文搜索通过。无生产写入或迁移。
- 浏览器：Browser plugin 未提供，使用 bundled Playwright + 本机 Edge；本地生产构建 `http://127.0.0.1:3217` 的 1440×900、1024×768、390×844 均通过；回放后退/前进/刷新、防抖历史长度、Enter、Tab 历史、分类/排序/分页、无结果、500/重试与 Blog 搜索入口。超时由单测验证。所有非 GET 浏览器请求均拦截，无 analytics 写入；没有真机验收。
- 证据：`docs/search-v2-20261009.md`；本机截图、QA JSON 与 SQL EXPLAIN 位于 `D:\download\search-v2-validation\m00`，build 日志位于 `D:\download\search-v2-validation\m00-build.log`；不包含连接串、密钥或个人信息。
- 线上：原 PR Actions run `37892247905` 成功，原 Preview `dpl_CGvWcEhkhV2WuAb7ZAMYBqYw66pb` READY；这两项仅证明旧 head。更新提交的 CI / Preview / 在线浏览器验收待推送后登记。
- 生产回滚锚点：`ed7821e9e2965b0250e0ac4907c370fc08edacd2` / `dpl_927hMaqydgtF4SupdshqFB26ezHf`（实时确认 production READY）。未合并、未部署、未进行本次生产搜索验收，阶段保持 `[-]`。
- 依赖安装报告现存 59 项 audit 漏洞（36 moderate / 21 high / 2 critical）；本阶段未升级依赖，交 M10/M12 核实可达性与修复，不以安装成功表示漏洞已解决。
- 下一步：更新同一 PR 并完成新提交的 Preview 复核；M00 合并与生产验收结束后再进入 M01。本次不改变 08:30 或 16:00 调度、不引入第二发布 cron。
### 2026-10-09 M00 在线复核发现与修复

- 代码提交 `58098a2ed0a9201feeadf1f3906a17166dad2e64` 的 Actions `37902373340`：npm ci/typecheck/lint/189 tests 全部通过，只有 git diff --check 因复制计划原有的 5 处 Markdown 行尾空格失败；已去除空格，并改用检查完整 PR 差异和 staged 差异。
- Preview `dpl_6QNXhmmst2TpBnNMa3Ktv8nVMjz4` READY；通过现有临时授权访问链接及现有本机代理进行浏览器复核，未降低 Deployment Protection。Node APIRequestContext 直连曾网络超时，改用浏览器自身 GET，未改系统代理。
- 在线七类关键词、六页完整分页、分类/newest、limit=4、公开推荐和三个尺寸通过；但立即清空再用 Tab/Enter 选择刚才历史词复现竞态，故这版没有标记 Ready。
- 根因：navigate 对等于旧 URL 的目标只触发重试，未覆盖尚未完成的清空跳转。现已保证导航命令总会分发；同 URL 重试仍回读，Next 14 自身避免重复当前 URL 的 history entry。先新增可重复失败用例，修复后 typecheck/lint/28 文件 190 tests 通过。
- 最终代码提交的 build、CI 与线上完整回放仍须重新核对；此前失败记录不作为最终通过证据。
### 2026-10-09 M00 代码验收结果（待合并与生产验收）

- 最终代码提交：`195f2a05e44f823d9cbf37b552bcf1143020870a`；[Actions 37903421784](https://github.com/Xavier7776/shengzongPost/actions/runs/37903421784) 成功。Windows typecheck/lint/190 tests/build（92 静态页）及完整 PR diff check 均通过；本地全流程已复跑通过。
- [代码 Preview](https://shengzong-post-bs7mewfmn-leonidasholya-2025s-projects.vercel.app/search?q=Agent) 对应同一代码 SHA，部署 `dpl_5FGmCudVXZpRCuFLK76xXjV6d1ja` READY；通过临时授权与现有代理，完成在线 Edge 1440×900、1024×768、390×844 的截图、布局及实际交互，未出现横向溢出或框架 overlay。
- 线上 Agent/RAG/Transformer/%/_/中文/不存在词、六页完整遍历、分类/newest、末页/越界 Facet、旧 limit=4、四条公开推荐全部通过；防抖不新增历史、后退/前进/刷新、Enter、Tab/Enter 历史词、立即清空再选择历史词竞态通过。浏览器注入 500 与请求挂起验证错误/15 秒超时/重试；不修改服务或数据库。
- `/`、`/learn`、公开文章返回 200 且有实质内容；Blog 全站搜索保留含中文的关键词；匿名 `/admin` 跳转 `/admin/login`。管理员真实登录和写操作、真机测试尚未执行，不能据此声称它们已通过。
- 控制台验收：无应用运行时错误；预览中现有 CSP 阻止 Vercel 注入的 `vercel.live/_next-live/feedback/feedback.js`，形成可解释的控制台提示。已确认 `next.config.js` 与 main 相同；不放宽 CSP。测试故意注入的 500 单独记录。原“控制台必须零错误”的 QA 断言因这些提示失败，经来源核对，验收以无未解释应用错误为准；最终文档提交继续用明确分类后的脚本检查。
- 后续提交仅更新验收文档；需确认其运行时代码与上述 SHA 一致，并核对该提交的 CI/Preview。每个 SHA 的证据分别保留，不把旧部署当成新提交的验证。
- M00 保持 `[-]`，最终 PR 标记 Ready 后等待用户明确确认合并；合并后还需 Production READY 和只读 smoke。M01 尚未开始，按阶段依赖执行。
- 截图与真实回放记录保留在 `D:\download\search-v2-validation\m00`；线上截图前缀 `preview-final-code-`。没有关闭保护、改密钥、生产 DML/DDL、定时任务或模型调用。

### 2026-10-09 持续执行授权与 M00 生产验收

- 用户要求持续执行直至完成，允许依次推进并合并已验证 PR；保留生产 DDL/DML、密钥、调度、Alias 变更的单独批准边界。
- PR #13 最终 head `c365dfbba71e28019adb7e6e1d26420baa6b51d9` 的 CI run 37904129515 与 Preview READY 已复核；squash 合并 SHA `e4b894bdd1ce57c1efad0505af924e4c2212a2f7`。
- Production `dpl_8czf41qX1VyuLzqvE9orrLLz8LVS` 对应同一 merge SHA，READY。正式域名 https://www.zshengzong.top 完成在线 Edge 1440/1024/390 宽度、七类关键词、112 条 Agent 六页无重复、Facet/newest/limit、历史导航、防抖、键盘、500/超时重试、Blog 入口、公开页面与匿名管理员拒绝；无未解释控制台错误。
- 生产 QA 只读，非 GET 请求被拦截；未写生产文章、未变更定时任务。证据 `D:\download\search-v2-validation\m00\production-main-qa.json` 与同前缀截图。

### 2026-10-09 M01 实施进度

- 基线 `e4b894b`，独立 Windows 工作区 `D:\download\worktrees\shengzongPost-m01`；开放 PR 已检查无冲突。
- 移除 CI paths 过滤，每个 PR 跑 ci/typecheck/lint/test/构建/diff。Node 24 对齐 Vercel，CI npm 固定 11.6.0；现有锁文件的已移除依赖/开发依赖分类同步，不升级版本。
- CI 构建通过 loopback PGlite 合成数据执行真实 SQL，预加载 transport 仅用于构建子进程；不使用生产 Secret、不改生产 Next 配置。read-only transaction/解码/写拒绝自检通过，90 静态页构建通过。
- 管理员实际批量发布路由增加游客/普通用户/admin/降权 JWT/API Key/无效 Key 矩阵，拒绝时 SQL 与失效调用均为零。28 文件 196 tests、类型检查、lint 通过。
- main 原无保护（REST 404）、无 rulesets。现已启用严格 validate/Vercel 必须成功、管理员也受约束、对话解决、禁止 force push/delete；需要独立审批数为 0，安全审查属于操作流程。Connector 的 admin 403 已用现有 Git 凭据 REST 完成，未记录令牌。
- 远程目录触发、故意类型错误阻断、最终 Preview/生产复核仍待完成，M01 不提前勾选。release-checklist 与 rollback 已保存，恢复演练未执行。