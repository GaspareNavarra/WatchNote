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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Jikan v4's documented rate limit (https://docs.api.jikan.moe/): 3 requests/second, 60 requests/minute.
// Every call (including retries) is funneled through this gate so we never dispatch faster than that,
// regardless of how many exported functions are in flight at once.
const MIN_INTERVAL_MS = 350 // ~2.85 req/s, a safety margin under the 3 req/s ceiling
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 60

let lastDispatch = 0
const dispatchLog: number[] = []
let gate: Promise<void> = Promise.resolve()

function acquireSlot(): Promise<void> {
  const next = gate.then(async () => {
    const sinceLast = Date.now() - lastDispatch
    if (sinceLast < MIN_INTERVAL_MS) {
      await sleep(MIN_INTERVAL_MS - sinceLast)
    }

    for (;;) {
      const cutoff = Date.now() - WINDOW_MS
      while (dispatchLog.length && dispatchLog[0] <= cutoff) dispatchLog.shift()
      if (dispatchLog.length < MAX_PER_WINDOW) break
      await sleep(dispatchLog[0] + WINDOW_MS - Date.now())
    }

    lastDispatch = Date.now()
    dispatchLog.push(lastDispatch)
  })
  gate = next
  return next
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const MAX_RETRIES = 5

async function jikanFetch<T>(path: string): Promise<T> {
  let lastError: Error = new Error('Jikan: richiesta fallita')
  let retryAfterMs = 0

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (retryAfterMs > 0) {
      await sleep(retryAfterMs)
      retryAfterMs = 0
    } else if (attempt > 0) {
      await sleep(600 * attempt)
    }
    await acquireSlot()

    let res: Response
    try {
      res = await fetch(`${JIKAN_BASE_URL}${path}`)
    } catch {
      lastError = new Error('Impossibile contattare Jikan/MyAnimeList. Riprova più tardi.')
      continue
    }

    if (res.ok) {
      return res.json() as Promise<T>
    }

    if (res.status === 504) {
      lastError = new Error('MyAnimeList non risponde al momento. Riprova tra qualche istante.')
    } else if (res.status === 429) {
      lastError = new Error('Troppe richieste a Jikan. Riprova tra qualche istante.')
      // Jikan's own limit (3/s, 60/min) is enforced by acquireSlot() above, so a 429 here means
      // the shared upstream (Jikan's own quota against MyAnimeList, or a burst from another tab/
      // session on this IP) is currently throttled. Respect Retry-After if the server sent one.
      const retryAfterHeader = res.headers.get('retry-after')
      const parsed = retryAfterHeader ? Number(retryAfterHeader) : NaN
      retryAfterMs = Number.isFinite(parsed) ? parsed * 1000 : 2000 * (attempt + 1)
    } else {
      lastError = new Error(`Jikan error ${res.status}: ${res.statusText}`)
    }

    if (!RETRYABLE_STATUSES.has(res.status)) {
      throw lastError
    }
  }

  throw lastError
}

function mapJikanAnime(a: JikanRawAnime): JikanSearchResult {
  return {
    id: a.mal_id,
    title: a.title,
    synopsis: a.synopsis ?? '',
    imageUrl: a.images.jpg.large_image_url ?? a.images.jpg.image_url,
    year: a.year,
    episodeCount: a.episodes,
  }
}

export async function searchAnime(query: string): Promise<JikanSearchResult[]> {
  const data = await jikanFetch<{ data: JikanRawAnime[] }>(
    `/anime?q=${encodeURIComponent(query)}&limit=12&sfw=true`
  )
  return data.data.map(mapJikanAnime)
}

export async function getTopAnime(): Promise<JikanSearchResult[]> {
  const data = await jikanFetch<{ data: JikanRawAnime[] }>('/top/anime?filter=bypopularity&limit=12')
  return data.data.map(mapJikanAnime)
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
  }
  return episodes
}
