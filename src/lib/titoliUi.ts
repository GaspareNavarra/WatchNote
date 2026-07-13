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
  da_vedere: '#f1f5f9',
  abbandonato: '#ef4444',
}

export const statoIcon: Record<Stato, string> = {
  visto: 'pi pi-check',
  in_corso: 'pi pi-play',
  da_vedere: 'pi pi-bookmark',
  abbandonato: 'pi pi-times',
}

export const statoLabel: Record<Stato, string> = {
  in_corso: 'In corso',
  da_vedere: 'Da vedere',
  visto: 'Visto',
  abbandonato: 'Abbandonato',
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
    return t.stato === 'visto' ? 'Film · visto' : 'Film'
  }
  return `${t.episodiVisti}/${t.episodiTotali} ep`
}
