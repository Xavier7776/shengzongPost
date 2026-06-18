# GitHub Trending 功能修复计划

## 摘要

GitHub Trending 功能的爬虫和数据库已就绪（30 条 daily/weekly/growth 数据已入库），但**前端页面无法正常渲染**，API 的 growth tab 和 languages 字段返回空数据。本计划修复 4 个代码缺陷 + 1 个清理项，并通过端到端验证确认功能可用。

## 当前状态分析

### 已完成（无需改动）
- `supabase/migrations/046_github_trending.sql` + `047_fix_github_trending_crawled_date.sql` — 已应用，表结构正确
- `scripts/crawl-trending.ts` — 语法错误已修复，已成功爬取 30×3 条数据入库
- `app/api/trending/route.ts` — 路由逻辑正确
- `app/skills/TrendingList.tsx` / `TrendingTabs.tsx` / `SkillTrendingSwitch.tsx` — 客户端组件本身正确
- `components/sections/TrendingCard.tsx` — 卡片组件正确
- `app/skills/SkillList.tsx` — 无重复容器样式问题
- Dev server 已在 `http://localhost:3001` 运行

### 待修复的缺陷

#### 缺陷 1（CRITICAL）：`page.tsx` 通过静态属性访问客户端组件会崩溃

**位置**: [app/skills/page.tsx](file:///e:/chromeDownload/arc-portfolio/app/skills/page.tsx#L31-L33)

```tsx
<SkillTrendingSwitch.TrendingTabs />
<SkillTrendingSwitch.TrendingList period={trendingTab} />
```

**问题**: `SkillTrendingSwitch` 是 `'use client'` 组件，在 [SkillTrendingSwitch.tsx#L53-L54](file:///e:/chromeDownload/arc-portfolio/app/skills/SkillTrendingSwitch.tsx#L53-L54) 通过 `SkillTrendingSwitch.TrendingTabs = TrendingTabs` 挂载静态属性。但 `page.tsx` 是 Server Component，Next.js RSC 序列化客户端组件时**只传递组件引用本身，不传递挂载在其上的静态属性**。因此 `SkillTrendingSwitch.TrendingTabs` 在服务端为 `undefined`，渲染 `<undefined />` 会抛错或输出空。

**修复**: 在 `page.tsx` 直接 `import TrendingTabs from './TrendingTabs'` 和 `import TrendingList from './TrendingList'`，移除对静态属性的访问。同时清理 `SkillTrendingSwitch.tsx` 末尾的两行静态属性挂载（已无引用方）。

#### 缺陷 2：`getGrowthRanking` 仍用 `crawled_at` 时间戳匹配，返回空

**位置**: [lib/db-trending.ts#L116-L126](file:///e:/chromeDownload/arc-portfolio/lib/db-trending.ts#L116-L126)

```ts
WHERE period = 'growth' AND crawled_at = (
  SELECT MAX(crawled_at) FROM github_trending WHERE period = 'growth'
)
```

**问题**: 与之前 `getTrending` 的 bug 同源 —— `saveToDatabase` 每条 INSERT 独立求值 `NOW()`，`crawled_at` 微秒级差异导致 `= MAX(crawled_at)` 只匹配 1 条。growth tab 永远空。

**修复**: 改用 `crawled_date` 日期匹配，与 `getTrending` 保持一致。

#### 缺陷 3：`getTrendingLanguages` 同样的时间戳匹配 bug

**位置**: [lib/db-trending.ts#L131-L143](file:///e:/chromeDownload/arc-portfolio/lib/db-trending.ts#L131-L143)

```ts
WHERE crawled_at = (
  SELECT MAX(crawled_at) FROM github_trending
)
```

**问题**: 同缺陷 2。此外还缺少 `period` 过滤，会跨 period 聚合。API 返回的 `languages` 字段始终为 `[]`。

**修复**: 改用 `crawled_date = (SELECT MAX(crawled_date) FROM github_trending)`，并按当前 period 过滤（接受 `period` 参数）。

#### 缺陷 4：`getTrendingDates` / `getTrendingByDate` 用 `DATE(crawled_at)` 而非 `crawled_date`

**位置**: [lib/db-trending.ts#L84-L110](file:///e:/chromeDownload/arc-portfolio/lib/db-trending.ts#L84-L110)

**问题**: 功能上 `DATE(crawled_at)` 能工作，但无法利用 `crawled_date` 上的索引，且与修复后的查询风格不一致。这两个函数目前未被 API/页面调用，属于低优先级一致性修复。

**修复**: 改用 `crawled_date` 列。

#### 清理项：删除临时诊断脚本

**位置**: `scripts/check-trending.mjs`

**原因**: 调试用临时脚本，不属于生产代码。功能已通过它确认数据入库，无需保留。

## 实施步骤

### Step 1: 修复 `app/skills/page.tsx`（缺陷 1）

**文件**: `e:\chromeDownload\arc-portfolio\app\skills\page.tsx`

**改动**:
1. 在文件顶部新增 `import TrendingTabs from './TrendingTabs'` 和 `import TrendingList from './TrendingList'`
2. 将 `<SkillTrendingSwitch.TrendingTabs />` 改为 `<TrendingTabs />`
3. 将 `<SkillTrendingSwitch.TrendingList period={trendingTab} />` 改为 `<TrendingList period={trendingTab} />`
4. 保留 `SkillTrendingSwitch` 主组件的 import（顶部切换按钮仍需要）

### Step 2: 清理 `app/skills/SkillTrendingSwitch.tsx`（缺陷 1 配套）

**文件**: `e:\chromeDownload\arc-portfolio\app\skills\SkillTrendingSwitch.tsx`

**改动**:
1. 移除 `import TrendingTabs from './TrendingTabs'` 和 `import TrendingList from './TrendingList'`（不再需要）
2. 移除文件末尾两行：`SkillTrendingSwitch.TrendingTabs = TrendingTabs` 和 `SkillTrendingSwitch.TrendingList = TrendingList`

### Step 3: 修复 `lib/db-trending.ts`（缺陷 2、3、4）

**文件**: `e:\chromeDownload\arc-portfolio\lib\db-trending.ts`

**改动**:

#### 3a. `getGrowthRanking`（缺陷 2）
将 `WHERE period = 'growth' AND crawled_at = (SELECT MAX(crawled_at) ...)` 改为：
```ts
WHERE period = 'growth' AND crawled_date = (
  SELECT MAX(crawled_date) FROM github_trending WHERE period = 'growth'
)
```

#### 3b. `getTrendingLanguages`（缺陷 3）
- 函数签名增加 `period?: 'daily' | 'weekly' | 'growth'` 参数
- WHERE 子句改为按 `crawled_date` 匹配，并按 period 过滤：
```ts
export async function getTrendingLanguages(
  period?: 'daily' | 'weekly' | 'growth'
): Promise<{ language: string; count: number }[]> {
  const rows = await sql`
    SELECT language, COUNT(*)::int as count
    FROM github_trending
    WHERE crawled_date = (
      SELECT MAX(crawled_date) FROM github_trending
      ${period ? sql`WHERE period = ${period}` : sql``}
    )
    AND language IS NOT NULL
    ${period ? sql`AND period = ${period}` : sql``}
    GROUP BY language
    ORDER BY count DESC
  `
  return rows as unknown as { language: string; count: number }[]
}
```

注意：Neon 的 `sql` 标签模板支持嵌套条件片段，需确认写法正确。若嵌套片段有兼容性问题，回退为不传 period（仅按最新 `crawled_date` 聚合所有 period），保证不报错。

#### 3c. `getTrendingDates`（缺陷 4）
将 `SELECT DISTINCT period, DATE(crawled_at) as crawled_at` 改为 `SELECT DISTINCT period, crawled_date as crawled_at`，WHERE/ORDER 不变。

#### 3d. `getTrendingByDate`（缺陷 4）
将 `WHERE period = ${period} AND DATE(crawled_at) = ${date}` 改为 `WHERE period = ${period} AND crawled_date = ${date}`。

### Step 4: 更新 `app/api/trending/route.ts` 调用（缺陷 3 配套）

**文件**: `e:\chromeDownload\arc-portfolio\app\api\trending\route.ts`

**改动**: 将 `const languages = await getTrendingLanguages()` 改为 `const languages = await getTrendingLanguages(period)`，让 languages 与当前 period 对应。

### Step 5: 删除临时诊断脚本

**文件**: `e:\chromeDownload\arc-portfolio\scripts\check-trending.mjs`

**操作**: 用 `DeleteFile` 工具删除。

## 验证步骤

### V1: API 返回非空数据
```bash
curl.exe -s "http://localhost:3001/api/trending?period=daily&limit=2"
curl.exe -s "http://localhost:3001/api/trending?period=weekly&limit=2"
curl.exe -s "http://localhost:3001/api/trending?period=growth&limit=2"
```
**期望**: 三个 period 的 `total` 均 > 0，`trending` 数组非空，`languages` 数组非空。

### V2: 页面渲染正常
```bash
curl.exe -s -o nul -w "%%{http_code}" "http://localhost:3001/skills?view=trending"
```
**期望**: HTTP 200（而非 500）。

### V3: TypeScript 类型检查
```bash
npx tsc --noEmit
```
**期望**: 无新增错误（与改动前基线一致）。

### V4: 手动浏览器验证（可选，由用户执行）
访问 `http://localhost:3001/skills?view=trending`，确认：
- 顶部 "AI Skills" / "GitHub Trending" 切换按钮可见
- "每日热门" / "每周热门" / "Star 增速" 三个 tab 可切换
- 每个 tab 展示最多 30 张项目卡片
- 卡片显示排名、头像、仓库名、描述、Star 数、语言、Fork 数
- growth tab 的卡片显示 `+N` 增速徽章

## 假设与决策

1. **不重新爬取数据**：数据库已有 30×3 条有效数据（通过 `check-trending.mjs` 确认），无需重跑爬虫。
2. **不改动 `SkillTrendingSwitch` 主组件样式**：仅移除冗余的静态属性挂载和未使用的 import。
3. **`getTrendingLanguages` 加 period 参数**：让语言列表与当前 tab 数据对应，更有意义。若 Neon 嵌套 `sql` 片段有兼容性问题，回退为不传 period（仍按 `crawled_date` 匹配，比原 bug 好）。
4. **保留 `getTrendingDates` / `getTrendingByDate`**：虽然当前未被调用，但属于完整 API 的一部分，修复一致性即可，不删除。
5. **不创建 `loading-trending.tsx`**：Next.js 只识别 `loading.tsx`，且 `TrendingList` 已有内部 loading 态，无需额外骨架屏。

## 影响范围

| 文件 | 改动类型 | 风险 |
|------|---------|------|
| `app/skills/page.tsx` | 修复 import + 替换组件引用 | 低 — 直接 import 是标准用法 |
| `app/skills/SkillTrendingSwitch.tsx` | 移除冗余代码 | 低 — 仅删除未使用的 import 和静态属性 |
| `lib/db-trending.ts` | 修复 4 个查询函数 | 低 — 改用已有索引列，逻辑更正确 |
| `app/api/trending/route.ts` | 传 period 参数 | 低 — 函数签名兼容 |
| `scripts/check-trending.mjs` | 删除 | 无 — 临时文件 |
