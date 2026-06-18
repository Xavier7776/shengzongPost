# MindStack 项目长期记忆

## 技术栈（实际，与 CLAUDE.md 文档有出入）
- Next.js 14.2.3 (App Router) · React 18 · TS · Tailwind 3.4（非文档所述的 Next16/React19/Tailwind4）
- DB: Neon PostgreSQL（服务端直连，`lib/db.ts` 用 `@neondatabase/serverless` 的 `sql` tagged template）+ Supabase（SSR client + Edge Functions）
- Auth: NextAuth v4 (GitHub OAuth + 邮箱密码)，JWT，`session.user.id` = 数据库真实 id
- 无 RLS：所有数据走 `lib/db.ts` 服务端 sql，不走 Supabase RLS 通道

## 关键约定
- **Neon 执行原生 SQL**：`sql.unsafe(str)` 只返回标记对象，必须 `sql\`${sql.unsafe(str)}\`` 在 tagged template 内才真正执行。迁移脚本按 `;` 切分后逐条这样执行（`scripts/apply-migration.mjs` 通用脚本）。
- **Neon fetch 缓存（重要 bug 已修复）**：`@neondatabase/serverless` 底层用全局 fetch，Next.js 14 会缓存相同 SQL 的 fetch 响应。`lib/db.ts` 的 sql 初始化必须用 `neon(url, { fetchOptions: { cache: 'no-store' as RequestCache } })`，否则数据库更新后 API 返回旧数据。改 lib/ 后需重启 dev server（HMR 不重载 lib/）。
- **积分商城装备链路**（头像框 + 鼠标效果都遵循）：目录表 + `user_<x>` 持有表 + `users.equipped_<x>` 单列；`lib/db.ts` 函数（getAll/getUser/getUserEquipped/purchase/equip）；`/api/shop/<x>/{route,purchase,equip}` 三路由；`/api/user/profile` 自身 GET 暴露装备态；商城页 + profile 外观选择器。purchase 用 `hasPointTransaction(reason,'<x>_<key>')` 幂等。
- **全局 UI 层**：`app/layout.tsx` 的 `<Providers>` 内挂 `pointer-events-none fixed` 全局层（CursorGlow z-0、CursorFollower z-40）。`SiteShell` 对 /admin、/dashboard、/onlyus 裸渲染。
- **Sprite 动画**：`components/ui/SpriteCanvas.tsx`（共享）支持 `row` prop 播放多状态精灵图某行；不传 row 则线性播放全帧（PetSprite 用法）。row/isPaused 走 ref，切换不重载图。
- **SpriteCanvas fixedMode 闪烁（重要 bug 已修复）**：`fixedMode`（鼠标跟随 + 商城预览都用）下原来每帧用该帧的非透明像素包围盒算 `scale = Math.min(cw/box.w, ch/box.h)`，每帧姿态不同→包围盒不同→scale 不同→角色每帧大小位置跳→闪烁。修复：fixedMode 跳过包围盒计算，用帧尺寸做统一缩放（`fixedScale = Math.min(cw/frameW, ch/frameH)`），预计算 `fixedDx/Dy/Dw/Dh` 所有帧共用。同时给 CursorPreview 加 `React.memo` + `useMemo(sprite)`，给 CursorFollower 加 `useMemo(sprite)`，防止父组件状态变化时子组件无谓重渲染。
- **SpriteCanvas Image 生命周期（重要 bug 已修复）**：useEffect 中 `new Image()` 必须先设 `onload` 再设 `src`；cleanup 中 `cancelled=true; clearInterval(timer); img.onload=null`，onload 开头 `if(cancelled)return`。否则 StrictMode 双执行导致旧 onload 泄漏 + 多 interval 叠加闪烁。

## 功能模块速查
- 博客/社区/积分商城（头像框 + 鼠标效果 20 款）/ OnlyUs 双人空间（15+ store）/ Admin 后台（Tiptap + AI 流式写作）
- 鼠标效果素材：`public/cursor-effects/*.webp`（codex-pets 契约 1536×1872 = 8列×9行，Idle=0/RunRight=1/RunLeft=2）；scale 按稀有度分层 common 88 / rare 96 / epic 104 / legendary 120

## 卫生问题（待清理）
- 根目录有错误文件夹 `{app/`；`lib/app/api/...` 位置反常；package.json 有垃圾依赖 `build`/`start`
