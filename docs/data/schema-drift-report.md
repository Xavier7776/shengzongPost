# M11 schema 漂移报告

2026-10-10。仅比较仓库 SQL 与生产 Neon public 元数据；无 DDL/DML、无自动补表或重编号。结构快照时间05:13Z，244列、71约束、85索引、27表。完整元数据见 [schema-inventory.json](m11/schema-inventory.json)。

## 基线与库边界

- 仓库共有35个SQL文件。`schema.sql`的21张表全部属于OnlyUs/Supabase，未与本次Neon27表重名。它依赖Supabase auth/extensions/角色/RLS，不是Neon初始化基线。
- 032–043也是OnlyUs/Supabase增量，缺少这些表不算博客Neon漂移。两个数据库必须分开建基线和迁移清单，不能只按目录排序运行。
- `migration.sql`直接ALTER posts/projects，_002–_009依赖已有users/posts；010–031缺失。博客核心表在现存Neon增量文件中未找到CREATE语句的有：`bookmarks`, `comment_likes`, `comments`, `follows`, `gallery_images`, `hero_slides`, `post_edit_requests`, `post_images`, `post_reactions`, `posts`, `research_reports`, `users`。这是文本盘点，不是SQL重放或缺失表证明。
- 当前生产表实际存在；不能凭未找到CREATE自动建表。旧序列不具备空库可复现性，`scripts/ci/schema.sql`只是构建用合成简化fixture。
- 054 learn_editions与055 auth_rate_limits的关键字段、主键/唯一/外键/索引均在生产存在。056 learn_publish_runs为候选，生产没有该表，是已知未获批状态，不能自动应用或从文章存在性回填审计。

## 文件归属与CREATE语句

| 文件 | 归属/状态 | 文本识别的CREATE TABLE |
| --- | --- | --- |
| 032_missing_tables_and_realtime.sql | OnlyUs/Supabase | virtual_pets, pet_actions |
| 033_drawing_wrong_guesses_and_skip.sql | OnlyUs/Supabase | — |
| 034_pet_custom_sprites.sql | OnlyUs/Supabase | — |
| 035_drawing_hint_requested.sql | OnlyUs/Supabase | — |
| 036_moods_rls_policy.sql | OnlyUs/Supabase | — |
| 037_daily_questions_bulk.sql | OnlyUs/Supabase | — |
| 038_calendar_events_fix.sql | OnlyUs/Supabase | calendar_events |
| 039_new_features_tables.sql | OnlyUs/Supabase | quiz_questions, quiz_sessions, quiz_scores, countdowns, bucket_list_items, medals, user_medals, care_messages, push_subscriptions |
| 040_more_quiz_and_medals.sql | OnlyUs/Supabase | — |
| 041_quiz_sessions_user_ids.sql | OnlyUs/Supabase | — |
| 042_quiz_more_questions.sql | OnlyUs/Supabase | — |
| 043_movie_records.sql | OnlyUs/Supabase | movie_records |
| 044_skills_table.sql | 博客Neon历史增量 | skills |
| 045_add_chinese_summary.sql | 博客Neon历史增量 | — |
| 046_github_trending.sql | 博客Neon历史增量 | github_trending |
| 047_fix_github_trending_crawled_date.sql | 博客Neon历史增量 | — |
| 048_projects_table.sql | 博客Neon历史增量 | projects |
| 049_add_projects_content.sql | 博客Neon历史增量 | — |
| 050_notifications_table.sql | 博客Neon历史增量 | notifications |
| 051_visitor_tracking.sql | 博客Neon历史增量 | visitor_tracking |
| 052_gallery_enhance.sql | 博客Neon历史增量 | — |
| 053_newsletter.sql | 博客Neon历史增量 | newsletter_subscribers |
| 054_learn_editions.sql | 博客Neon历史增量 | learn_editions |
| 055_auth_rate_limits.sql | 博客Neon历史增量 | auth_rate_limits |
| 056_learn_publish_runs.sql | Neon候选，未应用 | learn_publish_runs |
| migration.sql | 博客Neon历史增量 | post_attachments |
| migration_002_enhance_user_profile.sql | 博客Neon历史增量 | — |
| migration_003_points_system.sql | 博客Neon历史增量 | point_transactions, point_read_log |
| migration_004_avatar_frames.sql | 博客Neon历史增量 | avatar_frames, user_frames |
| migration_005_points_check.sql | 博客Neon历史增量 | — |
| migration_006_cursor_effects.sql | 博客Neon历史增量 | cursor_effects, user_cursor_effects |
| migration_007_cursor_effects_expand.sql | 博客Neon历史增量 | — |
| migration_008_cursor_render_type.sql | 博客Neon历史增量 | — |
| migration_009_cursor_poster_url.sql | 博客Neon历史增量 | — |
| schema.sql | OnlyUs/Supabase | calendar_events, counter_requests, couple_info, daily_counters, daily_questions, diaries, drawing_games, expenses, gomoku_games, gomoku_stats, goodnights, letters, memories, moods, morning_checkins, photos, pings, profiles, question_answers, travel_pins, wishlist |

另外发现neon_auth9张托管表；其不在本public库存内，完整加密archive包含它们且恢复后单独核对一致。真实public三表启用历史RLS，详见查询/权限报告；不能笼统宣称无RLS或依赖宽松true策略授权。

## 当前数据域、键与索引

| 表 | 列数 | 约束 | 索引数 | pg_stat估计行/总关系字节 |
| --- | ---: | --- | ---: | --- |
| auth_rate_limits | 4 | CHECK ((hit_count >= 0)); PRIMARY KEY (scope, subject_hash); CHECK (((length(scope) >= 2) AND (length(scope) <= 48))) | 2 | 0 / 24576 |
| avatar_frames | 9 | UNIQUE (key); PRIMARY KEY (id) | 2 | 7 / 49152 |
| bookmarks | 4 | PRIMARY KEY (id); UNIQUE (post_slug, user_id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 3 | 2 / 65536 |
| comment_likes | 4 | FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE; UNIQUE (comment_id, user_id); PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 4 | 0 / 73728 |
| comments | 8 | FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE; PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 6 | 50 / 172032 |
| cursor_effects | 20 | CHECK (((render_type)::text = ANY ((ARRAY['sprite_sheet'::character varying, 'gif'::character varying])::text[]))); UNIQUE (key); PRIMARY KEY (id) | 2 | 24 / 49152 |
| follows | 4 | CHECK ((follower_id <> following_id)); FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE; UNIQUE (follower_id, following_id); FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE; PRIMARY KEY (id) | 4 | 4 / 73728 |
| gallery_images | 13 | PRIMARY KEY (id) | 2 | 5 / 57344 |
| github_trending | 17 | PRIMARY KEY (id) | 6 | 989 / 1024000 |
| hero_slides | 7 | PRIMARY KEY (id) | 1 | 2 / 32768 |
| learn_editions | 6 | UNIQUE (edition_date); PRIMARY KEY (post_id); FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE; CHECK ((status = 'published'::text)); CHECK ((topic = ANY (ARRAY['agent'::text, 'rag'::text, 'engineering'::text, 'multimodal'::text]))) | 3 | 1 / 114688 |
| newsletter_subscribers | 2 | PRIMARY KEY (email) | 1 | 1 / 32768 |
| notifications | 8 | PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 3 | 0 / 32768 |
| point_read_log | 3 | PRIMARY KEY (user_id, post_slug) | 1 | 23 / 32768 |
| point_transactions | 6 | PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 2 | 94 / 81920 |
| post_attachments | 9 | PRIMARY KEY (id) | 1 | 0 / 16384 |
| post_edit_requests | 12 | PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 4 | 2 / 98304 |
| post_images | 9 | PRIMARY KEY (id); FOREIGN KEY (post_slug) REFERENCES posts(slug) ON UPDATE CASCADE ON DELETE SET NULL; UNIQUE (public_id); FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL | 4 | 11 / 81920 |
| post_reactions | 5 | PRIMARY KEY (id); UNIQUE (post_slug, user_id); CHECK ((type = ANY (ARRAY['like'::text, 'dislike'::text]))); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 3 | 5 / 65536 |
| posts | 13 | FOREIGN KEY (author_id) REFERENCES users(id); PRIMARY KEY (id); UNIQUE (slug) | 4 | 115 / 851968 |
| projects | 18 | PRIMARY KEY (id); UNIQUE (slug) | 4 | 2 / 262144 |
| research_reports | 9 | PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 3 | 2 / 163840 |
| skills | 14 | PRIMARY KEY (id); UNIQUE (slug); UNIQUE (source_url) | 7 | 49 / 557056 |
| user_cursor_effects | 4 | FOREIGN KEY (effect_id) REFERENCES cursor_effects(id) ON DELETE CASCADE; PRIMARY KEY (id); UNIQUE (user_id, effect_id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE | 3 | 10 / 57344 |
| user_frames | 4 | FOREIGN KEY (frame_id) REFERENCES avatar_frames(id) ON DELETE CASCADE; PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; UNIQUE (user_id, frame_id) | 3 | 3 / 57344 |
| users | 22 | UNIQUE (email); FOREIGN KEY (equipped_cursor_effect) REFERENCES cursor_effects(id) ON DELETE SET NULL; FOREIGN KEY (equipped_frame) REFERENCES avatar_frames(id) ON DELETE SET NULL; PRIMARY KEY (id) | 2 | 5 / 49152 |
| visitor_tracking | 10 | PRIMARY KEY (id) | 5 | 287 / 229376 |

行数来自pg_stat估计，不能替代COUNT(*)。存储含索引/TOAST，不是备份文件大小。只有元数据，不导出密码、邮箱、验证码或会话。真实关键COUNT/关系与恢复哈希在恢复报告中核对。

## 修复路径与生产边界

1. 已在授权导出范围内用Windows pg_dump17.11取得[真实public schema-only基线](neon-public-baseline.sql)，不包含数据、ownership/ACL或托管neon_auth。public由template0提供，唯一删除的是dump中的重复CREATE SCHEMA public，不用IF NOT EXISTS掩盖已有表。新隔离库m11_schema_baseline重建通过：244列/85索引逐字段一致，71约束名称/类型一致；70定义相同，一处枚举CHECK仅array-cast重解析文本不同，合法/非法/空/NULL真值一致。不能通过旧apply-migration脚本或在生产应用基线。JSON是库存，不是可执行SQL；OnlyUs/Supabase基线与托管认证服务权限独立处理。
2. 基线之后才建立有执行记录的线性Neon增量，不重跑历史SQL，不用IF NOT EXISTS掩盖字段/约束不同；不覆盖OnlyUs SQL或旧历史。
3. 新FK/唯一/索引需要只读候选计数、重复/孤儿判断、锁/写放大估算、迁移回滚和单独审批。未关联编辑器图片不自动视为垃圾。
4. 056审批维持M03边界，055不重复执行。生产会话/密钥/权限/删除均未改变。
