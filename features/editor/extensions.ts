import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table as TableExtension, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import type { Extensions } from '@tiptap/core'
import { VideoEmbed } from './VideoEmbed'

export const lowlight = createLowlight(common)

export const EDITOR_PROSE_CLASS = 'focus:outline-none min-h-[60vh] px-10 py-8'

/**
 * 两个编辑器共用的 Tiptap 扩展集。
 * 唯一差异是 Placeholder 文案，通过参数传入。
 */
export function buildExtensions(placeholder: string): Extensions {
  return [
    StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false }),
    Image.configure({ HTMLAttributes: { class: 'rounded-2xl max-w-full h-auto shadow-md my-6' } }),
    LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline underline-offset-2' } }),
    Placeholder.configure({ placeholder }),
    TableExtension.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader,
    CharacterCount,
    CodeBlockLowlight.configure({ lowlight }),
    VideoEmbed,
  ]
}
