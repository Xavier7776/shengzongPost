# MindStack 博客 - Skills 页面开发

## 项目信息
- 框架：Next.js 16 + React 19 + Tailwind CSS 4
- 后端：Supabase (Neon PostgreSQL)
- 编辑器：Tiptap
- 路径：/e/chromeDownload/arc-portfolio
- Obsidian 记录：D:\obsidianWarehouse\XavierWarehouse

## 当前任务
实现 Skills 页面，展示从 GitHub 等网站爬取的最新 AI Agent Skills。

## 需求确认
1. **爬取频率**：每天一次，每天早上 10:00 开始爬取
2. **首批数据量**：30 条
3. **分类数量**：动态调整（初始 5 个分类：coding, research, creative, automation, productivity）
4. **详情页**：需要独立详情页

## 实施阶段

### Phase 1：数据库 + API（当前阶段）
1. 创建 Supabase `skills` 表
2. 实现 `/api/skills` 接口
3. 实现爬虫脚本（GitHub API）

### Phase 2：页面 + 组件
1. 创建 `/skills` 页面
2. 创建 `/skills/[slug]` 详情页
3. 实现 `SkillCard` 组件
4. 修改导航栏（Navbar.tsx）

### Phase 3：定时任务
1. 创建每日爬取定时任务（10:00 触发）
2. 写入 Obsidian 记录

### Phase 4：优化
1. 缓存策略（ISR）
2. 搜索功能

## 关键文件
- 导航栏：`components/layout/Navbar.tsx`
- 博客卡片：`components/sections/BlogCard.tsx`（可复用样式）
- 数据库：`lib/db.ts`（参考现有查询模式）
- API 路由：`app/api/`（参考现有接口）

## 技术要点
- GitHub API：使用 GITHUB_TOKEN 提升限额
- AI 分类：关键词匹配自动分类
- 数据去重：根据 source_url 去重
- 卡片复用：复用 Card3D 和 useScrollReveal

## 验收标准
1. ✅ 导航栏新增 Skills 入口
2. ✅ /skills 页面展示技能卡片列表
3. ✅ /skills/[slug] 详情页展示完整内容
4. ✅ 卡片支持筛选和排序
5. ✅ 每日 10:00 自动爬取 30 条新技能
6. ✅ 数据自动去重
7. ✅ AI 自动分类
8. ✅ 骨架屏加载效果
9. ✅ 响应式布局
10. ✅ 写入 Obsidian 记录
