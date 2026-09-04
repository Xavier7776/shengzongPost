'use client'

import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface UseImageUploadOptions {
  editor: Editor | null
  /** 封面上传成功后回调（用户投稿编辑器用它记录 Cloudinary public id） */
  onCoverUploaded?: (data: { url?: string; id?: number }) => void
  /** 重新上传封面前先删除上一张（仅用户投稿编辑器需要） */
  deletePreviousCover?: () => void
}

/**
 * 编辑器内插图 / 封面图上传。管理端与用户端上传逻辑一致，
 * 差异只有「是否删除旧封面」与「是否记录返回的图片 id」。
 */
export function useImageUpload({ editor, onCoverUploaded, deletePreviousCover }: UseImageUploadOptions) {
  const imgFileRef  = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  const [uploadingImg, setUploadingImg]     = useState(false)
  const [imgUploadError, setImgUploadError] = useState('')
  const [uploadingCover, setUploadingCover]     = useState(false)
  const [coverUploadError, setCoverUploadError] = useState('')

  async function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > MAX_IMAGE_BYTES) { setImgUploadError('图片不能超过 10MB'); return }
    if (!IMAGE_MIME_TYPES.includes(file.type)) { setImgUploadError('仅支持 JPG/PNG/WebP/GIF'); return }
    setUploadingImg(true); setImgUploadError('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/posts/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setImgUploadError(data.error ?? '上传失败'); return }
      editor?.chain().focus().setImage({ src: data.url, alt: file.name.replace(/\.[^.]+$/, '') }).run()
    } catch { setImgUploadError('网络错误，请重试') }
    finally { setUploadingImg(false); if (imgFileRef.current) imgFileRef.current.value = '' }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > MAX_IMAGE_BYTES) { setCoverUploadError('图片不能超过 10MB'); return }
    if (!IMAGE_MIME_TYPES.includes(file.type)) { setCoverUploadError('仅支持 JPG/PNG/WebP/GIF'); return }
    setUploadingCover(true); setCoverUploadError('')
    try {
      deletePreviousCover?.()
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/posts/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setCoverUploadError(data.error ?? '上传失败'); return }
      onCoverUploaded?.(data)
    } catch { setCoverUploadError('网络错误，请重试') }
    finally { setUploadingCover(false); if (coverFileRef.current) coverFileRef.current.value = '' }
  }

  return {
    imgFileRef,
    coverFileRef,
    uploadingImg, setUploadingImg, imgUploadError, setImgUploadError, handleImgUpload,
    uploadingCover, coverUploadError, setCoverUploadError, handleCoverUpload,
  }
}
