import type { TitleType } from '../types/database'
import { tmdbPosterUrl, type TmdbSearchResult } from './tmdb'
import type { JikanSearchResult } from './jikan'

export type UnifiedResult = {
  id: number
  type: TitleType
  title: string
  titleEnglish?: string | null
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
    titleEnglish: r.titleEnglish,
    overview: r.synopsis,
    posterUrl: r.imageUrl,
    year: r.year ? String(r.year) : null,
  }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// TMDB TV search and Jikan anime search often surface the same show. When a 'series' result
// (from TMDB) matches an 'anime' result (from Jikan) by title, keep only the Jikan one — it's
// the dedicated anime source, so its metadata (episodes, poster, synopsis) is more reliable.
export function dedupeAnimeAndSeries(items: UnifiedResult[]): UnifiedResult[] {
  const animeEntries = items
    .filter((i) => i.type === 'anime')
    .map((anime) => ({
      year: anime.year,
      keys: new Set(
        [anime.title, anime.titleEnglish].filter((t): t is string => !!t).map(normalizeTitle)
      ),
    }))

  return items.filter((item) => {
    if (item.type !== 'series') return true
    const seriesKey = normalizeTitle(item.title)
    const isDuplicate = animeEntries.some(({ keys, year }) => {
      if (!keys.has(seriesKey)) return false
      if (item.year && year && Math.abs(Number(item.year) - Number(year)) > 1) return false
      return true
    })
    return !isDuplicate
  })
}
