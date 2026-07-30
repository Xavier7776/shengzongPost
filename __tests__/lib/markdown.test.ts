// __tests__/lib/markdown.test.ts
// 测试 marked 的 GFM 配置与解析行为
// 与 app/work/[slug]/page.tsx、app/skills/[slug]/page.tsx 中的 marked 配置保持一致
import { describe, it, expect, beforeAll } from 'vitest'
import { marked } from 'marked'

describe('Markdown 解析配置 (marked)', () => {
  beforeAll(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    })
  })

  it('解析 GFM 表格为 <table>', () => {
    const md = `| 名称 | 星数 |
| --- | --- |
| react | 100 |
| vue | 80 |`
    const html = marked.parse(md) as string
    expect(html).toContain('<table>')
    expect(html).toContain('<thead>')
    expect(html).toContain('<th>名称</th>')
    expect(html).toContain('<th>星数</th>')
    expect(html).toContain('<td>react</td>')
    expect(html).toContain('<td>100</td>')
    expect(html).toContain('<td>vue</td>')
    expect(html).toContain('<tbody>')
  })

  it('解析代码块为 <pre><code>', () => {
    const md = '```js\nconsole.log("hello")\n```'
    const html = marked.parse(md) as string
    expect(html).toContain('<pre>')
    expect(html).toContain('<code')
    expect(html).toContain('console.log')
  })

  it('代码块带语言类标记 (language-js)', () => {
    const md = '```js\nconst x = 1\n```'
    const html = marked.parse(md) as string
    expect(html).toMatch(/language-js/)
  })

  it('解析行内链接', () => {
    const md = '访问 [GitHub](https://github.com) 了解更多'
    const html = marked.parse(md) as string
    expect(html).toContain('<a href="https://github.com"')
    expect(html).toContain('GitHub</a>')
  })

  it('breaks: true 将单换行转为 <br>', () => {
    const md = '第一行\n第二行'
    const html = marked.parse(md) as string
    expect(html).toMatch(/<br\s*\/?>/)
  })

  it('解析加粗和行内代码', () => {
    const md = '这是 **加粗** 和 `代码`'
    const html = marked.parse(md) as string
    expect(html).toContain('<strong>加粗</strong>')
    expect(html).toContain('<code>代码</code>')
  })

  it('解析标题 h1/h2/h3', () => {
    const md = '# 一级\n## 二级\n### 三级'
    const html = marked.parse(md) as string
    expect(html).toContain('<h1>一级</h1>')
    expect(html).toContain('<h2>二级</h2>')
    expect(html).toContain('<h3>三级</h3>')
  })

  it('解析无序列表', () => {
    const md = '- 苹果\n- 香蕉\n- 橙子'
    const html = marked.parse(md) as string
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>苹果</li>')
    expect(html).toContain('<li>香蕉</li>')
    expect(html).toContain('<li>橙子</li>')
  })

  it('解析图片', () => {
    const md = '![alt 文本](https://example.com/img.png)'
    const html = marked.parse(md) as string
    expect(html).toContain('<img')
    expect(html).toContain('src="https://example.com/img.png"')
    expect(html).toContain('alt="alt 文本"')
  })

  it('解析 GFM 任务列表（checkbox）', () => {
    const md = '- [x] 完成\n- [ ] 未完成'
    const html = marked.parse(md) as string
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('完成')
    expect(html).toContain('未完成')
  })

  it('解析引用块', () => {
    const md = '> 这是一段引用'
    const html = marked.parse(md) as string
    expect(html).toContain('<blockquote>')
    expect(html).toContain('这是一段引用')
  })

  it('解析删除线 (GFM)', () => {
    const md = '~~删除内容~~'
    const html = marked.parse(md) as string
    expect(html).toContain('<del>删除内容</del>')
  })

  it('marked.parseInline 只解析行内语法，不生成块级 <p>', () => {
    const md = '文本 **加粗**'
    const html = marked.parseInline(md) as string
    expect(html).toContain('<strong>加粗</strong>')
    expect(html).not.toContain('<p>')
  })

  it('空字符串输入返回空字符串', () => {
    expect(marked.parse('')).toBe('')
  })
})
