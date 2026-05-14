# OnlyUs 完整功能与数据库规格文档

> 用于 App 端与 Web 端同步开发参考。最后更新：2026-05-14

---

## 一、技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Next.js 14 (App Router) |
| 状态管理 | Zustand + persist (localStorage) |
| 数据库 | Supabase (PostgreSQL) |
| 实时通信 | Supabase Realtime (postgres_changes) |
| 文件存储 | Supabase Storage (photos, pets buckets) |
| 推送通知 | Web Push API + Expo Push |
| 3D 渲染 | Three.js (Landing 页心形) |
| 样式方案 | 内联 style (无 Tailwind，OnlyUs 子应用独立) |

---

## 二、路由结构

```
/onlyus                          → Landing 页 (3D 心形 + 用户选择)
/onlyus/gate                     → 密码门禁页
/onlyus/home                     → 首页 Dashboard
/onlyus/mood                     → 心情 + 每日一题
/onlyus/letters                  → 信件 & 日记
/onlyus/timeline                 → 时间线 & 相册 & 心愿单
/onlyus/bucket-list              → 心愿清单
/onlyus/settings                 → 设置
/onlyus/tools                    → 小工具首页 (8 个工具卡片)
/onlyus/tools/roulette           → 决定转盘
/onlyus/tools/counter            → 实时计数器
/onlyus/tools/gomoku             → 五子棋
/onlyus/tools/expense            → 共同记账
/onlyus/tools/drawing            → 画画猜猜
/onlyus/tools/calendar           → 共享日历
/onlyus/tools/quiz               → 双人问答 / 默契挑战
/onlyus/tools/pet                → 虚拟宠物
```

---

## 三、功能模块详解

### 3.1 Landing 页 (`/onlyus`)

- 3D 心形水晶 (Three.js + HeartCrystal 组件)
- 粒子背景 (ParticleField)
- 两个用户选择按钮 (UserSelectButton)，点击后心形爆发动画
- 选择后写入 authStore.currentUserId，跳转 /onlyus/home

### 3.2 密码门禁 (`/onlyus/gate`)

- 输入密码验证 (server action: verifyPasscode)
- 错误时抖动动画
- 成功后跳转原始目标 URL

### 3.3 首页 Dashboard (`/onlyus/home`)

| 组件 | 功能 | 数据源 |
|---|---|---|
| DaysCounter | 在一起天数 | couple_info.anniversary_date |
| CountdownWidget | 倒数日 (下次见面/纪念日) | couple_info + countdowns 表 |
| MoodSummaryCard | 双方今日心情速览 | moods 表 |
| MorningCard | 早安打卡 + 连续天数 | morning_checkins 表 |
| WeatherCard | 双城天气对比 | profiles.city/lat/lon + Open-Meteo API |
| PingButton | 戳一戳 (实时通知) | pings 表 |
| HeartLineConnect | 心跳连线动画 | profiles 头像 |
| GoodnightCard | 晚安打卡 + 连续天数 | goodnights 表 |
| CareMessageToast | 关怀消息弹窗 | care_messages 表 |

- 时间问候语 (根据小时显示早上好/午安/下午好等)
- 显示当前时间
- 手机端单栏，桌面端 12 列网格

### 3.4 心情追踪 (`/onlyus/mood`)

- 12 种心情：happy, excited, calm, cozy, love, missing, meh, anxious, sad, angry, tired, sick
- 3D 轮播选择器 (EmojiSphere)
- 每日可记录一次心情 (upsert on user_id + mood_date)
- 可选附加文字和图片
- 实时订阅伴侣心情变化
- 7 天心情趋势图

**每日一题 (QuestionSection)：**
- 从 daily_questions 表取当天题目
- 双方独立盲答，看不到对方答案
- 两人都提交后实时揭晓对方答案
- 揭晓动画 (reveal-pop)
- 历史题目查看 (最近 10 天)

### 3.5 信件 & 日记 (`/onlyus/letters`)

**信件 (Letters)：**
- 定时发送情书
- 3D 信封 UI
- scheduled_at 到期后由 Edge Function deliver-letters 投递
- 查看待发送/已发送/已收到

**日记 (Diary)：**
- 三种可见性：private (仅自己)、shared (双方可见)、partner (仅对方可见)
- 支持语音附件 (voice_url)

### 3.6 时间线 & 相册 & 心愿单 (`/onlyus/timeline`)

**故事时间线 (Story Timeline)：**
- 视差滚动时间线
- 添加回忆 (title, description, happened_at, photo_urls)
- 照片以 JSONB 数组存储

**相册 (Album)：**
- 瀑布流照片墙
- 上传到 Supabase Storage `photos` bucket
- 灯箱查看大图

**心愿单 (Wishlist)：**
- 共同想做的事
- 标记完成 + 完成照片

### 3.7 心愿清单 (`/onlyus/bucket-list`)

- 分类：旅行、美食、冒险、学习、浪漫、其他
- 进度条 (0-100)
- 封面照片
- 完成庆祝动画
- 勋章集成 (bucket_first, bucket_complete_5)

### 3.8 设置 (`/onlyus/settings`)

- 个人信息：昵称、城市、经纬度 (天气用)
- 对方信息：只读展示
- 关系设置：在一起纪念日、下次见面日期
- 勋章与成就展示 (MedalGrid)
- 推送通知开关 (Web Push)
- 手机端切换用户按钮

### 3.9 小工具 (`/onlyus/tools/*`)

#### 决定转盘 (Roulette)
- 预设食物选项 (火锅、寿司、披萨等)
- 自定义选项管理 (最多 12 个)
- SVG 转盘 + 4 秒旋转动画

#### 实时计数器 (Counter)
- 例如 "亲亲次数"
- 实时同步 (subscribe to counters 表)
- 增减动画 + 连击倍数
- 创建/删除计数器

#### 五子棋 (Gomoku)
- 15×15 棋盘
- 黑白棋子轮流下
- 胜利检测 + 发光连线
- 实时同步 (subscribe to gomoku_games)
- 悔棋/认输请求

#### 共同记账 (Expense)
- 分类：交通、餐饮、礼物、住宿、娱乐、其他
- 月度视图 + 环形图分类占比
- 人均分摊对比
- 实时同步 (subscribe to expenses)

#### 画画猜猜 (Drawing)
- 一人画一人猜
- Canvas 画板 + 调色板 + 画笔粗细 + 橡皮
- 实时同步笔画数据
- 猜对揭晓 + 计分
- 多轮游戏

#### 共享日历 (Calendar)
- 月视图网格
- 自定义事件 (日期范围、颜色、备注)
- 中国节假日标注 (含农历)
- 选中日期事件 + 即将到来事件

#### 双人问答 (Quiz)
- **双人问答模式**：轮流答题，双方都答完自动揭晓，答对 +10 分
- **默契挑战模式**：60 秒倒计时，双方同时作答，倒计时结束揭晓
- Session 同步：先创建者建 session，后加入者 findOrJoinSession 加入同一 session
- 积分排行 + 历史记录
- 勋章集成 (quiz_first, quiz_perfect)

#### 虚拟宠物 (Pet)
- 选择类型：猫/狗/兔
- 喂食 (饥饿+20, 经验+5) + 玩耍 (快乐+15, 经验+8)
- 30 分钟冷却
- 时间衰减 (快乐/饥饿随时间下降)
- 升级系统
- 自定义精灵图上传
- 重命名

---

## 四、Zustand Stores 一览

| Store | 文件 | 持久化 | 实时订阅 | 关联表 |
|---|---|---|---|---|
| useOnlyUsAuthStore | authStore.ts | localStorage | - | profiles, couple_info |
| useLetterStore | letterStore.ts | localStorage | - | letters |
| useDiaryStore | diaryStore.ts | localStorage | - | diaries |
| useMemoryStore | timelineStores.ts | localStorage | - | memories |
| useAlbumStore | timelineStores.ts | localStorage | - | photos (Storage) |
| useWishlistStore | timelineStores.ts | localStorage | - | wishlist |
| useMoodStore | moodStore.ts | - | moods | moods |
| useBucketListStore | bucketListStore.ts | localStorage | - | bucket_list_items |
| useCountdownStore | countdownStore.ts | localStorage | - | countdowns |
| useCareStore | careStore.ts | - | care_messages | care_messages |
| useExpenseStore | gameStores.ts | - | expenses | expenses |
| useGomokuStore | gameStores.ts | - | gomoku_games | gomoku_games |
| useDrawingStore | gameStores.ts | - | drawing_games | drawing_games |
| useMedalStore | medalStore.ts | - | - | medals, user_medals |
| usePetStore | petStore.ts | localStorage | - | virtual_pets, pet_actions |
| usePushStore | pushStore.ts | - | - | push_subscriptions |
| useCalendarStore | utilStores.ts | localStorage | - | calendar_events |
| usePingStore | utilStores.ts | - | pings | pings |
| useGoodnightStore | utilStores.ts | - | goodnights | goodnights |
| useMorningStore | utilStores.ts | - | morning_checkins | morning_checkins |
| useQuestionStore | utilStores.ts | localStorage* | question_answers | daily_questions, question_answers |
| useQuizStore | quizStore.ts | - | quiz_sessions | quiz_questions, quiz_sessions, quiz_scores |

> *useQuestionStore 只持久化 myAnswer, partnerAnswer, history；todayQuestion 每次从数据库获取

---

## 五、数据库表完整列表 (28 张表)

### 5.1 核心表

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| profiles | 用户档案 | id, nickname, avatar_url, city, latitude, longitude, partner_id | PK: id |
| couple_info | 情侣关系 | id, user1_id, user2_id, anniversary_date, next_meetup_date, proposed_meetup_date | UNIQUE(user1_id, user2_id) |

### 5.2 内容表

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| letters | 定时信件 | sender_id, receiver_id, content, scheduled_at, delivered | - |
| diaries | 日记 | user_id, content, voice_url, visibility | CHECK visibility IN ('private','shared','partner') |
| memories | 时间线回忆 | couple_id, title, description, happened_at, photo_urls(JSONB) | - |
| photos | 相册照片 | couple_id, uploader_id, storage_path, caption | - |
| wishlist | 心愿单 | couple_id, title, completed, completed_photo_url | - |
| bucket_list_items | 心愿清单 | couple_id, title, description, category, progress(0-100), cover_photo_url | - |

### 5.3 心情 & 问答

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| moods | 每日心情 | user_id, mood_type, mood_date, mood_text, mood_image_url | UNIQUE(user_id, mood_date) |
| daily_questions | 每日题目 | question_text, date | UNIQUE(date) |
| question_answers | 题目回答 | question_id, user_id, answer | UNIQUE(question_id, user_id) |

### 5.4 打卡 & 互动

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| goodnights | 晚安打卡 | user_id, checkin_date | UNIQUE(user_id, checkin_date) |
| morning_checkins | 早安打卡 | user_id, checkin_date, checkin_time | UNIQUE(user_id, checkin_date) |
| pings | 戳一戳 | sender_id, receiver_id | - |
| care_messages | 关怀消息 | sender_id, receiver_id, message_type, message_text, read | - |

### 5.5 日历 & 计数

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| calendar_events | 共享日历 | couple_id, created_by, title, date, end_date, color, note | - |
| daily_counters | 每日计数器 | couple_id, label, count, counter_date | UNIQUE(couple_id, label, counter_date) |
| counter_requests | 计数器请求 | couple_id, label, status, created_by | - |
| countdowns | 自定义倒数日 | couple_id, title, target_date, emoji, created_by | - |

### 5.6 游戏表

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| gomoku_games | 五子棋 | couple_id, black_player, white_player, board(JSONB), current_turn, winner, win_line, status | - |
| gomoku_stats | 五子棋统计 | couple_id, user_id, wins, losses, draws | UNIQUE(couple_id, user_id) |
| drawing_games | 画画猜猜 | couple_id, drawer, guesser, word, strokes(JSONB), status, round, drawer_score, guesser_score | - |
| expenses | 共同记账 | couple_id, user_id, amount, category, note, expense_date | CHECK amount > 0; CHECK category IN ('交通','餐饮','礼物','住宿','娱乐','其他') |

### 5.7 问答游戏

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| quiz_questions | 题库 | question_text, question_type('open'/'choice'), options(JSONB), category | - |
| quiz_sessions | 游戏会话 | couple_id, question_id, mode('quiz'/'compatibility'), user1_id, user2_id, user1_answer, user2_answer, is_match, status | - |
| quiz_scores | 积分 | couple_id, user_id, total_score, total_matches, total_played | UNIQUE(couple_id, user_id) |

### 5.8 宠物

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| virtual_pets | 虚拟宠物 | couple_id, name, level, exp, happiness, hunger, pet_type, custom_sprites(JSONB), last_fed_at, last_played_at | - |
| pet_actions | 宠物操作记录 | pet_id, user_id, action_type, value | - |

### 5.9 成就 & 推送

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| medals | 勋章定义 | medal_key, title, description, emoji, category, threshold | UNIQUE(medal_key) |
| user_medals | 用户勋章 | user_id, couple_id, medal_id, unlocked_at | UNIQUE(user_id, medal_id) |
| push_subscriptions | 推送订阅 | user_id, endpoint, p256dh, auth | UNIQUE(user_id, endpoint) |

### 5.10 其他

| 表名 | 说明 | 关键列 | 约束 |
|---|---|---|---|
| travel_pins | 旅行地图标记 | couple_id, user_id, province_code, province_name, pin_type('visited'/'wishlist') | UNIQUE(couple_id, province_code) |

---

## 六、实时订阅清单 (19 张表启用 Realtime)

| 表名 | 客户端订阅 | 过滤条件 | 事件 |
|---|---|---|---|
| expenses | useExpenseStore | couple_id=eq.{id} | * |
| gomoku_games | useGomokuStore | id=eq.{id} | UPDATE |
| drawing_games | useDrawingStore | id=eq.{id} | UPDATE |
| moods | useMoodStore | user_id=eq.{partnerId} | * |
| pings | usePingStore | receiver_id=eq.{myId} | INSERT |
| goodnights | useGoodnightStore | user_id=eq.{partnerId} | INSERT |
| morning_checkins | useMorningStore | user_id=eq.{partnerId} | INSERT |
| question_answers | useQuestionStore | user_id=eq.{partnerId} | INSERT |
| care_messages | useCareStore | receiver_id=eq.{userId} | INSERT |
| quiz_sessions | useQuizStore | id=eq.{sessionId} | UPDATE |
| counter_requests | (页面内联) | couple_id=eq.{coupleId} | * |

其余表 (counter_requests, daily_counters, quiz_scores, virtual_pets, travel_pins, countdowns, bucket_list_items, user_medals, push_subscriptions) 已启用 Realtime 但客户端未主动订阅。

---

## 七、Supabase Edge Functions

| 函数名 | 触发方式 | 功能 |
|---|---|---|
| deliver-letters | 定时调用 | 投递到期信件，发送 Expo Push 通知 |
| generate-daily-question | 定时调用 | 生成每日题目 (优先 DeepSeek AI，兜底硬编码) |
| send-push | 手动调用 | 通用推送发送 (Expo Push API) |
| morning-goodnight-push | 定时调用 | 早安/晚安提醒推送 (Web Push) |
| send-care-push | 数据库触发器 | care_messages INSERT 时发送 Web Push |

---

## 八、Supabase Storage Buckets

| Bucket | 用途 | 关联表 |
|---|---|---|
| photos | 相册照片 | photos.storage_path |
| pets | 宠物自定义精灵图 | virtual_pets.custom_sprites |

---

## 九、勋章系统 (34 枚)

### 里程碑类 (milestone)
- first_meet (初次相遇), days_50 (半百之约), days_100 (百日之约), days_365 (一周年), days_999 (久久久)

### 成就类 (achievement)
- first_letter (第一封信), first_diary (第一篇日记), first_mood (初次记录心情), first_memory (第一条回忆), first_photo (第一张照片), first_goodnight (初次晚安), first_pet (宠物家长), first_drawing (小画家), quiz_first (初次问答), first_expense (账单新手), expense_10 (理财搭档), bucket_first (初次许愿), bucket_10 (心愿收集家), bucket_complete_10 (圆梦达人), both_morning (同步早安), both_goodnight (同步晚安), quiz_10 (问答达人), quiz_50 (灵魂伴侣), pet_level_5 (宠物达人), pet_level_10 (宠物大师)

### 连续类 (streak)
- streak_7_morning (连续7天早安), streak_7_goodnight (连续7天晚安), streak_30_morning (月度早安), streak_30_goodnight (月度晚安), streak_100_morning (百日早安), streak_100_goodnight (百日晚安)

### 默契类 (compatibility)
- quiz_perfect (连续5次默契)

---

## 十、App 端同步要点

### 10.1 共享数据库
App 和 Web 共用同一个 Supabase 项目，所有数据通过同一张表同步。

### 10.2 认证方式
Web 端使用简化版选择用户 (authStore.selectUser)，App 端应使用 Supabase Auth 正式认证。profiles 表的 id 字段是 UUID，两端需要保持一致。

### 10.3 实时同步
所有标注 Realtime 的表，App 端同样可以通过 Supabase Realtime SDK 订阅 postgres_changes 事件。

### 10.4 推送通知
- Web 端：Web Push API (push_subscriptions 表)
- App 端：Expo Push (profiles.push_token 字段)
- Edge Function send-push 同时支持两种

### 10.5 文件上传
相册和宠物精灵图使用 Supabase Storage，App 端可直接用 Supabase SDK 上传。

### 10.6 需要 App 端特别注意的
- Canvas 绘画 (drawing_games.strokes JSONB)：App 端需实现 Canvas 渲染
- 五子棋 (gomoku_games.board JSONB)：App 端需实现棋盘渲染
- 3D 心形 (Landing 页)：App 端可用 React Native Three.js 或简化为 2D 动画
- EmojiSphere (心情选择器)：App 端需实现 3D 轮播或改为平面选择
- 天气 API：App 端同样调用 Open-Meteo (免费无需 key)
