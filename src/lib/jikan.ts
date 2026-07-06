const JIKAN_BASE_URL = 'https://api.jikan.moe/v4'

export type JikanSearchResult = {
  id: number
  title: string
  synopsis: string
  imageUrl: string | null
  year: number | null
  episodeCount: number | null
}

export type JikanEpisodeSummary = {
  episodeNumber: number
  name: string
}

type JikanRawAnime = {
  mal_id: number
  title: string
  synopsis: string | null
  episodes: number | null
  year: number | null
  images: { jpg: { image_url: string | null; large_image_url: string | null } }
}

type JikanRawEpisode = {
  mal_id: number
  title: string
}

type JikanPaginatedResponse<T> = {
  data: T[]
  pagination: { has_next_page: boolean }
}

async function jikanFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${JIKAN_BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Jikan error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function searchAnime(query: string): Promise<JikanSearchResult[]> {
  const data = await jikanFetch<{ data: JikanRawAnime[] }>(
    `/anime?q=${encodeURIComponent(query)}&limit=12&sfw=true`
  )
  return data.data.map((a) => ({
    id: a.mal_id,
    title: a.title,
    synopsis: a.synopsis ?? '',
    imageUrl: a.images.jpg.large_image_url ?? a.images.jpg.image_url,
    year: a.year,
    episodeCount: a.episodes,
  }))
}

export async function getAnimeEpisodes(animeId: number): Promise<JikanEpisodeSummary[]> {
  const episodes: JikanEpisodeSummary[] = []
  let page = 1
  while (true) {
    const data = await jikanFetch<JikanPaginatedResponse<JikanRawEpisode>>(
      `/anime/${animeId}/episodes?page=${page}`
    )
    episodes.push(...data.data.map((e) => ({ episodeNumber: e.mal_id, name: e.title })))
    if (!data.pagination.has_next_page) break
    page += 1
    await sleep(400)
  }
  return episodes
}
