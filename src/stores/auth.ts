import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { i18n } from '../i18n'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as Session | null,
    user: null as User | null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.session,
  },
  actions: {
    async init() {
      const { data } = await supabase.auth.getSession()
      this.session = data.session
      this.user = data.session?.user ?? null
      this.initialized = true

      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
      })
    },

    async signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error(i18n.global.t('auth.login.invalidCredentials'))
        }
        throw error
      }
      this.session = data.session
      this.user = data.user
    },

    async signUp(email: string, password: string, nickname: string) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname } },
      })
      if (error) throw error
      // When both "Confirm email" and "Confirm phone" are enabled in Supabase, signing up with an
      // already-registered (and confirmed) email returns a fake success with no identities, instead
      // of an error, to avoid leaking which emails are registered. Surface it as an error ourselves,
      // since no confirmation email is actually sent in this case.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error(i18n.global.t('auth.register.alreadyRegistered'))
      }
      this.session = data.session
      this.user = data.user
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      this.session = null
      this.user = null
    },

    async updateEmail(newEmail: string) {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
    },

    async updatePassword(newPassword: string) {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
  },
})