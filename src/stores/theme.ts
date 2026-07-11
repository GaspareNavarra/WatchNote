import { defineStore } from 'pinia'
import { updatePrimaryPalette } from '@primeuix/themes'
import type { PaletteDesignToken } from '@primeuix/themes/types'

export type ThemeMode = 'light' | 'dark'
export type ThemeVariant = 'primary' | 'secondary' | 'tertiary'

const STORAGE_KEY = 'watchnote-theme'

// Verde (default Aura/emerald)
const PRIMARY_PALETTE: PaletteDesignToken = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
}

// Ciano/blu #00478f
const SECONDARY_PALETTE: PaletteDesignToken = {
  50: '#eaf3fb',
  100: '#cfe3f4',
  200: '#9fc7ea',
  300: '#63a2da',
  400: '#2f7bc4',
  500: '#0e5aa1',
  600: '#0a4c8c',
  700: '#00478f',
  800: '#073a6e',
  900: '#062c53',
  950: '#031a33',
}

// Viola
const TERTIARY_PALETTE: PaletteDesignToken = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
  950: '#3b0764',
}

const PALETTES: Record<ThemeVariant, PaletteDesignToken> = {
  primary: PRIMARY_PALETTE,
  secondary: SECONDARY_PALETTE,
  tertiary: TERTIARY_PALETTE,
}

function loadInitial(): { mode: ThemeMode; variant: ThemeVariant } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        (parsed.mode === 'light' || parsed.mode === 'dark') &&
        (parsed.variant === 'primary' || parsed.variant === 'secondary' || parsed.variant === 'tertiary')
      ) {
        return parsed
      }
    }
  } catch {
    // ignore malformed storage
  }
  return { mode: 'dark', variant: 'tertiary' }
}

export const useThemeStore = defineStore('theme', {
  state: () => loadInitial(),
  actions: {
    setMode(mode: ThemeMode) {
      this.mode = mode
      this.apply()
    },
    setVariant(variant: ThemeVariant) {
      this.variant = variant
      this.apply()
    },
    toggleMode() {
      this.setMode(this.mode === 'light' ? 'dark' : 'light')
    },
    apply() {
      const root = document.documentElement
      root.classList.toggle('dark-mode', this.mode === 'dark')
      root.setAttribute('data-variant', this.variant)
      updatePrimaryPalette(PALETTES[this.variant])
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: this.mode, variant: this.variant }))
    },
  },
})
