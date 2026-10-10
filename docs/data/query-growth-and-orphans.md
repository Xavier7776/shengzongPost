# M11 查询增长与孤儿数据报告

2026-10-10，生产只读SELECT/EXPLAIN ANALYZE，无索引、DELETE、DDL、DML或资产删除。完整schema库存是public元数据；完整备份另含neon_auth9张托管表。

## 查询与增长

| 当前真实SQL | 单次执行ms | planning ms | shared hit/read |
| --- | ---: | ---: | --- |
| search-Agent | 99.132 | 0.979 | 456/97 |
| list-page-1 | 0.076 | 0.152 | 8/0 |
| tag-count-Agent | 0.078 | 0.106 | 15/0 |
| global-tags | 0.598 | 1.278 | 15/0 |

SQL从当前lib/db-search.ts和lib/db/posts.ts捕获，源码SHA随原始报告保存；每条仅一次观测，不是P95或多地域测试。Agent检索首次读取磁盘页；顺序扫描/现有B-tree在104公开文章、49Skills、5画廊时已可运行，没有充分新索引证据。M06客户端整体P95824.9ms的未达标状态不被本报告替换。

leading-wildcard ILIKE正文、OR及数组tag并非加普通B-tree即可解决。实际仅plpgsql1.0扩展，无pg_trgm；未来需要中文相关性、代表查询、缓存状态、写放大/存储测量后才提迁移。posts的slug唯一键与另一同列索引有潜在冗余，未测删除收益或改索引。

14日窗口实际统计新增48行，文章新增1篇，评论0；未把12个有数据日期当作14个日样本，也不以历史新增速率预测新公开写入限流增长。现有stats287、posts115、用户5、评论50、Edition1。

学习进度M07目前为浏览器localStorage、100Edition上限，库内没有学习进度表。056发布审计未获批准/未在生产，因此没有可测的审计表增长或查询计划；不能虚构0行审计表。main逻辑大小05:33约36945920字节（35.24MiB），pg_stat关系行数是估计，实际COUNT与备份大小另报。

## 只读引用候选

| 候选 | 数量 | 判定 |
| --- | ---: | --- |
| Edition引用不存在文章 | 0 | 无删除候选 |
| 评论/反应/收藏/阅读奖励引用不存在文章 | 均0 | 无删除候选 |
| 附件无关联文章 | 0 | 无删除候选 |
| 明确post_slug图片引用不存在文章 | 0 | 无删除候选 |
| post_images没有post_slug | 11 | 编辑器/未分配上传，不能认定垃圾 |
| 旧编辑申请目标缺失（排除新稿） | 0 | 无修复候选 |
| 临时/avatars本地头像引用 | 0 | 不证明所有对象存在 |
| auth_rate_limits旧于1日/总桶 | 0/0 | 05:13旧观测，清理前重计 |

Cloudinary对象实际可达、配额与未引用资源库存未核对；对象/DB没有共同事务，新上传确认丢失可能留孤儿，旧资源未删除。不能从URL存在推断内容可恢复，或把未分配图片自动删除。

## 权限事实

真实public.notifications、research_reports、visitor_tracking启用历史RLS；notifications四条/visitor_tracking两条策略条件为true，research_reports无策略。博客授权依赖服务端会话/角色/所有权检查，不能将这些策略当作账户隔离。owner可绕过RLS，实际Vercel角色与其最小权限未核对。本次仅保留现有结构，不加策略/GRANT、不创建账户、不切换DSN。

## 验证与待办

真实archive恢复库已运行上述四条原始应用SELECT，返回聚合1/分页12/tag COUNT1/全局标签115行；结果只记录数量，无正文或账号字段进Git。schema-only public基线在另一个新空库重建，244列/85索引逐字段一致，71约束名称/类型一致；70定义相同、cursor_effects.check_render_type一处varchar数组到text数组cast被PG17重解析为逐元素cast，有效/非法/空字符串/NULL真值与原定义一致。该差异明确保留，不宣称71条定义逐字一致。

新增索引/外键/唯一性、删除过期桶或孤儿资产均须影响计数、锁/事务/回滚和单独批准。当前无生产变更提请执行。
