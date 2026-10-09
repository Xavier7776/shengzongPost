/**
 * Shared HTML allowlist for server-rendered blog posts and Tiptap editor previews.
 * parse5 parses malformed markup into an HTML tree; the serializer escapes all text and
 * attribute values. We never trust event handlers, styles, arbitrary embeds or SVG/MathML.
 */
import { parseFragment, serialize } from 'parse5'

type HtmlAttr = { name: string; value: string }
type HtmlNode = {
  nodeName: string
  tagName?: string
  namespaceURI?: string
  attrs?: HtmlAttr[]
  childNodes?: HtmlNode[]
}
const ALLOWED_TAGS = new Set([
  'p','h1','h2','h3','h4','strong','b','em','i','u','s','del','sup','sub',
  'blockquote','ul','ol','li','hr','br','a','span','div','mark',
  'pre','code','figure','figcaption','img','table','thead','tbody','tfoot','tr','td','th',
])
// Elements whose content is active, browser-special or capable of altering the document.
const DROP_WITH_CHILDREN = new Set([
  'script','style','template','svg','math','foreignobject','object','embed',
  'form','input','textarea','select','button','link','meta','base','frame','frameset',
  'noscript','audio','video','canvas','source','picture',
])
const IMAGE_HOSTS = new Set([
  'res.cloudinary.com','images.unsplash.com','raw.githubusercontent.com',
  'user-images.githubusercontent.com','avatars.githubusercontent.com',
  'test.fukit.cn','www.zshengzong.top','zshengzong.top',
])
const attr = (node: HtmlNode, name: string) =>
  node.attrs?.find(item => item.name.toLowerCase() === name)?.value ?? null
const safeRelative = (v: string) => /^\/(?!\/|\\)/.test(v) || /^#[A-Za-z0-9_-]{1,100}$/.test(v)

function safeLink(raw: string | null): string | null {
  if (!raw || raw.length > 2048) return null
  const value = raw.trim()
  if (safeRelative(value)) return value
  if (/^mailto:[^\s<>]+@[^\s<>]+$/i.test(value)) return value
  try {
    const parsed = new URL(value)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.hostname && !parsed.username && !parsed.password ? parsed.href : null
  } catch { return null }
}
function safeImage(raw: string | null): string | null {
  if (!raw || raw.length > 2048) return null
  const value = raw.trim()
  if (/^\/(?!\/|\\)/.test(value)) return value
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' && IMAGE_HOSTS.has(parsed.hostname) &&
      !parsed.username && !parsed.password ? parsed.href : null
  } catch { return null }
}
function safeVideo(raw: string | null): string | null {
  if (!raw || raw.length > 2048) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) return null
    if (['www.youtube.com','www.youtube-nocookie.com'].includes(url.hostname) &&
        /^\/embed\/[A-Za-z0-9_-]{11}$/.test(url.pathname)) {
      return 'https://www.youtube-nocookie.com' + url.pathname
    }
    const bv = url.searchParams.get('bvid')
    if (url.hostname === 'player.bilibili.com' && url.pathname === '/player.html' &&
        bv && /^BV[A-Za-z0-9]{10}$/.test(bv)) {
      return 'https://player.bilibili.com/player.html?bvid=' + bv + '&autoplay=0'
    }
  } catch {}
  return null
}

function cleanAttrs(node: HtmlNode) {
  const name = node.tagName!
  if (name === 'a') {
    const href = safeLink(attr(node,'href'))
    node.attrs = href ? [
      { name:'href', value:href },
      ...(/^https?:/i.test(href) ? [
        { name:'target', value:'_blank' },
        { name:'rel', value:'noopener noreferrer nofollow' },
      ] : []),
    ] : []
    return
  }
  if (name === 'img') {
    const src = safeImage(attr(node,'src'))
    node.attrs = src ? [
      { name:'src', value:src },
      { name:'alt', value:(attr(node,'alt') ?? '').slice(0,250) },
      { name:'loading', value:'lazy' },
      { name:'decoding', value:'async' },
    ] : []
    if (!src) node.tagName = 'span'
    return
  }
  if (name === 'td' || name === 'th') {
    const safeCell: HtmlAttr[] = []
    for(const dimension of ['rowspan','colspan']) {
      const size = Number(attr(node,dimension))
      if (Number.isInteger(size) && size >= 1 && size <= 20) {
        safeCell.push({name:dimension,value:String(size)})
      }
    }
    node.attrs = safeCell
    return
  }
  if (name === 'code' || name === 'span' || name === 'div') {
    const classes = (attr(node,'class') ?? '').split(/\s+/).filter(x =>
      /^(?:hljs(?:-[a-z0-9_-]+)?|language-[a-z0-9_-]+|video-embed-wrapper)$/i.test(x))
    node.attrs = classes.length ? [{name:'class',value:classes.join(' ')}] : []
    return
  }
  node.attrs = []
}

function sanitizeChildren(parent: HtmlNode, depth: number): void {
  if (!parent.childNodes || depth > 100) { parent.childNodes=[]; return }
  const children: HtmlNode[] = []
  for(const node of parent.childNodes) {
    if (node.nodeName === '#text') { children.push(node); continue }
    const name = (node.tagName ?? '').toLowerCase()
    if (!name || DROP_WITH_CHILDREN.has(name) || (node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/1999/xhtml')) continue
    if (name === 'iframe') {
      const src = safeVideo(attr(node,'src'))
      if (!src) continue
      node.attrs = [
        {name:'src',value:src}, {name:'loading',value:'lazy'},
        {name:'referrerpolicy',value:'no-referrer'},
        {name:'sandbox',value:'allow-scripts allow-same-origin allow-presentation'},
        {name:'allowfullscreen',value:''},
      ]
      node.childNodes=[]
      children.push(node)
      continue
    }
    sanitizeChildren(node, depth+1)
    if (!ALLOWED_TAGS.has(name)) {
      children.push(...(node.childNodes ?? []))
      continue
    }
    cleanAttrs(node)
    if (name === 'img' && node.tagName === 'span') {
      node.nodeName='span'
      node.childNodes=[]
      node.attrs=[]
    }
    children.push(node)
  }
  parent.childNodes=children
}

export function sanitizeRichHtml(html: string): string {
  if (html.length > 1_000_000) throw new Error('HTML exceeds 1 MB security limit')
  const root = parseFragment(html) as unknown as HtmlNode
  sanitizeChildren(root, 0)
  return serialize(root as Parameters<typeof serialize>[0])
}

export function sanitizePostContent(content: string): string {
  return content.trimStart().startsWith('<') ? sanitizeRichHtml(content) : content
}
