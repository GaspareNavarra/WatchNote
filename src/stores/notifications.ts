import { defineStore } from 'pinia'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { PushNotifications } from '@capacitor/push-notifications'

const STORAGE_KEY = 'watchnote-notifications'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    enabled: false,
    ready: false,
  }),
  actions: {
    async init() {
      const { value } = await Preferences.get({ key: STORAGE_KEY })
      this.enabled = value === 'true'
      this.ready = true
    },

    async setEnabled(enabled: boolean) {
      if (enabled && Capacitor.isNativePlatform()) {
        const status = await PushNotifications.requestPermissions()
        if (status.receive !== 'granted') {
          await Preferences.set({ key: STORAGE_KEY, value: 'false' })
          this.enabled = false
          throw new Error('permission-denied')
        }
        await PushNotifications.register()
      }

      this.enabled = enabled
      await Preferences.set({ key: STORAGE_KEY, value: String(enabled) })
    },
  },
})
