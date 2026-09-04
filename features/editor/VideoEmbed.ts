import { Node, mergeAttributes } from '@tiptap/core'

/**
 * 视频嵌入 Node —— YouTube / Bilibili。
 * 原 components/admin/PostEditor.tsx 与 components/dashboard/UserPostEditor.tsx 中定义逐字节相同，现统一收敛到编辑器内核。
 */
export const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      provider: { default: 'youtube' },
    }
  },
  parseHTML() { return [{ tag: 'div[data-video-embed]' }] },
  renderHTML({ HTMLAttributes }) {
    const { src, provider } = HTMLAttributes
    const raw = src ?? ''
    let iframeSrc = raw
    if (provider === 'bilibili') {
      const bvMatch = raw.match(/BV[\w]+/)
      iframeSrc = bvMatch ? `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&autoplay=0` : raw
    } else {
      const ytMatch = raw.match(/(?:v=|youtu\.be\/)([\w-]{11})/)
      iframeSrc = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : raw
    }
    return ['div', mergeAttributes({ 'data-video-embed': '' }, { 'data-src': src, 'data-provider': provider }, {
      class: 'video-embed-wrapper'
    }),
      ['iframe', { src: iframeSrc, allowfullscreen: 'true', frameborder: '0', allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' }]
    ]
  },
})
