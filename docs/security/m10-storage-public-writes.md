# M10-B2B：持久上传、公共写入与统计最小化

日期：2026-10-10。Windows 独立工作树 `shengzongPost-m10d`，分支 `codex/security-storage-v2`，基线 `2d2684ec873fad50ecbafdf146ee75281affa150`。本阶段不执行生产 DDL/DML、真实资源上传、密钥轮换或调度修改。

## 问题与修改

头像失败时曾写入 `public/avatars` 并返回本地 URL；管理员 GIF/宠物导入也依赖运行实例的 `public` 文件。Serverless 实例不能把此类文件当作持久资源。三条路径改为既有 Cloudinary 存储，生成唯一 `public_id`、`overwrite:false`，确认服务商返回本云的 HTTPS URL 后才更新数据库。历史静态文件与历史 URL 保留。

所有现有 `uploadLarge` 调用者保持接口。底层复用已安装 SDK 的 `upload_stream`，不再写临时文件，也不在上传结果不确定时自动重试。图片、原始 Markdown 附件分别保留 `image/raw` 参数和原文件后缀。当前调用者最多16 MiB，官方普通上传协议上限100 MB；实际账户资源类型、图像像素及文件配额仍需独立核验，协议上限不是账户验收。[Cloudinary Node upload 文档](https://cloudinary.com/documentation/node_image_and_video_upload)

SDK 的60秒 socket timeout 负责请求失败；它不是应用总执行时限。调用者/平台终止或确认丢失时，服务商仍可能已经写入资源，因此不会自动销毁结果不确定的新资源。头像 DB 更新失败保留旧 URL；宠物双图全部下载校验后上传，无几何变换，图集必须等于8列×9行。导入更新没有新海报时，实际 DB 与响应一致保留旧海报。价格必须是非负 int32。Cloudinary 图片在实际 `SpriteCSS` 扫描有效帧前使用匿名 CORS 请求；OnlyUs 组件未修改。

## 公共写入

复用已有055 `auth_rate_limits` 的原子 UPSERT/HMAC 计数，没有新的表或迁移。限额在副作用之前检查；数据库失败拒绝业务写入。过期窗口重置计数，不执行过期桶删除。

| 范围 | 身份限制/分钟 | IP限制/分钟 | 超限 |
| --- | ---: | ---: | --- |
| 订阅 | 邮箱5 | 5 | 429，无订阅写入 |
| 画廊点赞 | IP10 | 10 | 429，无计数增加 |
| 文章浏览 | 账号或IP60 | 120 | 429，无浏览/奖励写入 |
| 收藏与反应共享 | 账号60 | 120 | 429，无状态/奖励变动 |
| 访问统计 | visitor UUID60 | 120 | 204，丢弃事件 |

身份/IP使用独立范围的HMAC，阻止换邮箱/访客ID绕过同一IP限额。限流限制速率，不提供游客“一人一票”、机器人识别或跨IP防刷。Vercel 提供商会覆盖客户端IP头；自托管前必须配置可信反向代理，不能直接信任互联网传入的该头。[Vercel 请求头说明](https://vercel.com/docs/headers/request-headers)

## 统计与隐私

服务端只接受 UUIDv4 身份；私有/账户/OnlyUs路径不记统计，浏览器也不初始化该路径的追踪。路径只留 pathname，来源只留 HTTP/HTTPS origin，拒绝带用户凭据的来源。不存原始UA/IP，IP使用服务端秘密材料及UTC日期HMAC。登录标志完全来自服务端会话。统计体积16 KiB、订阅4 KiB。失败不影响页面阅读。

访客UUID、来源、日内IP指纹仍是可关联的假名数据，不宣称匿名化或满足全部同意/保留期义务；历史统计不改写。`ANALYTICS_IP_SALT` 若现存必须是私有秘密；未配置时使用既有 `NEXTAUTH_SECRET`，没有公开默认值。密钥实际强度与轮换不在本次授权内。

## 验证与边界

- 最终66文件/464 tests、typecheck/lint、完整隔离 `build:ci` 与diff检查通过。新增25项用例覆盖拒绝/成功、无本地fallback、价格/元数据/图集、资源失败/DB失败、限流在副作用之前、统计去查询/去UA/不可伪造登录、私有路径与超大体积。真实PGlite执行限流SQL和过期重置；这不算多实例数据库并发。
- 已安装 Cloudinary SDK 与真实 helper 在本地 HTTP 服务商协议上发送6 MiB multipart raw文件，保留 `.pdf` 后缀；失败仅发一次。socket超时和非法服务商结果另有测试。全部凭据为合成值，无外部服务商写入。
- `m10d-neon-rate.json` 于 `2026-10-10T05:55:15.820Z` 在已有临时分支 `br-misty-credit-a12n6x2e` 新合成 schema `m10d_rate_20261010` 执行捕获的真实 UPSERT。12个同时调用使用11个独立且重叠的后端连接，返回计数1–12，限制5时恰好5个允许；过期重置为1。原 public 数据未改、生产未改，凭据只放进程环境，临时 schema 保留。
- `m10d-local.json` 于 `2026-10-10T06:00:07.088Z` 使用正式 Next 构建、真实 NextAuth CSRF/credentials 和隔离合成库：成功头像持久URL、服务商失败仅1请求、DB拒绝保留旧头像；普通用户GIF401/管理员上传成功/伪GIF400；宠物导入与失败更新保持旧图/海报；订阅5/6、点赞10/11对应数据库计数；匿名统计拒绝伪造登录。390/1024/1440的后台商店/资料/商店没有横溢和应用错误。
- 浏览器 Cloudinary 图片由带CORS头的合成图集代答；真实组件72次像素读取成功/0错误，并使用192×208帧和8步动画。这验证渲染协议，不代表真实 Cloudinary 账户交付/CORS/配额验收。第一次界面测试把WebGL canvas误作2D、第二次仍检查旧canvas渲染；依据实际调用链改查 `SpriteCSS` 后通过，未放宽应用错误断言。
- 原始材料和脚本在 `D:/download/search-v2-validation/`。Preview与合并后正式域名只读验收独立登记；不会通过生产试上传、重复订阅/点赞或重发历史文章来验证。
- 首轮CI 38029603416/job114147571696的464断言通过，但Node multipart编码流在早期401取消后产生未处理异常，整个门禁判失败。测试现先编码真实HTTP wire bytes再构造NextRequest，保留401/无副作用和原数据校验断言；实际本地HTTP认证/上传检查已通过。没有吞异常、放宽Vitest门禁或修改产品鉴权/取消逻辑，最终head重新验CI/Preview。

## 剩余风险与回滚

数据库与对象存储没有共同事务，服务商成功、数据库失败/确认丢失或双图第二张失败会留下新孤儿资源。唯一ID保护旧资源，M11先报候选再获批清理；不得因未知提交状态直接删除资产。现有DAL冷启动重试可能重复记限流，倾向更早拒绝，未承诺可重放事务。上传/导入页面发生响应丢失后人工重试也可能产生新资源；没有新增跨系统幂等表。

回滚仅代码至2d2684e，不回写统计、删除资源或恢复旧资产。回滚会恢复实例本地文件风险，已写入Cloudinary的历史URL仍保持有效。旧无版本JWT切断、CSP从Report-Only改强制、实际应用数据库角色降权、遗留密钥清理、独立备份及生产审计仍须具体方案和单独批准。M10未整阶段勾完。

## 正式交付

最终PR27/head3638d7b的CI38029842010/job114148276685全部成功，Preview dpl_8qACvkaQyhiDq56shDGDpqYiEHMK READY/读取通过；合并7438bee后自动Production dpl_RK9g5w91DzCgVdqkaDWuVagPZhiR READY并绑定正式域名。三份m10d-production*.json通过公开/安全/Shop/Research/旧刊/分发/三尺寸只读检查，无浏览器错误；近15分钟部署error/fatal无计数。未验证生产写入或真实Cloudinary账户；M11桌面独立备份另获用户批准，应用密钥/权限与生产数据库不变。
