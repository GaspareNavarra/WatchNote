const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY as string
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

export type TmdbMediaType = 'movie' | 'tv'

export type TmdbSearchResult = {
  id: number
  mediaType: TmdbMediaType
  title: string
  overview: string
  posterPath: string | null
  year: string | null
}

export type TmdbSeasonSummary = {
  seasonNumber: number
  name: string
  episodeCount: number
}

export type TmdbTvDetails = {
  id: number
  name: string
  overview: string
  posterPath: string | null
  seasons: TmdbSeasonSummary[]
}

export type TmdbEpisodeSummary = {
  episodeNumber: number
  name: string
}

function assertApiKey() {
  if (!TMDB_API_KEY) {
    throw new Error('Manca VITE_TMDB_API_KEY nel file .env')
  }
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  assertApiKey()
  const url = new URL(`${TMDB_BASE_URL}${path}`)
  url.searchParams.set('api_key', TMDB_API_KEY)
  url.searchParams.set('language', 'it-IT')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

type TmdbRawMovie = {
  id: number
  title: string
  overview: string
  poster_path: string | null
  release_date: string | null
}

type TmdbRawTv = {
  id: number
  name: string
  overview: string
  poster_path: string | null
  first_air_date: string | null
}

export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch<{ results: TmdbRawMovie[] }>('/search/movie', { query })
  return data.results.map((m) => ({
    id: m.id,
    mediaType: 'movie' as const,
    title: m.title,
    overview: m.overview,
    posterPath: m.poster_path,
    year: m.release_date ? m.release_date.slice(0, 4) : null,
  }))
}

export async function searchTv(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch<{ results: TmdbRawTv[] }>('/search/tv', { query })
  return data.results.map((t) => ({
    id: t.id,
    mediaType: 'tv' as const,
    title: t.name,
    overview: t.overview,
    posterPath: t.poster_path,
    year: t.first_air_date ? t.first_air_date.slice(0, 4) : null,
  }))
}

export async function getTvDetails(tvId: number): Promise<TmdbTvDetails> {
  const data = await tmdbFetch<{
    id: number
    name: string
    overview: string
    poster_path: string | null
    seasons: { season_number: number; name: string; episode_count: number }[]
  }>(`/tv/${tvId}`)

  return {
    id: data.id,
    name: data.name,
    overview: data.overview,
    posterPath: data.poster_path,
    seasons: data.seasons
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
      })),
  }
}

export async function getSeasonEpisodes(tvId: number, seasonNumber: number): Promise<TmdbEpisodeSummary[]> {
  const data = await tmdbFetch<{ episodes: { episode_number: number; name: string }[] }>(
    `/tv/${tvId}/season/${seasonNumber}`
  )
  return data.episodes.map((e) => ({ episodeNumber: e.episode_number, name: e.name }))
}

export function tmdbPosterUrl(posterPath: string | null): string | null {
  return posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null
}
