import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import type { FeatureRequestRow } from '../types/database'
import { useAuthStore } from './auth'

const DAILY_LIMIT = 3

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  )
}

export const useFeatureRequestsStore = defineStore('featureRequests', {
  state: () => ({
    requests: [] as FeatureRequestRow[],
    loading: false,
    error: null as string | null,
  }),
  getters: {
    remainingToday: (state) => {
      const todayCount = state.requests.filter((r) => isToday(r.created_at)).length
      return Math.max(0, DAILY_LIMIT - todayCount)
    },
  },
  actions: {
    async fetchRequests() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        this.error = error.message
      } else {
        this.requests = data ?? []
      }
      this.loading = false
    },

    async createRequest(title: string, description: string) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('feature_requests')
        .insert({ title, description: description || null, user_id: auth.user.id })
        .select()
        .single()
      if (error) throw error
      this.requests.unshift(data)
      return data
    },
  },
})
