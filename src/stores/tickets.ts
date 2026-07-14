import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import type { FeatureRequestRow, FeatureRequestStatus } from '../types/database'

type TicketProfile = { id: string; nickname: string | null }

const RECENT_LIMIT = 6

export const useTicketsStore = defineStore('tickets', {
  state: () => ({
    tickets: [] as FeatureRequestRow[],
    profilesById: {} as Record<string, TicketProfile>,
    loading: false,
    error: null as string | null,
    showingAll: false,
  }),
  actions: {
    async loadProfilesFor(tickets: FeatureRequestRow[]) {
      const userIds = [...new Set(tickets.map((r) => r.user_id))]
      if (userIds.length === 0) return
      const { data: profiles } = await supabase.from('profiles').select('id, nickname').in('id', userIds)
      this.profilesById = {
        ...this.profilesById,
        ...Object.fromEntries((profiles ?? []).map((p) => [p.id, p])),
      }
    },

    async fetchRecent() {
      this.loading = true
      this.error = null
      this.showingAll = false
      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(RECENT_LIMIT)
      if (error) {
        this.error = error.message
        this.loading = false
        return
      }
      this.tickets = data ?? []
      await this.loadProfilesFor(this.tickets)
      this.loading = false
    },

    async fetchAll() {
      this.loading = true
      this.error = null
      this.showingAll = true
      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        this.error = error.message
        this.loading = false
        return
      }
      this.tickets = data ?? []
      await this.loadProfilesFor(this.tickets)
      this.loading = false
    },

    async updateStatus(id: string, status: FeatureRequestStatus) {
      const { data, error } = await supabase
        .from('feature_requests')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const idx = this.tickets.findIndex((r) => r.id === id)
      if (idx !== -1) this.tickets[idx] = data
      return data
    },

    async deleteTicket(id: string) {
      return this.updateStatus(id, 'deleted')
    },
  },
})
