import { createI18n } from 'vue-i18n'
import it from './locales/it'
import en from './locales/en'

export type AppLocale = 'it' | 'en'

export const i18n = createI18n({
  legacy: false,
  locale: 'it',
  fallbackLocale: 'it',
  messages: { it, en },
})
