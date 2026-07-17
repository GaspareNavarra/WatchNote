export type TitleType = 'movie' | 'series' | 'anime'
export type TitleStatus = 'plan_to_watch' | 'watching' | 'completed' | 'dropped'
export type ExternalSource = 'tmdb' | 'jikan' | 'anilist'

export type TitleRow = {
  id: string
  user_id: string
  name: string
  type: TitleType
  status: TitleStatus
  poster_url: string | null
  overview: string | null
  notes: string | null
  rating: number | null
  external_source: ExternalSource | null
  external_id: string | null
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

export type ProfileRow = {
  id: string
  nickname: string | null
  bio: string | null
  avatar_url: string | null
  is_admin: boolean
  friend_code: string
  created_at: string
  updated_at: string
}

export type FeatureRequestStatus = 'pending' | 'in_review' | 'done' | 'rejected' | 'deleted'

export type FeatureRequestRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  status: FeatureRequestStatus
  created_at: string
  updated_at: string
}

export type FriendRequestStatus = 'pending' | 'accepted'

export type FriendRequestRow = {
  id: string
  sender_id: string
  receiver_id: string
  status: FriendRequestStatus
  created_at: string
  updated_at: string
}

export type ConversationRow = {
  id: string
  user_a: string
  user_b: string
  created_at: string
  last_message_at: string
}

export type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export type ProfileSearchResult = {
  id: string
  nickname: string | null
  avatar_url: string | null
  friend_code: string
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
      feature_requests: {
        Row: FeatureRequestRow
        Insert: Partial<FeatureRequestRow> & { title: string; user_id: string }
        Update: Partial<FeatureRequestRow>
        Relationships: []
      }
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & { id: string }
        Update: Partial<ProfileRow>
        Relationships: []
      }
      friend_requests: {
        Row: FriendRequestRow
        Insert: Partial<FriendRequestRow> & { sender_id: string; receiver_id: string }
        Update: Partial<FriendRequestRow>
        Relationships: []
      }
      conversations: {
        Row: ConversationRow
        Insert: Partial<ConversationRow> & { user_a: string; user_b: string }
        Update: Partial<ConversationRow>
        Relationships: []
      }
      messages: {
        Row: MessageRow
        Insert: Partial<MessageRow> & { conversation_id: string; sender_id: string; body: string }
        Update: Partial<MessageRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      nickname_available: {
        Args: { p_nickname: string }
        Returns: boolean
      }
      search_profiles: {
        Args: { p_query: string }
        Returns: ProfileSearchResult[]
      }
    }
  }
}
