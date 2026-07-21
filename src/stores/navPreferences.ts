import { defineStore } from 'pinia'

const STORAGE_KEY = 'watchnote-nav-autohide'

function loadInitial(): { autoHide: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      return { autoHide: raw === 'true' }
    }
  } catch {
    // ignore unavailable storage
  }
  return { autoHide: true }
}

export const useNavPreferencesStore = defineStore('navPreferences', {
  state: () => loadInitial(),
  actions: {
    setAutoHide(value: boolean) {
      this.autoHide = value
      try {
        localStorage.setItem(STORAGE_KEY, String(value))
      } catch {
        // ignore unavailable storage
      }
    },
  },
})
