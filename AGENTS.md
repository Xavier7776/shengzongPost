# MindStack 博客 — 项目指引

## 项目信息（以 `package.json` 为准，请勿凭记忆填写）

| 项 | 值 |
| --- | --- |
| 框架 | Next.js **14**（App Router）· `next ^14.2.35` |
| UI | React **18** · `react ^18` |
| 样式 | Tailwind CSS **3** · `tailwindcss ^3.4.1` |
| 语言 | TypeScript 5（`strict: true`） |
| 编辑器 | Tiptap 3 |
| 认证 | NextAuth v4（Credentials + GitHub OAuth） |
| 状态管理 | Zustand 5（仅 `onlyus` 使用） |
| 项目路径 | `D:\BaiduNetdisk\post\shengzongPost` |
| Obsidian 记录 | `D:\obsidianWarehouse\XavierWarehouse` |

> ⚠️ 历史文档曾写 "Next.js 16 + React 19 + Tailwind 4"，与实际情况不符，已于 2026-09-10 修正。

## 数据层：这是一个双数据库项目

**两个子系统使用完全独立的数据库，切勿混用。**

| 子系统 | 数据库 | 访问入口 | 说明 |
| --- | --- | --- | --- |
| 博客 / 作品集主站 | **Neon** (PostgreSQL Serverless) | `lib/db.ts`（barrel）→ `lib/db/*.ts` | 含 3 个直连文件：`lib/db/_core.ts`、`lib/db-skills.ts`、`lib/db-trending.ts` |
| `onlyus` 情侣空间 | **Supabase** | `lib/supabase-client.ts` 的 `getSupabaseClient()` | 客户端直连 + RLS，约 113 处调用；表结构见 `supabase/migrations/` |

- 主站所有查询走 `@/lib/db`，不要直接 `import { neon }`。
- onlyus 所有查询走 `getSupabaseClient()`，不要新建 client 实例。
- `lib/db.ts` 是 18 行纯 barrel（re-export `lib/db/*`），新增领域模块请加到 `lib/db/` 并在此登记。

## 目录结构

```
app/                    # 页面与 API 路由（App Router）
  (博客/作品集)          #   page, blog, work, projects, gallery, shop, profile, dashboard, search
  admin/                #   管理后台（无全局入口，需手敲 /admin/login）
  onlyus/               #   情侣空间子应用（独立布局、独立认证）
  api/                  #   REST 路由
components/
  layout/               # Navbar, SiteShell, UserMenu, NotificationBell, FooterLogo
  sections/             # 页面区块（BlogCard, HeroClient, SkillCard…）
  ui/                   # 基础组件（Card3D, BackToTop, Skeleton…）
  admin/                # 后台组件（PostEditor, shop/*）
  dashboard/            # 用户编辑器（UserPostEditor）
  onlyus/               # 情侣空间专用组件
  shop/                 # 光标/头像框商店
lib/
  db.ts + db/*          # Neon 数据访问层
  db-skills.ts          #   ↑ 注意：这三个还没归入 db/ 目录，命名体系待统一
  db-trending.ts
  db-works.ts
  db-search.ts
  auth.ts / authOptions.ts
  supabase-client.ts    # Supabase 客户端（onlyus）
  hooks.ts              # 自定义 Hooks
stores/onlyus/          # Zustand stores（仅情侣空间）
scripts/                # 爬虫与运维脚本（已纳入类型检查）
supabase/               # 迁移 + Edge Functions（仅情侣空间用）
```

## 常用命令

```bash
npm run dev              # 开发服务器
npm run build            # 生产构建
npm run typecheck        # 类型检查（tsc --noEmit）
npm run lint             # ESLint
npm test                 # Vitest

npm run crawl:skills     # 爬取 GitHub AI Agent Skills → Neon
npm run crawl:trending   # 爬取 GitHub Trending → Neon
npm run db:apply         # 应用数据库迁移
npm run cursor:fetch     # 下载光标精灵图/海报资源
```

爬虫脚本通过 `dotenv` 读取根目录 `.env.local`，依赖 `GITHUB_TOKEN`（可选但强烈建议）与 `DATABASE_URL`。

## 关键文件（改动时注意）

- 导航入口：`components/layout/Navbar.tsx` 的 `NAV_ITEMS`（当前仅 5 项：`/` `/blog` `/skills` `/work` `/projects`）
- 全局布局：`components/layout/SiteShell.tsx`（按路由决定是否渲染 Navbar/Footer）
- 全局样式：`app/globals.css`（**根目录不再有 globals.css，已于 2026-09-10 删除重复文件**）
- 字体：Google Fonts `@import` 写在 `app/globals.css`，变量名 `--font-switzer` / `--font-mono`
- 图片来源白名单：`next.config.js` 的 `images.remotePatterns`；自定义 loader 在 `lib/cloudinary-loader.ts`

## 已知问题（2026-09-10 审计）

| # | 问题 | 影响 |
| --- | --- | --- |
| 1 | `supabase/migrations` 编号在 **010–031 段缺失**（现有 `migration.sql`+`_002~_009` 与 `032~053` 两套并行系列） | 全新环境无法从零重建数据库 |
| 2 | `onlyus` 占全仓 29%（13,489 行 / 68 文件），与主站零代码共享 | 仓库耦合度虚高，构建互相拖累 |
| 3 | 两个编辑器近乎同源：`components/admin/PostEditor.tsx`(800) 与 `components/dashboard/UserPostEditor.tsx`(676) | 修 bug 要改两处 |
| 4 | `components/sections/TableOfContents.tsx` 已删除；TOC 现有两份实现（`BlogToc` / `WorkTocClient`） | 待抽成公共 hook |
| 5 | 超大文件：`app/skills/research/MultiAgentHub.tsx` 达 1,863 行 | 难以维护与 review |
| 6 | `/admin` 无全局入口 | 后台只能手敲 URL 进入 |
| 7 | **`npm run build` 会因 `EACCES ... Temp\socket_*` 失败** | webpack 的 glob 扫到系统 Temp 里的 Node IPC socket 文件，把构建整个打挂（详见下节） |

完整整理计划见 `docs/项目整理计划-2026-09-10.md`。

## 已知构建故障：Temp 里的 socket 文件（务必先看）

**症状**：`npm run build` 在 `Creating an optimized production build ...` 之后立即失败：

```
glob error [Error: EACCES: permission denied, scandir 'C:\Users\...\AppData\Local\Temp\socket_XXXXXXXX']
Failed to compile.
```

**根因**：`next/dist/compiled/glob` 的 `_readdirError` 在 readdir 系统 Temp 里的 `socket_*`（Node 进程的 IPC socket）时收到 `EACCES`，虽然只打日志，但 webpack 会将其计为编译错误。

**这与业务代码无关**，在未改动的代码上同样复现。

**绕过方式**：构建前把 `TEMP` / `TMP` 指向一个干净的空目录。

```bash
mkdir -p /d/tmp-build
TEMP="D:/tmp-build" TMP="D:/tmp-build" npm run build
```

验证结果：改用干净 TEMP 后，webpack 编译通过并生成 88 个静态页面；此时仅剩需要真实 `DATABASE_URL` 的页面（`/`、`/projects`、`/feed.xml`）因连不上库而失败，属预期行为。

