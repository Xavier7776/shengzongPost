# GitHub Trending 功能修复计划

## 摘要

GitHub Trending 功能的 9 个文件和 2 个修改点**已全部存在**，但功能不可用。根本原因是爬虫脚本 `scripts/crawl-trending.ts` 第 128 行有**语法错误**（反引号字符串未闭合），导致爬虫无法运行，数据库 `github_trending` 表为空，页面显示"暂无数据"。

## 现状分析

### 已就绪的部分（无需改动）
- `supabase/migrations/046_github_trending.sql` — 建表 SQL，**已应用到数据库**（API 返回空数组而非 500 错误，证明表存在）
- `lib/db-trending.ts` — 数据库查询层，完整且正确
- `app/api/trending/route.ts` — API 路由，完整且正确
- `components/sections/TrendingCard.tsx` — 卡片组件，完整且正确
- `app/skills/TrendingList.tsx` — 列表组件（客户端 fetch），完整且正确
- `app/skills/TrendingTabs.tsx` — Tab 切换组件，完整且正确
- `app/skills/SkillTrendingSwitch.tsx` — Skills/Trending 视图切换，完整且正确
- `app/skills/page.tsx` — **已支持** `?view=trending` 参数（第 21、28 行）

### 需要修复的问题

#### 问题 1：爬虫脚本语法错误（核心阻塞）
- **文件**：`scripts/crawl-trending.ts`
- **位置**：第 128 行
- **错误代码**：
  ```ts
  console.log(`\n🚀 Crawling growth rate (top starred repos)...")
  ```
- **问题**：反引号字符串里混入了 `"` 和 `)`，字符串未正确闭合，导致 TypeScript 编译失败，爬虫无法运行
- **修复**：改为
  ```ts
  console.log(`\n🚀 Crawling growth rate (top starred repos)...`)
  ```

#### 问题 2：数据库无数据（问题 1 的后果）
- `github_trending` 表存在但为空（API 返回 `total: 0`）
- 修复问题 1 后需手动运行爬虫填充数据

#### 问题 3：loading-trending.tsx 是死文件
- **文件**：`app/skills/loading-trending.tsx`
- **问题**：Next.js 只自动识别 `loading.tsx`，`loading-trending.tsx` 不会被任何机制加载
- **现状**：`TrendingList.tsx` 内部已有自己的 loading 状态（第 56-63 行 `Loader2` 旋转图标），不需要 Next.js loading 文件
- **处理**：删除该死文件

#### 问题 4：SkillList.tsx 容器样式（用户需求提及）
- **现状**：`SkillList.tsx` 第 103 行根元素是裸 `<div>`（无 className），**没有重复容器样式**
- **结论**：用户需求文档提到的"移除重复容器样式"在当前代码中已不存在该问题，无需改动

## 执行步骤

### Step 1：修复爬虫脚本语法错误
- **文件**：`scripts/crawl-trending.ts` 第 128 行
- **改动**：`console.log(`\n🚀 Crawling growth rate (top starred repos)...")` → `console.log(`\n🚀 Crawling growth rate (top starred repos)...`)`
- **验证**：`npx tsc --noEmit` 无错误

### Step 2：删除死文件
- **文件**：`app/skills/loading-trending.tsx`
- **原因**：Next.js 不识别此文件名，且 TrendingList 内部已有 loading 状态

### Step 3：运行爬虫填充数据
- **命令**：`npx tsx scripts/crawl-trending.ts`
- **预期**：爬取 daily/weekly/growth 三个维度各 30 条，写入 `github_trending` 表
- **依赖**：`.env.local` 已有 `GITHUB_TOKEN`（已确认存在）

### Step 4：验证功能
- 访问 `http://localhost:3001/skills?view=trending` 确认页面显示数据
- 切换 daily/weekly/growth 三个 Tab 确认数据切换正常
- 调用 `curl http://localhost:3001/api/trending?period=daily` 确认 API 返回非空数据

### Step 5：类型检查
- `npx tsc --noEmit` 确认无类型错误

## 假设与决策

1. **不改动已就绪的文件**：page.tsx、SkillList.tsx、db-trending.ts、API 路由、TrendingCard、TrendingList、TrendingTabs、SkillTrendingSwitch 都已完整且正确，不做任何改动
2. **不创建新迁移**：046 迁移已应用，表已存在
3. **不修改 SkillList.tsx**：当前代码不存在"重复容器样式"问题
4. **爬虫运行依赖 GITHUB_TOKEN**：已确认 `.env.local` 中存在，值为 `ghp_*` 开头的 PAT
5. **爬虫可能遇到 GitHub API 限流**：脚本已有重试机制（第 76-99 行），403 时读取 `x-ratelimit-reset` 自动等待

## 验证标准

1. ✅ `npx tsc --noEmit` 无错误
2. ✅ `npx tsx scripts/crawl-trending.ts` 成功运行，输出 "🎉 Trending crawl completed!"
3. ✅ `curl http://localhost:3001/api/trending?period=daily` 返回 `total > 0`
4. ✅ `/skills?view=trending` 页面显示项目卡片（非"暂无数据"）
5. ✅ 三个 Tab（每日热门/每周热门/Star 增速）切换正常
