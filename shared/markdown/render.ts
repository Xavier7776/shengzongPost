import { Marked } from 'marked'
import { sanitizeRichHtml } from './sanitize'

const markdown = new Marked({ gfm: true, breaks: true, async: false })
export const renderMarkdown = (source: string) => sanitizeRichHtml(markdown.parse(source) as string)
export const renderInlineMarkdown = (source: string) => sanitizeRichHtml(markdown.parseInline(source) as string)
