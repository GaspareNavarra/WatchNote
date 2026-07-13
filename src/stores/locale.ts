import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'
import { i18n, type AppLocale } from '../i18n'

const STORAGE_KEY = 'watchnote-locale'

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    locale: 'it' as AppLocale,
    ready: false,
  }),
  actions: {
    async init() {
      const { value } = await Preferences.get({ key: STORAGE_KEY })
      if (value === 'it' || value === 'en') {
        this.locale = value
      }
      i18n.global.locale.value = this.locale
      this.ready = true
    },

    async setLocale(locale: AppLocale) {
      this.locale = locale
      i18n.global.locale.value = locale
      await Preferences.set({ key: STORAGE_KEY, value: locale })
    },
  },
})
