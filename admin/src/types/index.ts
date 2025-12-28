export interface Track {
  _id: string
  title: string
  artist: string
  coverImage?: string
}
export interface Playlist {
  _id?: string
  name: string
  description?: string
  coverImage?: string
  isPublic?: boolean
  owner?: string
  tracks?: Track[]
  trackCount?: number
  followerCount?: number
  genres?: string[]
}