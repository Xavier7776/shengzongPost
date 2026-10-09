# 2026-10-09 安全修复 / 回归验收

## P0：统一管理员权限与草稿保护
- `lib/auth.ts` 的 `requireAdmin` 与 `requireAdminApi` 同时验证 NextAuth Session 的 `admin` 角色和 `users` 表中的**实时角色**，用户降权后下一次请求立即失去管理员权限。独立后台脚本的 `x-admin-api-key` 继续受 `ADMIN_API_KEY` 服务端密钥保护，比较采用恒定时间比较。开发环境 bypass 只在 `NODE_ENV=development` 可用。
- `GET /api/posts/[slug]`：管理员可读未发布文章；普通用户只可以编辑器读取**本人已经发布**的文章；其他用户文章及所有后台草稿返回 404，所有成功的内容回复 `private, no-store`。
- `POST /api/posts/batch`：管理员权限校验、限 50 篇、非法输入返回 400、实际影响行计数、列表与详情缓存刷新；未经授权不能发布、撤回或批量删除文章。
- 检查其它所有使用 `requireAdmin()` / `requireAdminApi()` 的后台 API，无需逐个改变调用方即可统一生效。管理员角色应始终存在于数据库中。

## P1：评论读取可用性
- `getApprovedComments` 过去把 `sql` tagged template 嵌入另一个 tagged template 的 SELECT 列表达式中，Neon 参数化时可能生成非法 `$1`。改为单条静态模板查询，并用参数绑定可选登录用户 ID，未登录使用不存在的哨兵值 -1；评论树、点赞状态和已批准状态语义保持不变。

## 自动验收
- 见 `__tests__/admin-rbac.test.ts`、`__tests__/post-access-policy.test.ts`、`__tests__/comments-query.test.ts`。运行 `npm run typecheck`、`npm run lint`、`npm test`、`npm run build`。
- 负面用例：游客、普通用户、已降权旧 JWT、伪造 API key、非本人已发布文章、未发布草稿、无效批量操作必须拒绝。
- 正面用例：活跃管理员仍能使用后台，文章作者能读取本人已发布文章，评论游客与登录用户均可查询、显示点赞状态与层级回复。
- 生产上线后以低权限测试账号手动验证 **403/404**，检查 Vercel 近 24h `/api/comments` 日志不再出现 SQLSTATE 42601。不要使用生产管理员账号测试越权。
- 此 PR 不修改生产数据/权限，不自动部署；合并后由 Git 集成正常部署。

## 留待后续 PR
- HTML 白名单消毒与 CSP 收紧；认证/验证码分布式限流；全量接口访问控制矩阵；应用层与 Neon 写入统一事务/缓存；Next.js LTS 升级，单独 PR 避免回归扩大。
