import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import type { EpisodeRow, TitleRow, TitleStatus, TitleType } from '../types/database'
import { useAuthStore } from './auth'

interface NewTitleInput {
  name: string
  type: TitleType
  status?: TitleStatus
  poster_url?: string | null
  notes?: string | null
  rating?: number | null
}

export const useTitlesStore = defineStore('titles', {
  state: () => ({
    titles: [] as TitleRow[],
    episodesByTitle: {} as Record<string, EpisodeRow[]>,
    loading: false,
    error: null as string | null,
  }),
  getters: {
    byType: (state) => (type: TitleType) => state.titles.filter((t) => t.type === type),
    progress: (state) => (titleId: string) => {
      const episodes = state.episodesByTitle[titleId] ?? []
      if (episodes.length === 0) return { watched: 0, total: 0, percent: 0 }
      const watched = episodes.filter((e) => e.watched).length
      return { watched, total: episodes.length, percent: Math.round((watched / episodes.length) * 100) }
    },
  },
  actions: {
    async fetchTitles() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        this.error = error.message
      } else {
        this.titles = data ?? []
      }
      this.loading = false
    },

    async addTitle(input: NewTitleInput) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('titles')
        .insert({ ...input, user_id: auth.user.id })
        .select()
        .single()
      if (error) throw error
      this.titles.unshift(data)
      return data
    },

    async updateTitle(id: string, changes: Partial<TitleRow>) {
      const { data, error } = await supabase
        .from('titles')
        .update(changes)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const idx = this.titles.findIndex((t) => t.id === id)
      if (idx !== -1) this.titles[idx] = data
      return data
    },

    async deleteTitle(id: string) {
      const { error } = await supabase.from('titles').delete().eq('id', id)
      if (error) throw error
      this.titles = this.titles.filter((t) => t.id !== id)
      delete this.episodesByTitle[id]
    },

    async fetchEpisodes(titleId: string) {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('title_id', titleId)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true })
      if (error) throw error
      this.episodesByTitle[titleId] = data ?? []
      return data ?? []
    },

    async addSeason(titleId: string, seasonNumber: number, episodeCount: number) {
      const rows = Array.from({ length: episodeCount }, (_, i) => ({
        title_id: titleId,
        season_number: seasonNumber,
        episode_number: i + 1,
      }))
      const { data, error } = await supabase.from('episodes').insert(rows).select()
      if (error) throw error
      const existing = this.episodesByTitle[titleId] ?? []
      this.episodesByTitle[titleId] = [...existing, ...(data ?? [])]
      return data ?? []
    },

    async addEpisode(titleId: string, seasonNumber: number, episodeNumber: number, name?: string) {
      const { data, error } = await supabase
        .from('episodes')
        .insert({ title_id: titleId, season_number: seasonNumber, episode_number: episodeNumber, name })
        .select()
        .single()
      if (error) throw error
      const existing = this.episodesByTitle[titleId] ?? []
      this.episodesByTitle[titleId] = [...existing, data]
      return data
    },

    async setEpisodeWatched(titleId: string, episodeId: string, watched: boolean) {
      const { data, error } = await supabase
        .from('episodes')
        .update({ watched })
        .eq('id', episodeId)
        .select()
        .single()
      if (error) throw error
      const existing = this.episodesByTitle[titleId] ?? []
      const idx = existing.findIndex((e) => e.id === episodeId)
      if (idx !== -1) existing[idx] = data
      this.episodesByTitle[titleId] = [...existing]
      return data
    },

    async deleteEpisode(titleId: string, episodeId: string) {
      const { error } = await supabase.from('episodes').delete().eq('id', episodeId)
      if (error) throw error
      this.episodesByTitle[titleId] = (this.episodesByTitle[titleId] ?? []).filter((e) => e.id !== episodeId)
    },
  },
})
