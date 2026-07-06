import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { supabase } from '../lib/supabase'

const NATIVE_OAUTH_REDIRECT = 'com.watchnote.app://login-callback'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as Session | null,
    user: null as User | null,
    initialized: false,
    deepLinkListenerRegistered: false,
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

      if (Capacitor.isNativePlatform() && !this.deepLinkListenerRegistered) {
        this.deepLinkListenerRegistered = true
        CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
          if (!url.startsWith(NATIVE_OAUTH_REDIRECT)) return
          try {
            await supabase.auth.exchangeCodeForSession(url)
          } finally {
            await Browser.close()
          }
        })
      }
    },

    async signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      this.session = data.session
      this.user = data.user
    },

    async signUp(email: string, password: string) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      this.session = data.session
      this.user = data.user
    },

    async signInWithGoogle() {
      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: NATIVE_OAUTH_REDIRECT,
            skipBrowserRedirect: true,
          },
        })
        if (error) throw error
        if (data.url) {
          await Browser.open({ url: data.url })
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        })
        if (error) throw error
      }
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      this.session = null
      this.user = null
    },
  },
})
