# 文章 HTML 安全边界（2026-10-09）

## 问题
- 旧博文通过 `dangerouslySetInnerHTML` 直接将数据库 HTML 注入公开页面；管理员编辑预览亦直接插入 HTML。
- Tiptap 文章使用富文本标签及表格/视频，因此不能简单整体改为纯文本。
- 对历史文章必须实施**读取时消毒**，仅在入库前校验不足以处理数据库已存在的恶意内容。

## 本次防护
- 新增 `lib/html/sanitize-post.ts`：使用 **parse5 8.0.1 HTML5 解析器**完成容错 DOM 解析后，仅保留允许的排版标签和严格的属性；移除事件、style、script、SVG、MathML、form 等活动内容。
- 链接仅允许 HTTP(S)、邮件或站内路径；外链自动添加 `rel="noopener noreferrer nofollow"`；图片仅允许站内地址以及现有 Next.js 媒体源白名单；仅信任 YouTube 与 Bilibili 标准 iframe，自动设置沙盒及拒绝任意播放源。
- 普通 `posts.content` 在 create/update 时消毒，读取旧文章时再次消毒；编辑器分屏预览也消毒，降低管理员查看待审核恶意 HTML 的风险。
- 不对普通 Markdown 作 HTML 注入式渲染，也不改变 ChatGPT 精读 JSON 组件以安全文本节点渲染的路径；特殊表格、代码、头像等旧内容应在 Preview 视觉验收。

## 风险与验收
- 这是基于 parse5 的应用层**显式允许列表策略**，应继续进行人工安全评审，并针对跨站脚本与复杂 HTML 进行渗透测试；不可声称已形式化证明不存在 XSS。
- 改动不移除 Next.js 14 现有 CSP 的 `unsafe-eval`，否则可能与应用脚本冲突；后续框架升级时统一收紧 CSP。
- 用户从不在生产直接写入或删除旧文章，本次仅改变发布时的正文渲染与未来文章入库处理。
- 需要测试 iframe 视频播放、代码语法高亮、图像与表格、Legacy Markdown、管理编辑器预览和移动端深色模式；不支持的视频源应退化为安全的空内容而非不受控 iframe。
