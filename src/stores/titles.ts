import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import type { EpisodeRow, ExternalSource, TitleRow, TitleStatus, TitleType } from '../types/database'
import { useAuthStore } from './auth'

interface NewTitleInput {
  name: string
  type: TitleType
  status?: TitleStatus
  poster_url?: string | null
  overview?: string | null
  notes?: string | null
  rating?: number | null
  external_source?: ExternalSource | null
  external_id?: string | null
}

interface ImportedEpisode {
  episodeNumber: number
  name: string | null
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
    byStatus: (state) => (status: TitleStatus) => state.titles.filter((t) => t.status === status),
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

    async fetchAllEpisodes() {
      const { data, error } = await supabase.from('episodes').select('*')
      if (error) throw error
      const grouped: Record<string, EpisodeRow[]> = {}
      for (const ep of data ?? []) {
        if (!grouped[ep.title_id]) grouped[ep.title_id] = []
        grouped[ep.title_id].push(ep)
      }
      this.episodesByTitle = grouped
      return grouped
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

    async importEpisodes(titleId: string, seasonNumber: number, episodes: ImportedEpisode[]) {
      if (episodes.length === 0) return []
      const rows = episodes.map((e) => ({
        title_id: titleId,
        season_number: seasonNumber,
        episode_number: e.episodeNumber,
        name: e.name,
      }))
      const { data, error } = await supabase.from('episodes').insert(rows).select()
      if (error) throw error
      const existing = this.episodesByTitle[titleId] ?? []
      this.episodesByTitle[titleId] = [...existing, ...(data ?? [])]
      await this.recomputeStatus(titleId)
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
      await this.recomputeStatus(titleId)
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
      await this.recomputeStatus(titleId)
      return data
    },

    async deleteEpisode(titleId: string, episodeId: string) {
      const { error } = await supabase.from('episodes').delete().eq('id', episodeId)
      if (error) throw error
      this.episodesByTitle[titleId] = (this.episodesByTitle[titleId] ?? []).filter((e) => e.id !== episodeId)
      await this.recomputeStatus(titleId)
    },

    async recomputeStatus(titleId: string) {
      const title = this.titles.find((t) => t.id === titleId)
      if (!title || title.status === 'dropped') return
      const episodes = this.episodesByTitle[titleId] ?? []
      const watched = episodes.filter((e) => e.watched).length
      const total = episodes.length
      const next: TitleStatus =
        total === 0 || watched === 0 ? 'plan_to_watch' : watched === total ? 'completed' : 'watching'
      if (next !== title.status) await this.updateTitle(titleId, { status: next })
    },

    async dropTitle(id: string) {
      return this.updateTitle(id, { status: 'dropped' })
    },

    async undropTitle(id: string) {
      const title = this.titles.find((t) => t.id === id)
      if (!title) return
      if (title.type === 'movie') {
        return this.updateTitle(id, { status: 'plan_to_watch' })
      }
      const episodes = this.episodesByTitle[id] ?? (await this.fetchEpisodes(id))
      const watched = episodes.filter((e) => e.watched).length
      const total = episodes.length
      const next: TitleStatus = total === 0 || watched === 0 ? 'plan_to_watch' : watched === total ? 'completed' : 'watching'
      return this.updateTitle(id, { status: next })
    },
  },
})
