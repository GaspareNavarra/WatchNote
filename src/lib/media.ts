import type { TitleType } from '../types/database'
import { tmdbPosterUrl, type TmdbSearchResult } from './tmdb'
import type { JikanSearchResult } from './jikan'

export type UnifiedResult = {
  id: number
  type: TitleType
  title: string
  overview: string
  posterUrl: string | null
  year: string | null
}

export function fromTmdb(r: TmdbSearchResult): UnifiedResult {
  return {
    id: r.id,
    type: r.mediaType === 'movie' ? 'movie' : 'series',
    title: r.title,
    overview: r.overview,
    posterUrl: tmdbPosterUrl(r.posterPath),
    year: r.year,
  }
}

export function fromJikan(r: JikanSearchResult): UnifiedResult {
  return {
    id: r.id,
    type: 'anime',
    title: r.title,
    overview: r.synopsis,
    posterUrl: r.imageUrl,
    year: r.year ? String(r.year) : null,
  }
}
