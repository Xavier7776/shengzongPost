# AGENTS.md

本文件是给 AI 编码助手看的唯一事实来源。项目概览与人类向说明见 `README.md`。

## 1. 技术栈（以 `package.json` 为准）

| 项 | 实际版本 | 备注 |
| --- | --- | --- |
| Next.js | `^14.2.35` | App Router。**不是** Next 16 |
| React | `^18` | **不是** React 19 |
| Tailwind CSS | `^3.4.1` | **不是** Tailwind 4；配置见 `tailwind.config.ts` |
| 主数据库 | Neon PostgreSQL（`@neondatabase/serverless`） | 服务端直连，无 RLS |
| 认证数据库 | Supabase（`@supabase/ssr`） | 仅用于 OnlyUs 会话刷新 |
| 认证 | NextAuth v4（GitHub OAuth + credentials），JWT | `session.user.id` 是真实 DB id |
| 编辑器 | Tiptap + lowlight（CodeBlockLowlight） | 另有 `marked` 做 markdown → HTML |
| 测试 | Vitest + Testing Library | 配置见 `vitest.config.ts` |

其他运行时依赖：`zustand`、`three`、`recharts`、`lucide-react`、`cloudinary`、`resend`、`dayjs`、`qrcode.react`、`bcryptjs`。

**历史文档里「Next.js 16 / React 19 / Tailwind 4」的说法是错的，不要照抄。**

## 2. 命令

本地路径：`D:\BaiduNetdisk\post\shengzongPost`（远端 `github.com/Xavier7776/shengzongPost`）。

```bash
npm run dev           # 开发服务器
npm run build         # 生产构建（见下方 Windows 注意）
npm run start         # 启动构建产物
npm run lint          # next lint
npm run typecheck     # tsc --noEmit（含 scripts/）
npm test              # vitest run（当前 5 个文件 / 61 个用例）
npm run test:watch

npm run crawl:skills    # 爬取 AI Agent Skills → Neon
npm run crawl:trending  # 爬取 GitHub Trending → Neon
npm run db:apply        # 应用 supabase/migrations 下的迁移
npm run cursor:fetch    # 抓取光标特效素材
```

**Windows 构建注意**：`npm run build` 可能因 `TMP` 指向 `%TEMP%` 而失败。有两种已复现的
报错形态，**都是环境噪音，与业务代码无关**：

- `EPERM: operation not permitted, scandir '...\AppData\Local\Temp\LISF_*.tmp'`
- `glob error [EACCES: permission denied, scandir '...\AppData\Local\Temp\socket_*']`
  （`next/dist/compiled/glob` 扫到系统 Temp 里其他进程的 Node IPC socket，被 webpack 计为编译错误）

绕法：把 `TMP`/`TEMP` 指向项目内干净空目录（该目录需在 `.gitignore` 内）。

```bash
mkdir -p .tmpbuild && TMP="$PWD/.tmpbuild" TEMP="$PWD/.tmpbuild" npx next build
```

> 已用 `git stash` 对照实验确认：在**未改动的提交**上同样复现此报错，
> 故排查构建失败时不要先怀疑业务代码。

数据库变更用 `npm run db:apply <migration-file>`（等价于
`node scripts/apply-migration.mjs <migration-file>`），迁移文件统一放在 `supabase/migrations/`。

> ⚠️ **迁移编号断层（未修复）**：`migration.sql` + `_002`~`_009` 与 `032`~`053`
> 是**两套并行编号系列**，`010`~`031` 整段缺失。当前库是历史增量叠加出来的，
> **全新环境无法仅凭这些文件从零建库**。详见第 7 节。

## 3. 目录结构

```
app/          路由（App Router）。页面应尽量薄，只做取数 + 组装
  (main)/     站点主布局下的页面
  onlyus/     私密情侣应用，middleware 有独立的 gate 校验
  api/        接口路由
components/   共享 UI 组件（按 ui / layout / sections / admin / shop 等分层）
lib/
  db/         数据访问层，按域拆分（analytics, comments, points, posts, ...）
  db.ts       仅作为 lib/db/* 的 barrel 重新导出
  db-search.ts / db-skills.ts / db-trending.ts / db-works.ts  尚未迁入 db/，计划合入
  data.ts     静态兜底数据（HERO_SLIDES 是 Hero 的 DB 降级兜底，勿整体删除）
stores/       zustand store，目前只有 stores/onlyus/*
supabase/migrations/   32 个 SQL 迁移
__tests__/   Vitest 用例
```

`features/` 目录尚不存在，是本期重构的目标结构（见第 6 节）。

## 4. 四条产品线

项目已从个人博客扩展为四条业务线，改动前先判断自己碰的是哪一条：

1. **内容站** — `/`（Hero）、`/blog`、`/work`、`/gallery`、`/skills`、`/now`、`/projects`
2. **用户社区与商店** — `/profile`、`/shop`（积分 + 头像框）、`/notifications`、`/dashboard`
3. **OnlyUs 私密情侣应用** — `/onlyus/*`，有 middleware gate + zustand + Service Worker 推送
4. **Research Agent 工作台** — `/skills/research`（`MultiAgentHub.tsx`）

## 5. 开发约定

- **字体**：由 `app/layout.tsx` 用 `next/font`（DM Sans / DM Mono）自托管。
  不要再往 CSS 里加 `fonts.googleapis.com` 的 `@import`，会造成渲染阻塞。
- **CSS**：只有 `app/globals.css` 生效。仓库根目录若再出现 `globals.css` 是残留，
  它不在 `tailwind.config.ts` 的 content globs（`pages/` `components/` `app/`）内。
- **Tailwind content**：新增组件目录后记得补 `tailwind.config.ts` 的 `content`。
- **ISR**：`lib/db/_core.ts` 的冷启动重试 Proxy 刻意不传 `cache: 'no-store'`，
  否则会触发 `DYNAMIC_SERVER_USAGE` 导致静态导出失败。不要"顺手"加上。
- **Service Worker**：`public/sw.js` 由 OnlyUs 订阅推送时注册（`lib/push.ts`），
  不能删。它用 `NEVER_CACHE_PREFIXES` 排除 `/api`、`/admin`、`/dashboard`、
  `/profile`、`/onlyus` 等私有/动态路径 —— 改缓存逻辑时这条底线不能破。
- **Markdown**：`work/[slug]` 与 `skills/[slug]` 各自配置 `marked` 并
  `dangerouslySetInnerHTML`，目前无 sanitizer，是已知的 XSS 风险点（见第 6 节 Batch 5）。
- **不要提交**：`.env*`、`.claude`、`.trae`、`.workbuddy`、`supabase/.temp/`（已在 `.gitignore`）。

## 6. 当前重构：冗余清理与模块拆分

前提：**最近一次 main 提交已删除约 900 行死代码并把 `lib/db.ts` 拆成域模块，
因此不要做大范围删除。** 先处理冗余，再拆大模块。按批次推进，每批结束跑
`npm test` + `npm run build` + `git diff --check` 验证。

- **Batch 1（低风险清理，已完成）**
  - `/api/public` 是 `/api/posts/public` 的逐字节副本 → 已改为 307 兼容转发；
    确认无流量后可整体删除（保留方 `/api/posts/public` 被 `dashboard/edit` 与 `SearchClient` 调用）
  - `supabase/.temp/` 已从 git 移除并加入 `.gitignore`（内含 project-ref / pooler-url）
  - 删除 4 个无引用的重复 WebP（`public/cursor-effects/` 下 `feixue3*` / `lumiboba1*`）
  - `components/PWARegister.tsx` 被 `app/layout.tsx` 导入但从未渲染 → 组件与导入均已删除
  - `public/sw.js` 重写：缓存版本 `v1` → `v2`，补私有路径排除，修复推送图标
    （原 `/icon-192.png` 不存在，已改为 `/apple-icon.png`）
  - 根目录 `globals.css`（从未被导入）已删除，其中**仍在被代码引用的**动画
    （`aurora-spin`、`pointsToastIn`、`masonryIn`）与 `.frame-*` 头像框规则已迁入
    `app/globals.css` —— 这些在删之前是静默失效的
- **Batch 2（已完成）** 共享编辑器内核
  - `features/editor/`（内核，与业务无关）：`extensions.ts` / `markdown.ts` / `types.ts` /
    `VideoEmbed.ts` / `EditorToolbar.tsx` / `EditorBody.tsx`（含 `EditorPreview`、`EditorErrorBar`）/
    `PostMetaForm.tsx` / `AiSidebar.tsx` / `useEditorDialogs.ts` / `useImageUpload.ts` /
    `useAiWriting.ts` / `ai-stream.ts`
  - `features/admin-posts/AdminPostEditor.tsx` + `AttachmentsPanel.tsx`（取代 48 KB 的
    `components/admin/PostEditor.tsx`）
  - `features/submissions/UserPostEditor.tsx`（取代 43 KB 的
    `components/dashboard/UserPostEditor.tsx`）
  - 差异全部参数化，未复制代码：占位文案、预览路由标签、错误条是否可关闭、
    AI 供应商切换与 rewrite 模式、附件面板、封面换图前删旧图、slug 手自动策略、保存端点
  - `tailwind.config.ts` 已补 `./features/**` 与 `./shared/**` content glob
    （漏掉会导致 features/ 下所有 Tailwind 类被 purge）
- **Batch 1.5（已完成）** 死代码清扫（第二轮，独立于 Batch 1）
  - 删除 7 个零导入零引用文件（1,021 行）：`components/sections/TableOfContents.tsx`(387)、
    `components/sections/NameCard.tsx`(231)、`components/ui/CommandPalette.tsx`(217)、
    `components/sections/FeaturedGallery.tsx`(73)、`components/sections/ProjectItem.tsx`(46)、
    `components/layout/Footer.tsx`(46)、`components/onlyus/OnlyUsEntryCard.tsx`(21)
  - `TableOfContents` 已被 `BlogToc` + `WorkTocClient` 取代；`CommandPalette` 由
    `Navbar` 自行实现的 ⌘K → `/search` 取代（Navbar 内的命令面板引用已同步移除）
  - 依赖清理：移除 `@testing-library/user-event`、`@types/bcryptjs`（bcryptjs v3 自带类型）；
    `@dietrichgebert/ponytail` 移入 devDependencies（仅 `opencode.json` 的 CLI plugin 使用）；
    `@tiptap/pm` 是 Tiptap 必需 peer dep，**不可删**
  - `tsconfig.json` 从 `exclude` 移除 `scripts`，928 行爬虫纳入类型检查
  - **不要删 `lib/cloudinary-loader.ts`**：静态分析显示零导入，但它是
    `next.config.js` 的 `loaderFile` 引用，删了图片优化会整体失效
- **Batch 3（下一步）** 拆 `app/skills/research/MultiAgentHub.tsx`（93 KB）到 `features/research/`；
  拆 `app/profile/page.tsx`（43 KB）与 `app/profile/[userId]/page.tsx`（38 KB）到 `features/profile/`
- **Batch 4** OnlyUs 收敛到 `features/onlyus/`，去掉 `SiteShell` 里的 `/onlyus` 特例
- **Batch 5** 统一 markdown 渲染与消毒到 `shared/markdown/`（顺带修 XSS）；
  `lib/db-{search,skills,trending,works}.ts` 迁入 `lib/db/` 并留 re-export shim；
  跑 Knip；`@types/three` 移到 devDependencies

目标结构：`app/` 只留薄路由；业务收敛到
`features/{blog,work,gallery,editor,profile,community,shop,research,onlyus}`；
通用能力到 `shared/{ui,markdown,auth,upload,validation}`；数据访问统一在 `lib/db/`。

## 7. 已知遗留

按风险从高到低：

1. **迁移编号断层（阻塞级）** — `supabase/migrations/` 下 32 个文件，
   但编号分两套并行系列：`schema.sql` / `migration.sql` / `_002`~`_009`，
   以及 `032`~`053`。**`010`~`031` 整段不存在**。现有库是历史增量叠加的产物，
   **全新环境无法从零建库**。修复方式：按实际执行顺序把这些文件重排成一套线性序列，
   或从现有库 dump 出一份 `schema.sql` 作为基线。
2. **`/admin` 无入口（已修复）** — 此前 `Navbar` 与 `UserMenu` 都没有后台链接，
   只能手敲 URL。现已补：桌面端在 `UserMenu`，移动端抽屉在 `Navbar`
   （均以 `role === 'admin'` 收敛）。
3. **`/now` 保留说明** — `app/now/page.tsx` 在 mainline 上是可达的
   （`NAV_ITEMS` 有 `Now` 入口），内容停在 2026-08-22。曾一度被判定为死代码，
   实为在「已先行移除导航入口的工作区」上做的误判，**已恢复保留**。
   若要下线该页，需同时删除 `NAV_ITEMS` 中的 `Now` 项与 `app/now/page.tsx`。
4. **爬虫无调度** — `crawl:skills` / `crawl:trending` 只提供了 npm 脚本，
   尚未接入任何定时调度（原 `AGENTS.md` 声称的「每天 10:00 自动爬取」并不存在）。
5. **markdown 无消毒** — `work/[slug]` 与 `skills/[slug]` 用
   `dangerouslySetInnerHTML` 渲染 `marked` 输出，无 sanitizer，存在 XSS 风险。
6. **爬虫无调度** — 已核实：仓库内既无 `.github/workflows/` 也无 `vercel.json`，
   `crawl:skills` / `crawl:trending` 只是手动脚本，「每天 10:00 自动爬取」并未实现。
7. `README.md` 已覆盖四条产品线；`docs/项目整理计划-2026-09-10.md` 保留了
   本轮审计的完整证据链（导入图分析、双栈数据层、死代码判定依据）。

> 已核实**不成立**、勿再当遗留项的两条旧说法：
> ①「`{app` 与 `blog` 两个空目录」—— 当前根目录已无此二目录；
> ②「ESLint 配置缺失」—— `.eslintrc.json` 存在（`extends: next/core-web-vitals`）。
