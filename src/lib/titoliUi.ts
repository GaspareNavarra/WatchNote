import { i18n } from '../i18n'

export type Categoria = 'film' | 'serie' | 'anime'
export type Stato = 'visto' | 'in_corso' | 'da_vedere' | 'abbandonato'

export interface Titolo {
  id: string
  titolo: string
  categoria: Categoria
  stato: Stato
  episodiVisti: number
  episodiTotali: number // 1 per i film
  copertina?: string
}

export const statoColor: Record<Stato, string> = {
  visto: '#16a34a',
  in_corso: 'var(--p-primary-color)',
  da_vedere: 'var(--stato-da-vedere)',
  abbandonato: '#ef4444',
}

export const statoIcon: Record<Stato, string> = {
  visto: 'pi pi-check',
  in_corso: 'pi pi-play',
  da_vedere: 'pi pi-bookmark',
  abbandonato: 'pi pi-times',
}

export function statoLabel(stato: Stato): string {
  return i18n.global.t(`home.status.${stato}`)
}

export const categoriaIcon: Record<Categoria, string> = {
  film: 'pi pi-video',
  serie: 'pi pi-desktop',
  anime: 'pi pi-star',
}

export function progresso(t: Titolo): number {
  if (t.episodiTotali <= 0) return 0
  return Math.round((t.episodiVisti / t.episodiTotali) * 100)
}

export function episodiLabel(t: Titolo): string {
  if (t.categoria === 'film') {
    return t.stato === 'visto' ? i18n.global.t('home.episodes.movieWatched') : i18n.global.t('home.episodes.movie')
  }
  return i18n.global.t('home.episodes.count', { watched: t.episodiVisti, total: t.episodiTotali })
}
