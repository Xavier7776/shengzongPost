# 出版观察与持久化审计候选（M03）

## M03-A：只读后台

`/admin/learn` 先验证当前管理员身份，再读取最近 60 条专刊/同前缀文章，检查孤儿、Slug、日期、主题、标题、结构和正文；错误不会显示为“零异常”或“任务失败”。最近 30 个北京时间自然日可展开，默认最近 7 天。

从用户确认任务启用的核对日 **2026-10-09** 起设定每日出版期望；这是本轮巡检策略起点，不是对历史任务启用时间的推断。更早日期仍显示实际刊物或“出版期望未知”，不得补造失败历史。当天 08:30 前未到窗口，08:30–09:30 为宽限，之后尚未见刊才显示提醒；计划停刊需先明确调整期望配置，避免误报警。

数据库观察、结构耗时、最近内容合规日期与至该日连续合规出版天数分别显示。只有最近一次合规刊物运行 M02 的有界公网指纹 GET，其余日期公网状态 unknown。任务执行状态全部 unknown，直到真实任务能提供独立审计证据。数据库不可用时计数/缺刊状态 unknown，日志仅记录 database_unavailable 类别，不暴露原始异常。

异常提醒仅位于管理员浏览器页面，同日期/同类别键有 24 小时 localStorage 冷却，恢复后从当前提醒移除。存储不可用时仍显示本次观察，不保证跨刷新去重。浏览器关闭时没有主动巡检；不发送邮件、不新增调度。完整日历不受提醒冷却影响。

## M03-B：持久化审计候选尚未启用

`supabase/migrations/056_learn_publish_runs.sql` 只提供审阅候选。生产表只读查询结果仍为不存在；当前页面和发布服务不依赖此表。本阶段不执行新的生产迁移，也不更改 08:30 Task、Neon 主通道或 HMAC Secret。

- 每次真实运行创建一个 UUID attempt_id；同 attempt 重试必须核对 edition_date/source/task_id，不得用不同内容静默覆盖；同日期的不同真实尝试允许独立记录。
- started 先于内容写入。只有真实通过结构门槛/写入/独立回读/公网指纹 GET 后才能分别记 validated/db_written/db_verified/public_verified。任务超时未回传仍为 started/unknown，不根据文章存在补造成功。
- ChatGPT 记录要求 task_id；schema/fingerprint/source_count/slug 约束禁止缺少证据字段的 verified 记录。字段存在仅表示已提交元数据，仍需真实通道与回读证据，不能当成事实证明。
- error_category 仅允许固定类别；不提供自由文本错误、IP、邮箱、密钥、连接串或文稿字段。审计保留独立于文章删除，不做历史补写。
- 生产授权前还需验证当前 ChatGPT 任务实际可以持久化 attempt 状态并回读；当前没有该运行证据，不能先部署一个任务无法使用的写入器。网页提醒也不能替代这一步。
- 单独批准后才讨论生产 DDL 与生产通道集成，按先 DDL 后消费代码顺序实施。回滚停用消费/写入器并保留表，不自动 DROP，不删历史刊物。

## 验证登记

- Windows typecheck/lint、33 文件 / 245 tests 通过；真实 PGlite 覆盖北京时间边界、关系/正文漂移、DB 不可用、未知状态和浏览器冷却/恢复。
- 审计候选 DDL 在隔离 Neon `br-wild-wind-a1jhsr8m` 执行：重复 attempt 只留 1 条；缺少证据的 public_verified 被 CHECK 拒绝，整笔测试事务回滚、零孤儿 attempt。生产只读 `to_regclass('public.learn_publish_runs')` 为 NULL。该分支仍保留，无生产 DML/DDL。
- 对真实生产只读查询使用当前纯函数核验：10-09 1 期合规、至该日连续 1 天，10-07/08 无记录且运行未知。证据 `D:\download\search-v2-validation\m03-live-report.json`。
- 浏览器/生产构建、最终同 SHA CI/Preview 结果在计划最新实施日志补充。开发首次冷编译曾出现 Next/React hook 错误，热加载后通过；最终以独立生产构建与隔离签名会话重测，不把开发服务器结果当成生产验证。
- 最终 Windows 生产构建通过；该产物接本机只读 PGlite transport，用 placeholder Secret 签发隔离 JWT 并校验合成用户的当前 admin 角色。管理员日历、真实公开 JSON 快照、30 天展开和 1440/1024/390 布局通过，无应用/HTTP 错误；匿名先跳转。初始隔离 JWT 字段/用户资料 fixture 不完整导致拒绝及 profile 500，补齐测试 fixture 后完整复跑通过，未修改应用认证或生产账号。证据 `D:\download\search-v2-validation\m03-admin-qa.json` 与截图。
- 实际生产管理员登录/私有看板尚未验收；不使用真实用户账号或邮件。线上匿名拒绝与公开页可独立验证。
