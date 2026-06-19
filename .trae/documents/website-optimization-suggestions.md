# 网站优化与新功能建议清单

> 基于对 arc-portfolio (MindStack) 项目的全面调研，整理出以下优化与新功能建议。
> 项目现状：Next.js 14.2.3 + React 18 + Tailwind 3.4.1 + Neon PostgreSQL + Supabase + NextAuth
> 已有功能：博客、Skills、GitHub Trending、Gallery、Projects、Shop、积分系统、OnlyUs 双人空间、Admin 后台

---

## 一、性能与体验优化（高优先级）

### 1.1 首页性能优化
**问题**：`app/page.tsx` 使用 `dynamic = 'force-dynamic'` + `revalidate = 0`，每次访问都查数据库，首页是流量入口，性能损失大。

**建议**：
- 改为 ISR：`export const revalidate = 3600`（1 小时重新生成）
- 首页 4 篇文章 + 4 个 Skills 不需要实时性
- 首屏加载速度可提升 50%+

**文件**：`app/page.tsx`

### 1.2 图片懒加载与占位
**问题**：BlogCard、SkillCard、TrendingCard 中的图片没有统一的懒加载策略，Trending 页面 30 张头像同时加载。

**建议**：
- 所有 `<img>` 统一改用 Next.js `<Image>` 组件（已有但未全面使用）
- 添加 `loading="lazy"` + LQIP（低质量占位图）
- TrendingCard 头像用 `priority={false}` + `sizes="32px"`

**文件**：`components/sections/BlogCard.tsx`、`SkillCard.tsx`、`TrendingCard.tsx`

### 1.3 API 缓存策略
**问题**：`/api/trending` 已用 ISR（`revalidate = 3600`），但 `/api/skills`、`/api/posts` 等都是实时查询。

**建议**：
- `/api/skills` 列表接口加 `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`
- `/api/posts/public` 同上
- 详情页接口保持实时

---

## 二、SEO 与可发现性（高优先级）

### 2.1 结构化数据 (JSON-LD)
**问题**：博客详情页、Skill 详情页缺少结构化数据，搜索引擎无法理解内容类型。

**建议**：
- 博客详情页添加 `Article` schema（headline、author、datePublished、image）
- Skill 详情页添加 `SoftwareApplication` schema
- Trending 页添加 `ItemList` schema

**文件**：`app/blog/[slug]/page.tsx`、`app/skills/[slug]/page.tsx`

### 2.2 Open Graph 与 Twitter Card
**问题**：未确认是否有完整的 OG 图自动生成。

**建议**：
- 为每篇文章自动生成 OG 图（基于标题 + 封面）
- 使用 `@vercel/og` 或 Cloudinary 文字叠加
- 添加 `twitter:card` meta

### 2.3 robots.txt 与 sitemap 完善
**问题**：已有 `app/sitemap.ts`，但未确认是否包含 Skills、Trending。

**建议**：
- sitemap 加入 `/skills`、`/skills/[slug]`、`/skills?view=trending`
- 添加 `robots.txt` 屏蔽 `/admin/*`、`/dashboard/*`、`/onlyus/*`、`/api/*`

---

## 三、新功能建议

### 3.1 全站搜索（高价值）
**现状**：Skills 有搜索，但博客、Gallery、Projects 都没有全局搜索。

**建议**：添加 `/search` 页面，支持搜索：
- 博客文章（标题、标签、内容）
- Skills（名称、描述、标签）
- Gallery 图片（标题、分类）
- Projects

**实现**：
- 简单方案：PostgreSQL `ILIKE` + UNION 查询
- 进阶方案：PostgreSQL `tsvector` 全文检索 + GIN 索引
- UI：导航栏添加搜索图标，`Cmd/Ctrl + K` 唤起搜索框

**新增文件**：`app/search/page.tsx`、`app/api/search/route.ts`、`components/ui/SearchDialog.tsx`

### 3.2 标签云与标签页
**现状**：博客有 tags 字段但没有标签聚合页。

**建议**：
- `/blog/tag/[tag]` 页面展示同一标签的文章
- 首页或博客页添加热门标签云
- Skills 页同样添加标签筛选

**新增文件**：`app/blog/tag/[tag]/page.tsx`

### 3.3 RSS 订阅
**现状**：无 RSS feed。

**建议**：
- 添加 `/feed.xml` 路由，输出博客 RSS 2.0
- 支持 Skills 的独立 feed
- Footer 添加 RSS 链接

**新增文件**：`app/feed.xml/route.ts`

### 3.4 文章目录与阅读进度增强
**现状**：已有 `TableOfContents`、`ReadingProgressBar`、`ReadingHistory`。

**建议**：
- 阅读进度条添加"预计剩余阅读时间"
- 目录支持高亮当前章节（IntersectionObserver）
- 添加"回到上次阅读位置"提示

### 3.5 数据可视化仪表盘（Stats 页）
**现状**：Trending 有数据概览，但全站没有统一的数据展示页。

**建议**：添加 `/stats` 页面，展示：
- 博客统计（总文章数、总浏览量、总点赞数、评论数趋势）
- Skills 统计（分类分布、来源分布、Star 分布）
- Trending 历史（语言趋势变化、Stars 增长曲线）
- 用户统计（注册趋势、活跃用户）

**新增文件**：`app/stats/page.tsx`、`app/api/stats/route.ts`
**复用**：TrendingStats 组件的 recharts 模式

### 3.6 通知中心
**现状**：有 `PointsToast`、Web Push，但没有统一的通知中心。

**建议**：
- 导航栏添加通知铃铛（带未读红点）
- 通知类型：评论回复、文章点赞、关注、积分变动、Trending 更新
- `/notifications` 页面查看历史通知
- 下拉显示最近 5 条

**新增文件**：`app/api/notifications/route.ts`、`components/layout/NotificationBell.tsx`、`app/notifications/page.tsx`
**新增表**：`notifications`

### 3.7 暗色模式完善
**现状**：有 `DarkNavbar`、`DarkFooter`，但不是完整的暗色模式切换。

**建议**：
- 添加主题切换按钮（导航栏）
- 用 `next-themes` 实现 SSR 安全的主题切换
- 所有页面适配暗色（Tailwind `dark:` 前缀）
- 持久化用户偏好到 localStorage + users 表

**新增依赖**：`next-themes`

### 3.8 PWA 支持
**现状**：无 PWA。

**建议**：
- 添加 `manifest.json`
- Service Worker 缓存静态资源
- 支持添加到主屏幕
- 离线访问已缓存的文章

**新增文件**：`public/manifest.json`、`app/sw.ts`

---

## 四、内容与交互优化

### 4.1 博客列表筛选增强
**现状**：`/blog` 只有列表，无筛选。

**建议**：
- 添加标签筛选（多选）
- 添加排序（最新、最热、最多评论）
- 添加分类 Tab（技术、生活、随笔等）

**文件**：`app/blog/BlogList.tsx`

### 4.2 文章相关推荐
**现状**：博客详情页有上下篇导航，但无相关推荐。

**建议**：
- 基于标签相似度推荐 3 篇相关文章
- 详情页底部"相关文章"区块

**文件**：`app/blog/[slug]/page.tsx`、`lib/db.ts`（新增 `getRelatedPosts`）

### 4.3 评论系统增强
**现状**：支持多级回复 + 点赞 + AI 评论。

**建议**：
- 评论支持 Markdown
- 评论支持 @ 提及用户
- 添加表情反应（👍❤️😄🎉，类似 GitHub）
- 评论排序（最新、最热）

### 4.4 Projects 页面增强
**现状**：`/projects` 是静态展示。

**建议**：
- 从 GitHub API 自动拉取仓库信息（stars、forks、最近更新）
- 添加项目分类与筛选
- 添加项目状态标签（进行中、已归档、维护中）

---

## 五、移动端体验

### 5.1 移动端导航优化
**现状**：已有抽屉菜单。

**建议**：
- 添加底部 Tab Bar（首页、博客、Skills、我的）
- 移动端搜索入口
- 下拉刷新支持

### 5.2 触屏手势
**建议**：
- 文章页左右滑动切换上下篇
- 图片查看器支持双指缩放
- Gallery 支持滑动浏览

---

## 六、安全与运维

### 6.1 API 限流
**现状**：无 API 限流。

**建议**：
- 使用 Upstash Redis + `@upstash/ratelimit`
- 登录、注册、评论接口限流（如 10 次/分钟）
- 防止垃圾评论和暴力破解

### 6.2 日志与监控
**现状**：无统一日志。

**建议**：
- API 错误日志写入数据库或 Sentry
- 关键操作审计日志（登录、购买、装备）
- 添加健康检查接口 `/api/health`

### 6.3 数据库索引优化
**建议**：
- 检查 `posts.created_at`、`posts.tags`、`comments.post_slug` 是否有索引
- Skills 的 `category`、`stars` 字段加索引
- Trending 的 `(period, crawled_date, rank)` 复合索引

---

## 七、OnlyUs 子应用优化（可选）

### 7.1 OnlyUs 入口优化
**建议**：在主导航或用户菜单添加 OnlyUs 快捷入口（当前似乎只能通过 URL 访问）。

### 7.2 OnlyUs 数据同步
**建议**：OnlyUs 的记账、心愿单等数据支持导出（CSV/JSON）。

---

## 优先级建议

| 优先级 | 功能 | 价值 | 复杂度 |
|--------|------|------|--------|
| P0 | 3.1 全站搜索 | 极高 | 中 |
| P0 | 1.1 首页 ISR | 高 | 低 |
| P0 | 2.1 结构化数据 | 高 | 低 |
| P1 | 3.5 Stats 仪表盘 | 高 | 中 |
| P1 | 3.3 RSS 订阅 | 中 | 低 |
| P1 | 4.2 相关推荐 | 中 | 低 |
| P1 | 3.6 通知中心 | 高 | 高 |
| P2 | 3.7 暗色模式 | 中 | 高 |
| P2 | 3.2 标签云 | 中 | 低 |
| P2 | 4.1 博客筛选 | 中 | 中 |
| P2 | 6.1 API 限流 | 中 | 中 |
| P3 | 3.8 PWA | 中 | 高 |
| P3 | 5.2 触屏手势 | 低 | 中 |

---

## 实施建议

1. **先做 P0**：全站搜索 + 首页 ISR + 结构化数据，投入产出比最高
2. **再做 P1**：Stats 仪表盘 + RSS + 相关推荐，提升内容可发现性
3. **按需做 P2/P3**：根据用户反馈和实际需求决定

每个功能都可以独立实施，互不依赖。建议一次只做一个功能，做完验证后再做下一个。
