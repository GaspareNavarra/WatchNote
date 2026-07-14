const ANILIST_URL = 'https://graphql.anilist.co'

export type AniListSearchResult = {
  id: number
  title: string
  titleEnglish: string | null
  synopsis: string
  imageUrl: string | null
  year: number | null
  episodeCount: number | null
}

export type AniListEpisodeSummary = {
  episodeNumber: number
  name: string | null
}

type AniListMedia = {
  id: number
  title: { romaji: string | null; english: string | null }
  description: string | null
  episodes: number | null
  startDate: { year: number | null } | null
  coverImage: { extraLarge: string | null; large: string | null }
  nextAiringEpisode: { episode: number } | null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// AniList's documented rate limit (https://docs.anilist.co/guide/rate-limiting): 30 requests/minute.
// Every call (including retries) is funneled through this gate so we never dispatch faster than
// that, regardless of how many exported functions are in flight at once.
const MIN_INTERVAL_MS = 2100 // ~28.5 req/min, a safety margin under the 30 req/min ceiling
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 28

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

async function anilistFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let lastError: Error = new Error('AniList: richiesta fallita')
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
      res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
      })
    } catch {
      lastError = new Error('Impossibile contattare AniList. Riprova più tardi.')
      continue
    }

    if (res.ok) {
      const json = await res.json()
      if (json.errors?.length) {
        throw new Error(`AniList error: ${json.errors[0].message}`)
      }
      return json.data as T
    }

    if (res.status === 429) {
      lastError = new Error('Troppe richieste ad AniList. Riprova tra qualche istante.')
      // AniList's own limit (30/min) is enforced by acquireSlot() above, so a 429 here means the
      // shared upstream quota (across other tabs/sessions on this IP) is currently throttled.
      // Respect Retry-After if the server sent one.
      const retryAfterHeader = res.headers.get('retry-after')
      const parsed = retryAfterHeader ? Number(retryAfterHeader) : NaN
      retryAfterMs = Number.isFinite(parsed) ? parsed * 1000 : 2000 * (attempt + 1)
    } else if (res.status >= 500) {
      lastError = new Error('AniList non risponde al momento. Riprova tra qualche istante.')
    } else {
      lastError = new Error(`AniList error ${res.status}: ${res.statusText}`)
    }

    if (!RETRYABLE_STATUSES.has(res.status)) {
      throw lastError
    }
  }

  throw lastError
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

function mapAniListMedia(m: AniListMedia): AniListSearchResult {
  return {
    id: m.id,
    title: m.title.romaji ?? m.title.english ?? '',
    titleEnglish: m.title.english,
    synopsis: m.description ? stripHtml(m.description) : '',
    imageUrl: m.coverImage.extraLarge ?? m.coverImage.large,
    year: m.startDate?.year ?? null,
    episodeCount: m.episodes ?? (m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : null),
  }
}

const MEDIA_FIELDS = `
  id
  title { romaji english }
  description(asHtml: false)
  episodes
  startDate { year }
  coverImage { extraLarge large }
  nextAiringEpisode { episode }
`

const SEARCH_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
        ${MEDIA_FIELDS}
      }
    }
  }
`

const TOP_QUERY = `
  query ($perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
        ${MEDIA_FIELDS}
      }
    }
  }
`

const EPISODE_COUNT_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      episodes
      nextAiringEpisode { episode }
    }
  }
`

const MEDIA_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ${MEDIA_FIELDS}
    }
  }
`

export async function searchAnime(query: string): Promise<AniListSearchResult[]> {
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(SEARCH_QUERY, {
    search: query,
    perPage: 12,
  })
  return data.Page.media.map(mapAniListMedia)
}

export async function getAnimeDetails(id: number): Promise<AniListSearchResult> {
  const data = await anilistFetch<{ Media: AniListMedia }>(MEDIA_BY_ID_QUERY, { id })
  return mapAniListMedia(data.Media)
}

export async function getTopAnime(): Promise<AniListSearchResult[]> {
  const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(TOP_QUERY, { perPage: 12 })
  return data.Page.media.map(mapAniListMedia)
}

export async function getAnimeEpisodes(animeId: number): Promise<AniListEpisodeSummary[]> {
  const data = await anilistFetch<{
    Media: { episodes: number | null; nextAiringEpisode: { episode: number } | null }
  }>(EPISODE_COUNT_QUERY, { id: animeId })
  // AniList doesn't expose per-episode titles like Jikan did; SeasonBlock.vue already falls back
  // to a generic "Episode N" label when name is null, so that's what airing/completed anime get here.
  const count =
    data.Media.episodes ?? (data.Media.nextAiringEpisode ? data.Media.nextAiringEpisode.episode - 1 : 0)
  return Array.from({ length: Math.max(0, count) }, (_, i) => ({ episodeNumber: i + 1, name: null }))
}
