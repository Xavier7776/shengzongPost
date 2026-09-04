export interface Attachment {
  url: string
  filename: string
  size: number
}

export interface PostEditorInitialData {
  slug: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  published?: boolean
  cover_image?: string | null
  author_id?: number | null
  attachments?: Attachment[]
}

export type EditorMode = 'new' | 'edit'
