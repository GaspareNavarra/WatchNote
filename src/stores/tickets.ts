import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import type { FeatureRequestRow, FeatureRequestStatus } from '../types/database'

type TicketProfile = { id: string; nickname: string | null }

export const useTicketsStore = defineStore('tickets', {
  state: () => ({
    tickets: [] as FeatureRequestRow[],
    profilesById: {} as Record<string, TicketProfile>,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
      if (error) {
        this.error = error.message
        this.loading = false
        return
      }
      this.tickets = data ?? []

      const userIds = [...new Set(this.tickets.map((r) => r.user_id))]
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, nickname').in('id', userIds)
        this.profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
      }
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
      const { error } = await supabase.from('feature_requests').update({ status: 'deleted' }).eq('id', id)
      if (error) throw error
      this.tickets = this.tickets.filter((r) => r.id !== id)
    },
  },
})
