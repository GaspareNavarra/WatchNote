import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

export async function getAppVersion(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await CapacitorApp.getInfo()
      return info.version
    } catch {
      // fall through to web fallback
    }
  }
  return __APP_VERSION__
}
