import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import type { ProfileRow } from '../types/database'
import { useAuthStore } from './auth'
import { i18n } from '../i18n'

const AVATAR_BUCKET = 'avatars'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null as ProfileRow | null,
    loading: false,
    uploading: false,
    error: null as string | null,
  }),
  getters: {
    isAdmin: (state) => state.profile?.is_admin ?? false,
  },
  actions: {
    async fetchProfile() {
      const auth = useAuthStore()
      if (!auth.user) return
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.user.id)
        .maybeSingle()
      if (error) {
        this.error = error.message
        this.loading = false
        return
      }
      if (data) {
        this.profile = data
      } else {
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: auth.user.id })
          .select()
          .single()
        if (insertError) {
          this.error = insertError.message
        } else {
          this.profile = created
        }
      }
      this.loading = false
    },

    async updateProfile(patch: { nickname?: string; bio?: string }) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', auth.user.id)
        .select()
        .single()
      if (error) {
        if (error.code === '23505') {
          throw new Error(i18n.global.t('settings.account.nicknameTaken'))
        }
        throw error
      }
      this.profile = data
      return data
    },

    async uploadAvatar(file: Blob) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      this.uploading = true
      try {
        const path = `${auth.user.id}/avatar`
        const { error: uploadError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
        const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`

        const { data, error } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', auth.user.id)
          .select()
          .single()
        if (error) throw error
        this.profile = data
        return avatarUrl
      } finally {
        this.uploading = false
      }
    },
  },
})
