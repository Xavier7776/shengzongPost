# 6 项优化任务实施计划

## 任务清单
1. 标签云（博客页）
2. 鼠标效果装备后全局跟随不生效（CursorFollower 不支持 poster_url）
3. Skills 爬虫改为每 3 天定时任务
4. 移动端优化检查
5. 页脚搜索按钮链接到 /search
6. Gallery 入口整合到 Projects 页面（占一整行）

---

## 任务 1：标签云

**现状**：`app/blog/BlogList.tsx` 已有标签筛选（顶部 8 个热门标签按钮），但没有视觉化的"标签云"区块。

**方案**：在博客列表页搜索框下方、现有标签筛选上方，新增一个"标签云"区块，按标签文章数量决定字号大小（类似 WordPress 标签云）。

**文件**：`app/blog/BlogList.tsx`
- 在 `allTags` 计算时保留 count
- 新增 TagCloud 区块，字号根据 count 映射到 `text-xs/sm/base/lg`
- 点击标签跳转到筛选

---

## 任务 2：鼠标效果装备后全局跟随不生效

**根因**：`CursorFollower` 的 `EquippedEffect` 接口和 `FollowerLayer` 渲染逻辑不支持 `poster_url`。
- `getUserEquippedCursorEffect` 返回 `ce.*`（含 `poster_url`）
- 但 `EquippedEffect` 接口没有 `poster_url` 字段
- `FollowerLayer` 只处理三种情况：GIF（`render_type === 'gif'`）、SpriteSheet（`hasSprite`）、Emoji 兜底
- 如果效果的 `sprite_url` 为空但 `poster_url` 有值，会走到 EmojiFallback，显示 emoji 而非 poster 图

**修复方案**：
1. `EquippedEffect` 接口添加 `poster_url: string | null`
2. `FollowerLayer` 新增第四种渲染分支：`poster_url` 模式（静态 `<img>`，带 bob 动画）
3. 优先级：GIF > SpriteSheet > poster_url > emoji

**文件**：`components/ui/CursorFollower.tsx`

---

## 任务 3：Skills 爬虫改为每 3 天定时任务

**现状**：`scripts/crawl-skills.ts` 是手动运行脚本，`MAX_ITEMS = 3`（每天 3 条）。

**方案**：
1. 调整 `MAX_ITEMS` 为更合理的值（每 3 天爬取，每次 9 条，保持总量一致）
2. 创建 Schedule 定时任务，每 3 天 10:00 运行
3. 无需更改数据库（skills 表已有 upsert 去重逻辑）

**文件**：
- `scripts/crawl-skills.ts` — 调整 `MAX_ITEMS = 9`
- Schedule 工具 — 创建定时任务

---

## 任务 4：移动端优化检查

**现状检查**：
- 导航栏：已有抽屉菜单 + 搜索入口（上次已加）
- 首页：`grid-cols-1 md:grid-cols-2` 响应式
- 博客列表：`grid-cols-1 md:grid-cols-2` 响应式
- Skills/Trending：响应式
- 搜索页：`max-w-[960px]` 响应式

**需优化项**：
1. 搜索页结果卡片：移动端缩略图 64px 偏大，调整为 48px
2. TrendingStats KPI 卡片：移动端 2 列，间距收紧
3. Projects 页面：`lg:grid-cols-3` 在平板端会变成单列，统计卡片 `sm:grid-cols-4` 在小屏会挤

**文件**：
- `app/search/SearchClient.tsx` — 缩略图响应式
- `app/projects/page.tsx` — 统计卡片响应式

---

## 任务 5：页脚搜索按钮链接到 /search

**现状**：`components/layout/Footer.tsx` 第 26-33 行，搜索按钮链接到 `https://www.bing.com`。

**修复**：改为 `<Link href="/search">`。

**文件**：`components/layout/Footer.tsx`

---

## 任务 6：Gallery 入口整合到 Projects 页面

**现状**：
- 导航栏有独立的 Gallery 入口
- Projects 页面（`/projects`）是"关于我"页面，含统计 + 最近文章 + 联系表单
- Gallery 页面（`/gallery`）是独立画廊

**方案**：
1. 在 Projects 页面"最近文章"区块下方、联系表单上方，新增一个"视觉存档"全宽入口卡片
2. 入口卡片设计：左侧大图预览（取 gallery 前 4 张缩略图拼接）+ 右侧标题描述 + "进入画廊"按钮
3. 从导航栏移除 Gallery 独立入口（NAV_ITEMS 删除 gallery）
4. 保留 `/gallery` 路由可访问

**文件**：
- `app/projects/page.tsx` — 新增 Gallery 入口区块
- `components/layout/Navbar.tsx` — NAV_ITEMS 移除 gallery

---

## 验证步骤
1. `npx tsc --noEmit` — 0 错误
2. `/blog` — 标签云显示
3. `/shop` — 购买装备鼠标效果后全局跟随立即生效
4. `/projects` — Gallery 入口显示
5. 导航栏无 Gallery 入口
6. 页脚搜索按钮跳转 `/search`
7. 移动端各页面布局正常
