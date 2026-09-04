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

```bash
npm run dev      # 开发服务器
npm run build    # 生产构建（见下方 Windows 注意）
npm run start    # 启动构建产物
npm run lint     # next lint
npm test         # vitest run（当前 5 个文件 / 61 个用例）
npm run test:watch
```

**Windows 构建注意**：`npm run build` 可能因 `TMP` 指向 `%TEMP%` 而报
`EPERM: operation not permitted, scandir '...\AppData\Local\Temp\LISF_*.tmp'`。
这是环境噪音，非代码问题。绕法：

```bash
mkdir -p .tmpbuild && TMP="$PWD/.tmpbuild" TEMP="$PWD/.tmpbuild" npx next build
```

数据库变更用 `node scripts/apply-migration.mjs <migration-file>` 应用，
迁移文件统一放在 `supabase/migrations/`。

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
- **Batch 3（下一步）** 拆 `app/skills/research/MultiAgentHub.tsx`（93 KB）到 `features/research/`；
- **Batch 3** 拆 `app/skills/research/MultiAgentHub.tsx`（93 KB）到 `features/research/`；
  拆 `app/profile/page.tsx`（43 KB）与 `app/profile/[userId]/page.tsx`（38 KB）到 `features/profile/`
- **Batch 4** OnlyUs 收敛到 `features/onlyus/`，去掉 `SiteShell` 里的 `/onlyus` 特例
- **Batch 5** 统一 markdown 渲染与消毒到 `shared/markdown/`（顺带修 XSS）；
  `lib/db-{search,skills,trending,works}.ts` 迁入 `lib/db/` 并留 re-export shim；
  跑 Knip；`@types/three` 移到 devDependencies

目标结构：`app/` 只留薄路由；业务收敛到
`features/{blog,work,gallery,editor,profile,community,shop,research,onlyus}`；
通用能力到 `shared/{ui,markdown,auth,upload,validation}`；数据访问统一在 `lib/db/`。

## 7. 已知遗留

- 仓库根目录有 `{app` 与 `blog` 两个空目录（0 文件、未被 git 跟踪），
  是早期在 shell 里花括号展开失败产生的垃圾，可安全删除。
- `README.md` 曾长期停留在"个人博客/作品集"阶段，未覆盖 OnlyUs、Research Agent、
  积分商店等，正在重写。
