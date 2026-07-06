<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useTitlesStore } from '../stores/titles'
import type { TitleType } from '../types/database'
import { searchMovies, searchTv, getTvDetails, getSeasonEpisodes, tmdbPosterUrl } from '../lib/tmdb'
import { searchAnime, getAnimeEpisodes } from '../lib/jikan'

const emit = defineEmits<{ close: [] }>()

const titlesStore = useTitlesStore()
const toast = useToast()

type UnifiedResult = {
  id: number
  title: string
  overview: string
  posterUrl: string | null
  year: string | null
}

const typeOptions: { label: string; value: TitleType }[] = [
  { label: 'Film', value: 'movie' },
  { label: 'Serie TV', value: 'series' },
  { label: 'Anime', value: 'anime' },
]

const selectedType = ref<TitleType>('movie')
const query = ref('')
const results = ref<UnifiedResult[]>([])
const searching = ref(false)
const searchError = ref('')
const importingId = ref<number | null>(null)

async function handleSearch() {
  if (!query.value.trim()) return
  searching.value = true
  searchError.value = ''
  results.value = []
  try {
    if (selectedType.value === 'movie') {
      const r = await searchMovies(query.value.trim())
      results.value = r.map((m) => ({
        id: m.id,
        title: m.title,
        overview: m.overview,
        posterUrl: tmdbPosterUrl(m.posterPath),
        year: m.year,
      }))
    } else if (selectedType.value === 'series') {
      const r = await searchTv(query.value.trim())
      results.value = r.map((t) => ({
        id: t.id,
        title: t.title,
        overview: t.overview,
        posterUrl: tmdbPosterUrl(t.posterPath),
        year: t.year,
      }))
    } else {
      const r = await searchAnime(query.value.trim())
      results.value = r.map((a) => ({
        id: a.id,
        title: a.title,
        overview: a.synopsis,
        posterUrl: a.imageUrl,
        year: a.year ? String(a.year) : null,
      }))
    }
  } catch (e) {
    searchError.value = e instanceof Error ? e.message : 'Errore durante la ricerca'
  } finally {
    searching.value = false
  }
}

async function handleImport(result: UnifiedResult) {
  importingId.value = result.id
  try {
    const newTitle = await titlesStore.addTitle({
      name: result.title,
      type: selectedType.value,
      poster_url: result.posterUrl,
      overview: result.overview || null,
      external_source: selectedType.value === 'anime' ? 'jikan' : 'tmdb',
      external_id: String(result.id),
    })

    if (selectedType.value === 'series') {
      const details = await getTvDetails(result.id)
      for (const season of details.seasons) {
        const episodes = await getSeasonEpisodes(result.id, season.seasonNumber)
        await titlesStore.importEpisodes(
          newTitle.id,
          season.seasonNumber,
          episodes.map((e) => ({ episodeNumber: e.episodeNumber, name: e.name || null }))
        )
      }
    } else if (selectedType.value === 'anime') {
      const episodes = await getAnimeEpisodes(result.id)
      await titlesStore.importEpisodes(
        newTitle.id,
        1,
        episodes.map((e) => ({ episodeNumber: e.episodeNumber, name: e.name || null }))
      )
    }

    toast.add({ severity: 'success', summary: 'Aggiunto', detail: `"${result.title}" aggiunto`, life: 3000 })
    emit('close')
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: e instanceof Error ? e.message : 'Errore durante l\'importazione',
      life: 5000,
    })
  } finally {
    importingId.value = null
  }
}
</script>

<template>
  <Dialog
    :visible="true"
    modal
    header="Aggiungi titolo"
    :style="{ width: '32rem', maxWidth: '95vw' }"
    @update:visible="emit('close')"
  >
    <div class="search-form">
      <SelectButton
        v-model="selectedType"
        :options="typeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
      />
      <div class="search-row">
        <InputText v-model="query" placeholder="Cerca titolo..." class="search-input" @keyup.enter="handleSearch" />
        <Button icon="pi pi-search" :loading="searching" @click="handleSearch" />
      </div>
    </div>

    <Message v-if="searchError" severity="error" :closable="false">{{ searchError }}</Message>

    <p v-if="!searching && !searchError && results.length === 0" class="hint">
      Cerca un {{ selectedType === 'movie' ? 'film' : selectedType === 'series' ? 'una serie TV' : 'un anime' }} per
      aggiungerlo alla tua lista.
    </p>

    <ul class="results">
      <li v-for="result in results" :key="result.id" class="result-item">
        <img v-if="result.posterUrl" :src="result.posterUrl" alt="" class="poster" />
        <div v-else class="poster poster-placeholder"><i class="pi pi-image"></i></div>
        <div class="info">
          <div class="title-row">
            <strong>{{ result.title }}</strong>
            <span v-if="result.year" class="year">({{ result.year }})</span>
          </div>
          <p class="overview">{{ result.overview || 'Nessuna descrizione disponibile.' }}</p>
        </div>
        <Button
          label="Aggiungi"
          size="small"
          :loading="importingId === result.id"
          :disabled="importingId !== null && importingId !== result.id"
          @click="handleImport(result)"
        />
      </li>
    </ul>
  </Dialog>
</template>

<style scoped>
.search-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.search-row {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
}

.hint {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 1rem 0;
}

.results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 50vh;
  overflow-y: auto;
}

.result-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--p-content-border-color);
}

.result-item:last-child {
  border-bottom: none;
}

.poster {
  width: 56px;
  height: 84px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-content-hover-background);
  color: var(--p-text-muted-color);
}

.info {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.year {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}

.overview {
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  margin: 0.25rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
