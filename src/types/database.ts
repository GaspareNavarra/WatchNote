export type TitleType = 'movie' | 'series' | 'anime'
export type TitleStatus = 'plan_to_watch' | 'watching' | 'completed' | 'dropped'

export type TitleRow = {
  id: string
  user_id: string
  name: string
  type: TitleType
  status: TitleStatus
  poster_url: string | null
  notes: string | null
  rating: number | null
  created_at: string
  updated_at: string
}

export type EpisodeRow = {
  id: string
  title_id: string
  season_number: number
  episode_number: number
  name: string | null
  watched: boolean
  watched_at: string | null
  created_at: string
}

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13'
  }
  public: {
    Tables: {
      titles: {
        Row: TitleRow
        Insert: Partial<TitleRow> & { name: string; type: TitleType; user_id: string }
        Update: Partial<TitleRow>
        Relationships: []
      }
      episodes: {
        Row: EpisodeRow
        Insert: Partial<EpisodeRow> & { title_id: string; season_number: number; episode_number: number }
        Update: Partial<EpisodeRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
