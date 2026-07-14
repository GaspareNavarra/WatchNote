<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { useTitlesStore } from '../stores/titles'
import { useAddToLibrary } from '../composables/useAddToLibrary'
import { getTvDetails, getSeasonEpisodes, getMovieDetails, tmdbPosterUrl } from '../lib/tmdb'
import { getAnimeDetails, getAnimeEpisodes } from '../lib/anilist'
import type { UnifiedResult } from '../lib/media'
import type { TitleType } from '../types/database'
import SeasonBlock, { type DisplayEpisode } from '../components/SeasonBlock.vue'

// This view serves two routes: `/titles/:id` (a real library item) and
// `/titles/preview/:type/:externalId` (a search result not yet added). Both render the exact
// same layout; the only visible difference is the "Aggiungi" action instead of drop/delete, and
// watching an episode (or marking a movie watched) before adding silently imports it first.
const props = defineProps<{ id?: string; type?: TitleType; externalId?: string }>()

const titlesStore = useTitlesStore()
const router = useRouter()
const confirm = useConfirm()
const { t } = useI18n({ useScope: 'global' })
const { importingId, handleImport } = useAddToLibrary()

const loading = ref(true)

const justAddedId = ref<string | null>(null)
const previewInfo = ref<{ name: string; overview: string; posterUrl: string | null; year: string | null } | null>(
  null
)
const previewSeasons = ref<{ seasonNumber: number; episodes: { episodeNumber: number; name: string | null }[] }[]>([])

const effectiveId = computed(() => props.id ?? justAddedId.value)

const title = computed(() =>
  effectiveId.value ? titlesStore.titles.find((t) => t.id === effectiveId.value) : undefined
)
const episodes = computed(() => (effectiveId.value ? titlesStore.episodesByTitle[effectiveId.value] ?? [] : []))

const isMovie = computed(() => (effectiveId.value ? title.value?.type === 'movie' : props.type === 'movie'))
const isDropped = computed(() => title.value?.status === 'dropped')
const isMovieWatched = computed(() => title.value?.status === 'completed')

const statusLabel = computed(() => (title.value ? t(`titleDetail.status.${title.value.status}`) : ''))

const displayName = computed(() => (effectiveId.value ? title.value?.name : previewInfo.value?.name) ?? '')
const displayOverview = computed(
  () => (effectiveId.value ? title.value?.overview : previewInfo.value?.overview) ?? ''
)
const displayPoster = computed(
  () => (effectiveId.value ? title.value?.poster_url : previewInfo.value?.posterUrl) ?? null
)

const seasons = computed<{ seasonNumber: number; episodes: DisplayEpisode[] }[]>(() => {
  if (effectiveId.value) {
    const map = new Map<number, DisplayEpisode[]>()
    for (const ep of episodes.value) {
      if (!map.has(ep.season_number)) map.set(ep.season_number, [])
      map.get(ep.season_number)!.push({
        key: ep.id,
        episodeNumber: ep.episode_number,
        name: ep.name,
        watched: ep.watched,
      })
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([seasonNumber, eps]) => ({ seasonNumber, episodes: eps }))
  }
  return previewSeasons.value.map((s) => ({
    seasonNumber: s.seasonNumber,
    episodes: s.episodes.map((e) => ({
      key: `preview-${s.seasonNumber}-${e.episodeNumber}`,
      episodeNumber: e.episodeNumber,
      name: e.name,
      watched: false,
    })),
  }))
})

const progress = computed(() => {
  const all = seasons.value.flatMap((s) => s.episodes)
  const total = all.length
  const watched = all.filter((e) => e.watched).length
  return { watched, total, percent: total === 0 ? 0 : Math.round((watched / total) * 100) }
})

const externalSource = computed(() => (props.type === 'anime' ? 'anilist' : 'tmdb'))

const previewResult = computed<UnifiedResult | null>(() => {
  if (!previewInfo.value || !props.type || props.externalId === undefined) return null
  return {
    id: Number(props.externalId),
    type: props.type,
    title: previewInfo.value.name,
    overview: previewInfo.value.overview,
    posterUrl: previewInfo.value.posterUrl,
    year: previewInfo.value.year,
  }
})

async function loadPreview() {
  if (!props.type || !props.externalId) return
  const externalIdNum = Number(props.externalId)

  if (props.type === 'movie') {
    const details = await getMovieDetails(externalIdNum)
    previewInfo.value = {
      name: details.name,
      overview: details.overview,
      posterUrl: tmdbPosterUrl(details.posterPath),
      year: details.year,
    }
  } else if (props.type === 'series') {
    const details = await getTvDetails(externalIdNum)
    previewInfo.value = {
      name: details.name,
      overview: details.overview,
      posterUrl: tmdbPosterUrl(details.posterPath),
      year: details.year,
    }
    const seasonsData = []
    for (const season of details.seasons) {
      const eps = await getSeasonEpisodes(externalIdNum, season.seasonNumber)
      seasonsData.push({
        seasonNumber: season.seasonNumber,
        episodes: eps.map((e) => ({ episodeNumber: e.episodeNumber, name: e.name || null })),
      })
    }
    previewSeasons.value = seasonsData
  } else {
    const info = await getAnimeDetails(externalIdNum)
    previewInfo.value = {
      name: info.title,
      overview: info.synopsis,
      posterUrl: info.imageUrl,
      year: info.year ? String(info.year) : null,
    }
    const eps = await getAnimeEpisodes(externalIdNum)
    previewSeasons.value =
      eps.length > 0 ? [{ seasonNumber: 1, episodes: eps.map((e) => ({ episodeNumber: e.episodeNumber, name: e.name })) }] : []
  }
}

onMounted(async () => {
  if (titlesStore.titles.length === 0) {
    await titlesStore.fetchTitles()
  }

  if (!props.id && props.type && props.externalId) {
    const existing = titlesStore.titles.find(
      (t) =>
        t.type === props.type && t.external_source === externalSource.value && t.external_id === props.externalId
    )
    if (existing) {
      justAddedId.value = existing.id
    } else {
      await loadPreview()
    }
  }

  if (effectiveId.value && !isMovie.value) {
    await titlesStore.fetchEpisodes(effectiveId.value)
  }

  loading.value = false
})

async function ensureAdded(): Promise<string | null> {
  if (effectiveId.value) return effectiveId.value
  if (!previewResult.value) return null
  try {
    const newTitle = await handleImport(previewResult.value)
    justAddedId.value = newTitle.id
    return newTitle.id
  } catch {
    return null
  }
}

async function handleAddToLibrary() {
  await ensureAdded()
}

async function toggleMovieWatched() {
  if (effectiveId.value) {
    await titlesStore.updateTitle(effectiveId.value, {
      status: isMovieWatched.value ? 'plan_to_watch' : 'completed',
    })
    return
  }
  const newId = await ensureAdded()
  if (newId) await titlesStore.updateTitle(newId, { status: 'completed' })
}

async function handleDropToggle() {
  if (!title.value) return
  if (isDropped.value) {
    await titlesStore.undropTitle(title.value.id)
  } else {
    await titlesStore.dropTitle(title.value.id)
  }
}

function handleDeleteTitle() {
  if (!title.value) return
  const current = title.value
  confirm.require({
    message: t('titleDetail.deleteConfirm.message', { name: current.name }),
    header: t('titleDetail.deleteConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('titleDetail.deleteConfirm.accept'),
    rejectLabel: t('titleDetail.deleteConfirm.reject'),
    acceptProps: { severity: 'danger' },
    accept: async () => {
      await titlesStore.deleteTitle(current.id)
      router.push({ name: 'home' })
    },
  })
}

async function onToggleEpisode(seasonNumber: number, episodeNumber: number, watched: boolean) {
  if (effectiveId.value) {
    const ep = (titlesStore.episodesByTitle[effectiveId.value] ?? []).find(
      (e) => e.season_number === seasonNumber && e.episode_number === episodeNumber
    )
    if (ep) await titlesStore.setEpisodeWatched(effectiveId.value, ep.id, watched)
    return
  }
  if (!watched) return
  const newId = await ensureAdded()
  if (!newId) return
  const ep = (titlesStore.episodesByTitle[newId] ?? []).find(
    (e) => e.season_number === seasonNumber && e.episode_number === episodeNumber
  )
  if (ep) await titlesStore.setEpisodeWatched(newId, ep.id, true)
}

async function onMarkAllEpisodes(seasonNumber: number, watched: boolean) {
  if (effectiveId.value) {
    const seasonEpisodes = (titlesStore.episodesByTitle[effectiveId.value] ?? []).filter(
      (e) => e.season_number === seasonNumber
    )
    for (const ep of seasonEpisodes) {
      if (ep.watched !== watched) await titlesStore.setEpisodeWatched(effectiveId.value, ep.id, watched)
    }
    return
  }
  if (!watched) return
  const newId = await ensureAdded()
  if (!newId) return
  const seasonEpisodes = (titlesStore.episodesByTitle[newId] ?? []).filter((e) => e.season_number === seasonNumber)
  for (const ep of seasonEpisodes) {
    await titlesStore.setEpisodeWatched(newId, ep.id, true)
  }
}

async function onRemoveEpisode(seasonNumber: number, episodeNumber: number) {
  if (!effectiveId.value) return
  const ep = (titlesStore.episodesByTitle[effectiveId.value] ?? []).find(
    (e) => e.season_number === seasonNumber && e.episode_number === episodeNumber
  )
  if (ep) await titlesStore.deleteEpisode(effectiveId.value, ep.id)
}
</script>

<template>
  <div class="detail">
    <button type="button" class="back" @click="router.back()">← {{ t('titleDetail.backToList') }}</button>

    <div v-if="loading" class="loading"><ProgressSpinner style="width: 2.5rem; height: 2.5rem" /></div>
    <p v-else-if="!displayName">{{ t('titleDetail.notFound') }}</p>

    <template v-else>
      <div class="header">
        <img v-if="displayPoster" :src="displayPoster" alt="" class="poster" />
        <div v-else class="poster poster-placeholder"><i class="pi pi-image"></i></div>
        <div class="header-info">
          <h1>{{ displayName }}</h1>
          <p v-if="displayOverview" class="overview">{{ displayOverview }}</p>
          <Tag v-if="effectiveId" :value="statusLabel" class="status-tag" />
          <template v-if="!isMovie">
            <p class="meta">
              {{ t('titleDetail.progress', { watched: progress.watched, total: progress.total, percent: progress.percent }) }}
            </p>
            <ProgressBar :value="progress.percent" :show-value="false" class="progress" />
          </template>
          <div class="actions-row">
            <Button
              v-if="isMovie"
              :label="isMovieWatched ? t('titleDetail.actions.markUnwatched') : t('titleDetail.actions.markWatched')"
              :icon="isMovieWatched ? undefined : 'pi pi-check'"
              size="small"
              :outlined="isMovieWatched"
              @click="toggleMovieWatched"
            />
            <template v-if="effectiveId">
              <Button
                :label="isDropped ? t('titleDetail.actions.resume') : t('titleDetail.actions.drop')"
                :icon="isDropped ? 'pi pi-refresh' : 'pi pi-ban'"
                severity="warn"
                outlined
                size="small"
                @click="handleDropToggle"
              />
              <Button
                :label="t('titleDetail.actions.deleteTitle')"
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                @click="handleDeleteTitle"
              />
            </template>
            <button
              v-else
              type="button"
              class="add-btn"
              :disabled="importingId !== null"
              @click="handleAddToLibrary"
            >
              <span v-if="importingId !== null" class="spinner"></span>
              <template v-else>
                <svg class="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>{{ t('searchResultTile.add') }}</span>
              </template>
            </button>
          </div>
        </div>
      </div>

      <template v-if="!isMovie">
        <div class="seasons">
          <SeasonBlock
            v-for="season in seasons"
            :key="season.seasonNumber"
            :season-number="season.seasonNumber"
            :episodes="season.episodes"
            :removable="!!effectiveId"
            @toggle="(episodeNumber, watched) => onToggleEpisode(season.seasonNumber, episodeNumber, watched)"
            @mark-all="(watched) => onMarkAllEpisodes(season.seasonNumber, watched)"
            @remove="(episodeNumber) => onRemoveEpisode(season.seasonNumber, episodeNumber)"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.detail {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem;
}

.back {
  display: inline-flex;
  align-items: center;
  margin-bottom: 1rem;
  border: none;
  background: none;
  padding: 0;
  color: inherit;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.poster {
  width: 100px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-chip);
  color: var(--text-muted);
  font-size: 1.75rem;
}

.header-info h1 {
  margin: 0 0 0.4rem;
}

.overview {
  font-size: 0.9rem;
  color: var(--p-text-muted-color);
  margin: 0 0 0.5rem;
}

.meta {
  color: var(--p-text-muted-color);
  margin: 0 0 0.5rem;
}

.status-tag {
  display: inline-block;
  margin-bottom: 0.5rem;
}

.actions-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.progress {
  max-width: 260px;
  height: 8px;
  margin-bottom: 0.75rem;
}

.seasons {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--p-primary-color) 70%, white 30%),
    color-mix(in srgb, var(--p-primary-color) 85%, white 15%)
  );
  color: #140f24;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px -10px color-mix(in srgb, var(--p-primary-color) 85%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px -10px color-mix(in srgb, var(--p-primary-color) 95%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.add-btn:disabled {
  opacity: 0.65;
  cursor: default;
  transform: none;
}

.add-icon {
  width: 18px;
  height: 18px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(20, 15, 36, 0.35);
  border-top-color: #140f24;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
