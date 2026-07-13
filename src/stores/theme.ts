import { defineStore } from 'pinia'
import { updatePrimaryPalette } from '@primeuix/themes'
import type { PaletteDesignToken } from '@primeuix/themes/types'

export type ThemeMode = 'light' | 'dark'
export type ThemeVariant = 'primary' | 'secondary' | 'nebula'

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

// Nebula: viola notturno (stessa palette usata nella Home)
const NEBULA_PALETTE: PaletteDesignToken = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
  950: '#2e1065',
}

const PALETTES: Record<ThemeVariant, PaletteDesignToken> = {
  primary: PRIMARY_PALETTE,
  secondary: SECONDARY_PALETTE,
  nebula: NEBULA_PALETTE,
}

const VALID_VARIANTS: ThemeVariant[] = ['primary', 'secondary', 'nebula']

function loadInitial(): { mode: ThemeMode; variant: ThemeVariant } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        (parsed.mode === 'light' || parsed.mode === 'dark') &&
        VALID_VARIANTS.includes(parsed.variant)
      ) {
        return parsed
      }
    }
  } catch {
    // ignore malformed storage
  }
  return { mode: 'dark', variant: 'nebula' }
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
