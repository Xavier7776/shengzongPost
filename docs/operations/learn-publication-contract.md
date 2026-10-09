# 每日专刊发布与核验契约（M02-A）

现有 08:30 ChatGPT → Neon 通道保持不变。HTTP HMAC 接口仍为可选受控入口，本阶段不配置密钥、不修改任务、不发布或重写生产文章。直接 SQL 不会自动调用下面的 TypeScript 门槛；任务通道验收仍待独立运行证据。

## 服务端契约

`validateEdition` → 保留全文、数组顺序的 canonical JSON → UTF-8 SHA-256 → 原有 `textVersion` → 原子 INSERT → 独立 SELECT → 有界公网 GET。

- 完整指纹包含全部 Edition 内容；只排序对象键。v1 与旧正文转换算法保持兼容。
- 发布前先查同日期/slug。相同 Edition 且 posts/edition/正文/标题/标签/公开状态一致，返回 no-op；任何漂移、孤儿或多个关联均拒绝，不覆盖。
- 新稿来源只访问结构门槛允许的 HTTPS 官方 URL，拒绝重定向，每项 4 秒超时。可访问性与所填日期合法性不证明论文事实或元数据正确。
- 两表写入保留单条 CTE；唯一约束保护并发，失败不留下半条关联。即使 INSERT 返回成功，也必须独立回读完整关系与正文才可返回 `verified=true`。
- 新写入调用现有三个页面的失效路径。失效失败不重写数据，单独返回 `cacheStatus=failed`。全站缓存矩阵交 M04。
- 公网 GET 最多三次，每次 3 秒，间隔 250ms；必须同时命中文章 slug 与完整内容指纹。延迟/重定向/错误/旧页面均为 `public_pending`，不再次 INSERT。

| 返回值 | 含义 |
|---|---|
| `created=true` / HTTP 201 | 本次原子插入且独立回读一致 |
| `alreadyExists=true` / HTTP 200 | 已存相同完整刊物，零业务写入 |
| `verified=true`, `dbStatus=db_ready` | 数据库内容回读一致，不能推断公网可见 |
| `publicStatus=public_ready` | 只读 GET 得到同内容指纹 |
| `publicStatus=public_pending` | 数据库已验，公开缓存/网络仍待观察 |
| HTTP 409 `conflict` | 已存内容或关系冲突，禁止覆盖 |
| HTTP 502 `source_unverified` | 来源不可访问，返回字段级脱敏原因 |
| HTTP 500 `readback_failed` | 不得报告成功；本次已写则 `written_unverified` |

错误响应包含 requestId；服务日志仅记录 requestId、类别、日期，不保存连接串、原始异常或文稿。日志尚非独立持久化审计，M03-B 必须经单独 DDL 批准及任务通道验证。

## 直接 Neon 发布协议的验收要求

每次新运行应保留候选完整 JSON，并执行同版结构门槛和 canonical 指纹；读取当天 post/edition、拒绝内容冲突；通过单条事务写入两表；再独立读取一对一关系、日期/主题/版本/来源、published/status、正文及完整 JSON；最后只读检查 Blog、Learn、详情与管理员看板。直接任务尚无已验证的自动执行适配器，本文不是“任务已遵守协议”的证明。不得因网页延迟重发。

用户 2026-10-09 提供：任务 `6ac7459de6708191a43067242037d4b7` 启用，每日北京时间 08:30；仅有最近执行时间 08:56:51，缺完整日志。10-09 刊物存在，不能归因到自动运行；10-07/08 缺刊，运行状态未知。最近三次成功率不可判定。未来需独立持久化发布审计，不以任务时间或文章存在性代替运行成功。

## 验证与恢复

- Windows 30 文件 / 222 测试、类型检查、lint 通过。PGlite 执行实际发布 SQL 验证并发、冲突、孤儿和事务回滚。
- Neon 临时分支 `br-wild-wind-a1jhsr8m`（parent `br-old-truth-a1bnmt7i`）使用未公开、1900-01-01 合成记录验证 SQL 原子性：并发结果 1/0、同日期冲突后只保留一个关联、零孤儿；生产只读确认测试 slug 数量为 0。这是数据库约束演练，合成 JSON 不用于 Edition 内容验收。分支保留，删除须明确批准。
- 生产 10-09 的公开 JSON 经当前真实 `validateEdition` 与 `textVersion` 本地只读核对合格，3 来源、32 块，指纹 `e061e72ad216a0dadf7c2f584bfbb38294b7ad03d71d069a20d6f2a743a70e2d`。此指纹用于既有文章兼容与公开 GET 检查，不归因任务成功。
- 三个官方 arXiv 页面 `2610.10170` / `2610.09361` / `2610.09412` 的标题与 v1 提交时间已核对，分别为 2026-10-07 14:45:26 / 03:16:06 / 04:14:31 UTC；科学结论复核交 M05。
- 回滚仅 revert 本 PR 的代码；历史刊物保留。遇到 written_unverified 先只读调查，禁止 DELETE/覆盖恢复。

线上同 SHA Preview / CI 与生产回读证据在计划实施日志追加；未完成项不得凭本地结果勾选。
