export type Fragrance = {
  id: string
  house: string
  name: string
  type: string
  category: 'designer' | 'niche' | 'ultra-niche' | 'middle-eastern'
  scent_family: string
  top_notes: string[]
  heart_notes: string[]
  base_notes: string[]
  attributes: string[]
  seasons: string[]
  avg_rating: number
  review_count: number
  bottle_image_url: string | null
}

export type Profile = {
  id: string
  handle: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export type CollectionItem = {
  id: string
  user_id: string
  fragrance_id: string
  status: 'owned' | 'tried' | 'wishlist'
  created_at: string
  fragrance?: Fragrance
}

export type Review = {
  id: string
  user_id: string
  fragrance_id: string
  rating: number
  body: string
  created_at: string
  profile?: Profile
}

export type Wear = {
  id: string
  user_id: string
  fragrance_id: string
  worn_at: string
  note: string | null
  is_public: boolean
  fragrance?: Fragrance
}

export type Challenge = {
  id: string
  title: string
  description: string
  prompt: string
  badge_name: string
  starts_at: string
  ends_at: string
}

export type LeaderboardEntry = {
  id: string
  display_name: string
  handle: string
  xp: number
}
