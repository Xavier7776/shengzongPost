# 搜索 M06 固定快照评测（2026-10-10）

当前保留 V2 的排序和 SQL。104 篇公开文章、49 个 Skills、5 张画廊作品的小数据量尚无索引瓶颈证据。新增可复跑的评测和 `Server-Timing: search;dur=...`，后者计量 searchAll 内的 Neon 网络、查询、重试与结果组装，排除 JSON 编码、Vercel 队列和浏览器网络。它不等于 PostgreSQL EXPLAIN 时间。

快照来自一条生产 SELECT，在 2026-10-10T02:13:29.820Z 同一快照读取。真实正文保留于外部验证目录，未提交 Git。实际来源是 post/skill/gallery；all 是聚合筛选。JSON 查询样本包含 41 项（35 项等级标注、1 项已知零结果、5 项字符/标记诊断），有中文、英文、缩写、长标题、正文专有词和标签专有拼写。

标注由 Codex 在查看排序前审阅已知来源形成，尚非独立人类批准。Recall@20 分母是已知相关文档池；nDCG@10 用 1–3 等级和 log2 折扣，未标注文档暂按 0，单文档/精确项目名居多，分数不代表泛化语义质量或全站完整召回率。初稿将仅介绍 QLoRA 的全景文误标为 NF4 相关，读完整正文后移除；初稿两边 Recall=.985714/MRR=.960317/nDCG=.958182，保留 m06-replay-initial-*。修订后同时重跑两边，查询/算法不为该错误改动。初次从无 node_modules 的主 checkout 回放失败，改用已安装的 M05 工作树，源码 SHA-256 与 main V2 完全相同。

固定快照 SHA-256：`f4180bb965b9708a8247d88b41375ad57596a0086d81afaa75909c9056699551`。标注 SHA-256：`29e657153f87fdff47145c99ccb30951a7bcd3a0401d34718ad9e8c0fceefda2`。基线和当前 db-search.ts SHA-256 均 `b02d4dda1e83a806b3f2c297f6ff66d8a7acb3b4a566494b2a509ecb350d3e26`。两边所有返回顺序、Facet、总数完全相同。每词重复一次，完整遍历 50 条分页，以去重全集独立计算全局 Facet，再核对三种筛选；空查询保留已有行为。SQL/API 错误和 15 秒超时已有客户端回归，它们不会变为“零结果”。

| 指标 | V2 基线 | 当前 |
| --- | ---: | ---: |
| 已知池 Recall@20 | 1.0000 | 1.0000 |
| MRR@10 | .9603 | .9603 |
| nDCG@10 | .9643 | .9643 |
| 零结果率（含诊断） | 1/41 (2.439%) | 1/41 (2.439%) |
| Facet 准确率 | 41/41 | 41/41 |
| 异常率（回放） | 0/41 | 0/41 |

这些是同一算法的冻结回归，不声称排序提升。HBM 的专题候选在第 9 位，英文 RAG 展开词在第 2 位，短词正文的同分新文章会挤压专题；需要更广泛、独立标注才值得修改全局权重。对 35 个查询的前 3 候选是编辑期望清单，按相关性等级评测，不把其他未标注结果自动断言为错误。

| 查询 | 已知相关候选（最多 3） | 实际前 3（基线=当前） | 总数 | Recall / MRR / nDCG |
| --- | --- | --- | ---: | --- |
| 检索增强生成 | post:rag-deep-dive | post:rag-deep-dive<br>post:ai-agent-memory-knowledge-graphs-20260531<br>post:ai-frontier-openai-io-benchmarks-metareasoning-20260522 | 3 | 1.0000 / 1.0000 / 1.0000 |
| Retrieval-Augmented Generation | post:rag-deep-dive | post:ai-agent-explained<br>post:rag-deep-dive | 2 | 1.0000 / 0.5000 / 0.6309 |
| HyDE | post:rag-deep-dive | post:rag-deep-dive<br>post:daily-learn-2026-10-09 | 2 | 1.0000 / 1.0000 / 1.0000 |
| pgvector | post:rag-deep-dive | post:rag-deep-dive | 1 | 1.0000 / 1.0000 / 1.0000 |
| Self-Attention | post:transformer-architecture | post:transformer-architecture<br>post:beyond-transformer-20260618 | 2 | 1.0000 / 1.0000 / 1.0000 |
| 位置编码 | post:transformer-architecture | post:transformer-architecture<br>post:beyond-transformer-20260618<br>post:tech-weekly-20260530 | 3 | 1.0000 / 1.0000 / 1.0000 |
| Flash Attention | post:flash-attention-deep-dive-20260520 | post:flash-attention-deep-dive-20260520 | 1 | 1.0000 / 1.0000 / 1.0000 |
| HBM | post:flash-attention-deep-dive-20260520 | post:ai-weekly-digest-20260526<br>post:deepseek-v4-flash-mi300x-20260806<br>post:keji-weekly-ai-hotspot-20260718 | 9 | 1.0000 / 0.1111 / 0.3010 |
| QLoRA | post:llm-finetuning-guide<br>post:deep-dive-llm-fine-tuning-20260521 | post:llm-finetuning-guide<br>post:deep-dive-llm-fine-tuning-20260521 | 2 | 1.0000 / 1.0000 / 1.0000 |
| NF4 | post:llm-finetuning-guide | post:llm-finetuning-guide | 1 | 1.0000 / 1.0000 / 1.0000 |
| LoRA | post:llm-finetuning-guide<br>post:deep-dive-llm-fine-tuning-20260521 | post:llm-finetuning-guide<br>post:distillation-censorship-washing-20260731<br>post:ai-weekly-roundup-20260619 | 7 | 1.0000 / 1.0000 / 0.8996 |
| SFT | post:deep-dive-llm-fine-tuning-20260521<br>post:llm-finetuning-guide | post:deep-dive-llm-fine-tuning-20260521<br>post:glm-5-3-ed-o-meter-20260825<br>post:distillation-censorship-washing-20260731 | 5 | 1.0000 / 1.0000 / 0.9177 |
| AI Plugin | post:ai-plugin-explained | post:ai-plugin-explained | 1 | 1.0000 / 1.0000 / 1.0000 |
| OpenAPI 3.0 | post:ai-plugin-explained | post:ai-plugin-explained | 1 | 1.0000 / 1.0000 / 1.0000 |
| 能力单元 | post:ai-skill-explained | post:ai-skill-explained | 1 | 1.0000 / 1.0000 / 1.0000 |
| Semantic Kernel | post:ai-skill-explained | post:ai-skill-explained | 1 | 1.0000 / 1.0000 / 1.0000 |
| Hermes Agent | post:hermes-agent | post:hermes-agent<br>skill:claude-skills<br>skill:ai-research-skills | 3 | 1.0000 / 1.0000 / 1.0000 |
| HRR | post:hermes-agent | post:hermes-agent | 1 | 1.0000 / 1.0000 / 1.0000 |
| MoE 架构 | post:moe-architecture-deep-dive-20260520 | post:moe-architecture-deep-dive-20260520<br>post:Deekseek-v4 | 2 | 1.0000 / 1.0000 / 1.0000 |
| Mixtral | post:moe-architecture-deep-dive-20260520 | post:moe-architecture-deep-dive-20260520<br>post:moe-architecture-deep-dive-20260606 | 2 | 1.0000 / 1.0000 / 1.0000 |
| 结构化切块真的让 RAG 更准吗？用安慰剂实验拆解四种检索机制 | post:daily-learn-2026-10-09 | post:daily-learn-2026-10-09 | 1 | 1.0000 / 1.0000 / 1.0000 |
| 安慰剂实验 | post:daily-learn-2026-10-09 | post:daily-learn-2026-10-09 | 1 | 1.0000 / 1.0000 / 1.0000 |
| KNOWLEDGE-GRAPH | post:ai-agent-memory-knowledge-graphs-20260531 | post:ai-agent-memory-knowledge-graphs-20260531 | 1 | 1.0000 / 1.0000 / 1.0000 |
| DEVELOPER TOOLS | post:ai-coding-agent-infra-20260525 | post:ai-coding-agent-infra-20260525<br>skill:aitour26-brk441-build-and-launch-ai-agents-fast-with-foundry-toolkit-for-vs-code | 2 | 1.0000 / 1.0000 / 1.0000 |
| obsidian-mcp-tools | skill:obsidian-mcp-tools | skill:obsidian-mcp-tools | 1 | 1.0000 / 1.0000 / 1.0000 |
| browser-tools-mcp | skill:browser-tools-mcp | skill:browser-tools-mcp | 1 | 1.0000 / 1.0000 / 1.0000 |
| scientific-agent-skills | skill:scientific-agent-skills | skill:scientific-agent-skills | 1 | 1.0000 / 1.0000 / 1.0000 |
| mcp-sequentialthinking-tools | skill:mcp-sequentialthinking-tools | skill:mcp-sequentialthinking-tools | 1 | 1.0000 / 1.0000 / 1.0000 |
| claudekit-skills | skill:claudekit-skills | skill:claudekit-skills | 1 | 1.0000 / 1.0000 / 1.0000 |
| Agent-Skills-for-Context-Engineering | skill:agent-skills-for-context-engineering | skill:agent-skills-for-context-engineering | 1 | 1.0000 / 1.0000 / 1.0000 |
| 田园风景 | gallery:2 | gallery:2 | 1 | 1.0000 / 1.0000 / 1.0000 |
| 一个无人的角落 | gallery:3 | gallery:3 | 1 | 1.0000 / 1.0000 / 1.0000 |
| 盛开的花海 | gallery:4 | gallery:4 | 1 | 1.0000 / 1.0000 / 1.0000 |
| 微小的发现 | gallery:5 | gallery:5 | 1 | 1.0000 / 1.0000 / 1.0000 |
| 独钓寒江雪 | gallery:9 | gallery:9 | 1 | 1.0000 / 1.0000 / 1.0000 |
| 不存在的M06专属词20261010 | 无标注 | 零结果 | 0 | — / — / — |
| % | 无标注 | post:claude-code-opus5-automode-20260831<br>post:deepseek-dspark-speculative-decoding-20260704<br>post:ai-weekly-20260703 | 66 | — / — / — |
| _ | 无标注 | skill:dify-plugin-tools-mcp-sse<br>skill:ai-agent-llm-tools-rag<br>post:gemini-temperature-deprecated-20260723 | 79 | — / — / — |
| &lt;p> | 无标注 | post:ai-weekly-20260910<br>post:flt-lean-prove2me-20260906<br>post:ai-weekly-20260904 | 97 | — / — / — |
| 雪 | 无标注 | gallery:9 | 1 | — / — / — |
| \ | 无标注 | post:daily-learn-2026-10-09<br>post:deepseek-v4-flash-vision-20260822<br>skill:obsidian-mcp-tools | 6 | — / — / — |

生产 Neon READ ONLY 的实际 SQL EXPLAIN (ANALYZE, BUFFERS)：

| 输入 | 规划 ms | 执行 ms | Shared hit/read | 结果数 |
| --- | ---: | ---: | --- | ---: |
| RAG | .450 | 9.932 | 459 / 0 | 42 |
| 字面 % | .457 | 10.837 | 497 / 0 | 66 |
| pgvector | .540 | 8.414 | 379 / 0 | 1 |

每种表读取一次（posts 104、skills 49、gallery 5），users 5。matched 是 MATERIALIZED 中间结果，页面/统计两个 CTE Scan 复用它，并非两次重读三张表全文；只有 LIMIT 20 的 page_rows 变为 JSON。正文条件和评分仍可能多次检查/解 TOAST，当前约 10ms 不足以证明索引收益；Filtered 查询为保持全局 Facet 扫描三类是有目的的。执行计划和完整表行数仅描述此次快照与暖缓冲，read=0 不代表无成本。

% 66、_ 79、&lt;p&gt; 97 命中不等于通配符注入，既有参数化及字面转义测试通过。前两个有实际数字/代码含义，&lt;p&gt; 大多是 HTML 噪声，雪仅命中 1 张画廊；不统一禁止单字或删所有标点，以免丢失合法查找。将来可先对纯 HTML 标记/URL 的匹配做独立标注对照；清洗搜索字段须保留代码查询能力与原正文。

基线保护 Preview dpl_8ttqqjmq2H5aDPfxh23pYVFFuP95 / b2711504ece8167dbf998b60ace14d769406963f：2026-10-10T02:19:57.356Z Chrome 154，通过用户当前代理的同源 fetch 开始到 JSON parse，102 次测量，失败 0。首次测量 565.9ms（单样本，无有意义的 P95）；顺序 41 次 p50/p95/p99=497.1/818.9/848.3ms；2/5/10 并发各 20 次 p50/p95=498.2/1219.9、586.2/2579.6、811.7/2163.5ms。总体 p50/p95/p99=586.2/2103.7/2579.6ms。整体 <800ms 候选目标未达成，不能把局部数据库 10ms 当成通过，也不据此盲目加生产索引。

带计时头的 iad1 候选 b2ea5dae3ca5c3e9eef3da6e8263a0bbae596b91 / dpl_4jVRLhCxAnB8ewkrD5NobxnKn6e2，2026-10-10T02:27:55.006Z：102 搜索 + 20 空查询全部成功；41 条查询的结果数/前三候选与冻结快照完全一致。总体客户端 p50/p95/p99=534.4/2177.9/2470.9ms；Server-Timing p50/p95=257.0/918.1ms。顺序 p50/p95=487.7/740.0ms；2/5/10 并发各 20 次 p95=1092.7/2470.9/2197.6ms。空查询客户端 p50/p95=259.0/511.7ms、服务端 0/.1ms。首次客户端样本 626.3ms，不代表数据库冷启动。

实际 Neon aws-ap-southeast-1 与 Vercel 搜索函数 iad1 跨区域，而数据库执行约 10ms。按 [Vercel 单函数地域配置](https://vercel.com/docs/functions/configuring-functions/region) 仅在 vercel.json 将 app/api/search/route.ts 指向 sin1，其他函数保留项目默认地域；未改变项目设置、计划、Alias 或数据库。保护 Preview af0c946739a2208cf9c32155260fe9ad45dc7a49 / dpl_5pZybB11eEvN33oENhMjfwx13K3H READY、Actions 38017955214 全通过。部署顶层 regions 仍报告 iad1，实际搜索响应 x-vercel-id 为 cle1::sin1::…，确认单路由覆盖生效。

同一 Chrome/代理/查询集，sin1 于 2026-10-10T02:46:19.236Z：102 搜索 + 20 空查询全部成功，整体客户端 p50/p95/p99=705.7/1176.8/1562.3ms，Server-Timing p50/p95=17.9/65.6ms；顺序客户端 p50/p95=502.8/772.6ms（服务端 14.5/24.3ms）。2/5/10 并发各 20 次客户端 p95=903.9/1562.3/1176.7ms，服务端 p95=31.8/64.0/98.9ms。空查询客户端 p50/p95=520.2/604.7ms、服务端 0/.1ms。客户端 p50 未改善，空查询网络控制也更慢；采样非随机同期 A/B，不把全部差异归因地域或宣称稳定提升。数据库地域靠近使本次服务端延迟明显下降，保留这项有限配置与计时头；保护 Preview error/fatal 聚合为空。

自然冷启动：Neon API 先确认 idle/suspended_at=02:36:31Z，再用正式域名静态 robots.txt 启动新浏览器（不先调用 SQL）；02:42:00.921Z 首次 pgvector 搜索 2873.3ms，随后 487.4/659.7ms，均 200、同一候选。之后 API 记录 active/started_at=02:42:00Z，与首请求时间一致。此为生产 b63874d 的单个自然 compute 冷样本（iad1、无计时头），不是 sin1 冷启动分位数；没有停机、强制挂起或清缓存。原 retained-browser 进程因非 tty stdin 已关闭未能触发，未计为样本。

整体客户端 P95 <800ms 仍未通过，冷启动仅一组，独立人工相关性复核也未取得；M06-A 提交可复跑基准与实测优化，M06-B 持续保留验收缺口。代理路径/客户端传输占比需后续多位置测量，不能通过改统计范围、丢弃慢请求或加索引假装达标；可以推进不依赖它的本地学习进度。

OFFSET 在同一快照顺序稳定，但两次请求之间若发布/删除/排序字段更新，可重复或跳项；不保证并发写下跨页快照。当前 158 个候选优先保留简单分页，未来在基准证明深页或大量数据瓶颈后再评估 cursor。无生产 DDL/DML、索引、密钥、调度或保护变更，也不引入第四种内容来源。

复跑：先以一条只读 SELECT 导出相同公开字段和 snapshot_at（posts 仅 published=true；skills、gallery_images 全部），按新快照审阅并更新标注。原始正文和报告放在 Git 外；不载入 .env 或生产 DSN。

```powershell
npx tsx scripts/search-replay.ts D:/download/search-v2-validation/m06-snapshot.json D:/download/search-v2-validation/m06-replay-current.json
# 基线 worktree 必须已 npm ci；指定其实际同一 SQL 源文件
npx tsx scripts/search-replay.ts D:/download/search-v2-validation/m06-snapshot.json D:/download/search-v2-validation/m06-replay-baseline.json D:/download/worktrees/shengzongPost-m05/lib/db-search.ts
```

脚本只向自建内存 PGlite 种子写入，运行查询强制 READ ONLY；fetch 校验 api.invalid 后在内存执行，拒绝真实网络。输出路径不得覆盖输入/SQL 源文件。四个指标测试用手算反例验证折扣、晚于第 10 名、空标注、重复候选和 nearest-rank 百分位。外部浏览器采样脚本 m06-preview-perf.cjs 与原始报告/执行计划在 D:/download/search-v2-validation；授权 URL/凭据不进入报告。
