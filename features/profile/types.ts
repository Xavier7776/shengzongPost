

export interface UserInfo {
  id: number
  name: string
  avatar: string | null
  bio: string | null
  location?: string | null
  website?: string | null
  github_url?: string | null
  twitter_url?: string | null
  motto?: string | null
  title?: string | null
  tech_stack?: string[]
  createdAt?: string | null
}

export interface FollowUser {
  id: number
  name: string
  avatar: string | null
  bio: string | null
  isMutual: boolean
}

export interface FollowInfo {
  isFollowing: boolean
  isMutual: boolean
  following: number
  followers: number
}

export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string | null
  tags: string[] | null
  created_at: string
  cover_image: string | null
  views?: number
  reactions?: number
  comments?: number
  read_time?: number
}

export type ProfileTab = 'posts' | 'likes' | 'bookmarks' | 'history'

export interface HistoryItem {
  slug: string
  title: string
  readAt: string
}
