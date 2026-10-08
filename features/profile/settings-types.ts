

export interface ProfileData {
  id: number
  name: string
  email: string
  phone: string
  bio: string
  avatar: string
  title: string
  motto: string
  location: string
  website: string
  github_url: string
  twitter_url: string
  tech_stack: string[]
}

export interface FollowCounts {
  following: number
  followers: number
}

export interface FollowUser {
  id: number
  name: string
  avatar: string | null
  bio: string | null
}
