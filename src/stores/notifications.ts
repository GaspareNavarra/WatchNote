import { defineStore } from 'pinia'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { LocalNotifications } from '@capacitor/local-notifications'

const STORAGE_KEY = 'watchnote-notifications'

// Local (not push) notifications: shown while the app/tab is open in the background,
// triggered from real events (new chat messages) rather than a server push service —
// no Firebase/APNs project is configured, so true closed-app push isn't available yet.
let nextNotificationId = 1

async function requestPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const status = await LocalNotifications.requestPermissions()
    return status.display === 'granted'
  }
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

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
      if (enabled) {
        const granted = await requestPermission()
        if (!granted) {
          await Preferences.set({ key: STORAGE_KEY, value: 'false' })
          this.enabled = false
          throw new Error('permission-denied')
        }
      }

      this.enabled = enabled
      await Preferences.set({ key: STORAGE_KEY, value: String(enabled) })
    },

    async notify(title: string, body: string) {
      if (!this.enabled) return
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [{ id: nextNotificationId++, title, body }],
        })
        return
      }
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      new Notification(title, { body })
    },
  },
})
