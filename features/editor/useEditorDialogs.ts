'use client'

import { useCallback, useState } from 'react'
import type { Editor } from '@tiptap/react'

/**
 * 工具栏上三个内联弹窗（链接 / 表格 / 图片 URL）与视频插入。
 * 两个编辑器实现逐字节相同，故整体抽出。
 */
export function useEditorDialogs(editor: Editor | null) {
  const [linkOpen, setLinkOpen]   = useState(false)
  const [linkUrl, setLinkUrl]     = useState('')
  const [linkText, setLinkText]   = useState('')

  const [tableOpen, setTableOpen] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [tableHeader, setTableHeader] = useState(true)

  const [imgUrlOpen, setImgUrlOpen] = useState(false)
  const [imgUrl, setImgUrl]         = useState('')
  const [imgAlt, setImgAlt]         = useState('')

  const openLinkPopup = useCallback(() => {
    const { from, to, empty } = editor?.state.selection ?? { from: 0, to: 0, empty: true }
    setLinkText(empty ? '' : editor?.state.doc.textBetween(from, to) ?? '')
    setLinkUrl(editor?.getAttributes('link').href ?? '')
    setLinkOpen(true)
  }, [editor])

  const applyLink = useCallback(() => {
    if (!linkUrl) { editor?.chain().focus().unsetLink().run(); setLinkOpen(false); return }
    let chain = editor?.chain().focus()
    if (linkText) chain = chain?.insertContent(`<a href="${linkUrl}">${linkText}</a>`)
    else chain = chain?.setLink({ href: linkUrl })
    chain?.run()
    setLinkOpen(false); setLinkUrl(''); setLinkText('')
  }, [editor, linkUrl, linkText])

  const applyTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: tableHeader }).run()
    setTableOpen(false)
  }, [editor, tableRows, tableCols, tableHeader])

  const applyImgUrl = useCallback(() => {
    if (!imgUrl) { setImgUrlOpen(false); return }
    editor?.chain().focus().setImage({ src: imgUrl, alt: imgAlt || undefined }).run()
    setImgUrlOpen(false); setImgUrl(''); setImgAlt('')
  }, [editor, imgUrl, imgAlt])

  const handleInsertVideo = useCallback(() => {
    const url = window.prompt('粘贴 YouTube 或 Bilibili 链接')
    if (!url) return
    const provider = url.includes('bilibili') ? 'bilibili' : 'youtube'
    editor?.chain().focus().insertContent({ type: 'videoEmbed', attrs: { src: url, provider } }).run()
  }, [editor])

  return {
    link: { open: linkOpen, setOpen: setLinkOpen, url: linkUrl, setUrl: setLinkUrl, text: linkText, setText: setLinkText, openPopup: openLinkPopup, apply: applyLink },
    table: { open: tableOpen, setOpen: setTableOpen, rows: tableRows, setRows: setTableRows, cols: tableCols, setCols: setTableCols, withHeader: tableHeader, setWithHeader: setTableHeader, apply: applyTable },
    imgUrl: { open: imgUrlOpen, setOpen: setImgUrlOpen, url: imgUrl, setUrl: setImgUrl, alt: imgAlt, setAlt: setImgAlt, apply: applyImgUrl },
    insertVideo: handleInsertVideo,
  }
}
