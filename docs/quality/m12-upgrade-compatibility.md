# M12 分阶段升级与兼容矩阵

核对日期：2026-10-10。起点为 PR #28 merge `0af52257af4279eb18d56f320007f7df067b15c3`。Windows Node24.9.0/npm11.6.0；生产回退锚点 `dpl_BpAgXTmUczLoU9W6XwCWEDoK1KhQ`。升级不需要数据库迁移、改密钥、替换认证产品或重写界面。

## 目标与交付顺序

[官方支持政策](https://nextjs.org/support-policy)列出 Next16 为 Active LTS、15 为 Maintenance LTS、14 已不支持。registry 当前稳定版为 Next16.4.0/React19.3.0；以受支持稳定版为框架候选，不使用 canary。版本是否可交付仍取决于本仓库回归，peer 范围仅表示安装兼容。

1. A：保持 Next14/React18/NextAuth4 运行时，升级 Vitest4.1.10→4.1.11，Node 类型20→24.19.2；把 Next 专属 lint 命令换为现有 ESLint8 CLI，目录与 `.eslintrc.json` 双向 OnlyUs 边界保留；`@types/three` 同版本转开发依赖。CI 用实际 ESLint API 验证两个非法方向、两个 shared 方向及 OnlyUs 内部合法导入。干净安装/全部门禁/Preview 分别验收。
2. B：独立最新 main 工作树迁移 Next16.4.0、React19.3.0/对应类型、稳定 NextAuth4.24.15、ESLint9/匹配 Next config；逐项处理异步请求 API、缓存失效、图片/字体、middleware、SSR/鉴权及构建 transport。先本地生产构建与隔离账号交互，再同 SHA CI/Preview；有未解释错误或明显性能回退时阻断交付。
3. 其余依赖只按明确公告/可达性选择独立补丁；不使用 `npm audit fix --force`，不顺带升级 Tailwind4、TypeScript7、ESLint10、Vitest5 或 OnlyUs Supabase 数据层。

## 兼容矩阵

来源为 `npm view <精确版本> engines peerDependencies peerDependenciesMeta --json`，原始快照在 Git 外 `D:/download/search-v2-validation/m12-compatibility-metadata.json`。仅在 npm 未公布范围时记录“未声明”，不虚构最高支持版本。

| 依赖 | 当前锁定 | 候选/保持 | 官方声明与本项目影响 |
| --- | --- | --- | --- |
| Next | 14.2.35 | 16.4.0（B） | Node≥20.9、TS≥5.1；peer React/DOM ^18.2 或 ^19；App Router 仍须验证 React19 行为。异步 cookies/headers/params/searchParams 与缓存 API 需要源码迁移。 |
| React/DOM | 18.3.1 | 19.3.0（B） | 同版本升级；配套19类型。ref、JSX、hydrate、StrictMode、编辑器必须实际验证。 |
| NextAuth | 4.24.14 | 4.24.15（B） | peer Next12.2.5/13/14/15/16，React17/18/19；保留v4/JWT/GitHub+credentials，检查真实 session、管理员角色回读、登录退出和 cookie 路径。 |
| ESLint/Next config | 8.57.1/14.2.3 | A保持；B9/16.4.0 | Next config16要求 ESLint≥9，采用 flat config；A先解除 `next lint` 依赖。两轮均验证 OnlyUs 双向限制。 |
| TypeScript/Node类型 | 5.9.3/20.19.41 | TS保持，类型24.19.2（A） | Node24与类型24匹配；TS5.9满足 Next最低5.1。不追逐 TS7。 |
| Vitest/React plugin | 4.1.10/6.0.4 | 4.1.11/保持（A） | Vitest支持Node20/22/≥24、Vite6/7/8；plugin6要求Node20.19或≥22.12、Vite8。保持全部同版 @vitest 子包，不升Vitest5。 |
| Testing Library | 16.3.2 | 保持 | peer React/DOM/types18或19，Node≥18；当前渲染/鉴权用例继续执行。 |
| Tiptap | 3.24.0 | 框架迁移先保持 | React包支持17/18/19，但 core/pm必须严格同版本；后续安全补丁需整组升级，验证SSR关闭、低亮代码、markdown导入、上传及两个编辑器。 |
| Recharts | 3.8.1 | 保持 | peer React/DOM/react-is16–19，Node≥18；精读图表的 SSR 与 hydrate 需浏览器验证。 |
| PGlite | 0.5.8 | 保持 | 此版本 metadata 未声明 engines/peer；当前真实SQL测试及fixture不因升级失效，不放宽失败/超时。 |
| Neon SDK | 1.1.0 | 保持 | Node≥19；不改变生产连接。fixture读写边界、并发/回滚、ISR冷启动重试继续验证。 |
| Cloudinary | 2.10.0 | 保持 | 自定义next/image loader与一次upload_stream继续测试，真实provider账户/上传配额单独列限制。 |
| Vercel | Next平台构建/Node24 | Preview验证 | 本仓库不存在独立Vercel SDK最高版本契约；本地成功不代替平台build/READY、正式域名同SHA核对。 |

## 安全基线

升级前 `npm audit --json` 共59项（36 moderate/21 high/2 critical）；这是依赖图统计，不等于59条实际远程利用路径。A干净安装后57项（34 moderate/21 high/2 critical）：Vitest与mocker补丁消除2个moderate，Next与NextAuth仍未修复，不称全站安全问题解决。

[Vitest维护者公告](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9)的 redirect mock 路径读取由4.1.11修复；本项目不把测试mock server暴露公网，仍采用补丁。

NextAuth4.24.15修复[OAuth provider绑定](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-x445-f3h2-j279)、[Bearer异常](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-xmf8-cvqr-rfgj)及[邮件规范化](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-7rqj-j65f-68wh)。本项目仅GitHub OAuth+credentials，没有邮件provider和多OAuth账号绑定，不能按audit严重级别声称对应前置条件已满足；B仍升级稳定补丁并验证实际认证。

Next14处于不支持状态；B以[16升级指南](https://nextjs.org/docs/app/guides/upgrading/version-16)、[15迁移指南](https://nextjs.org/docs/app/guides/upgrading/version-15)和具体维护者公告核对可达范围。未以删除业务功能或关闭验证来规避框架问题。

## 必须完成的框架检查

- 将所有同步请求API/动态params和searchParams迁移，包括管理员鉴权的cookies/headers与测试mock；不能仅改类型让旧运行时通过。
- 保持文章、专刊与搜索即时可见的失效语义；Next16的revalidateTag参数需要明确expire行为，不随意改为延迟SWR。
- 默认Turbopack与既有fixture/webpack别名逐项核对；必要时明确 `next build --webpack`。fixture仍禁止对外transport及真实数据库写入，不能为build成功取消此边界。
- Next16不自动lint，CI显式CLI与双向边界探针继续执行；OnlyUs matcher、gate/cookie与独立Supabase能力保留。
- 对照相同fixture、端口和浏览器测量页面/JS bundle、冷LCP、错误/HTTP500、SQL请求次数；记录样本次数和限制，不把单次冷LCP当真实用户P75/INP。
- 并发/ISR、真实隔离账号登录与鉴权、编辑器保存/审核、旧专刊指纹与图表自测、HTML清洗、搜索、上传协议/下载、CSP/字体图片、三个尺寸和完整构建页面数量均要通过。

A已通过Windows干净npm ci、typecheck/CLI lint、5个边界探针、66文件464tests、fixture transport self-test及89页完整隔离build。运行时锁定版本不变；Vitest同版子包之外仅其依赖chai6.3/tinyrainbow3.2、Node类型配套undici-types7.24.6发生版本变化。CI/Preview和B仍在执行。生产数据库和08:30Neon任务保持现状。
