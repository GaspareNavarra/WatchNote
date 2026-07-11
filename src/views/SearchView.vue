<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import { searchMovies, searchTv, getTrendingAll } from '../lib/tmdb'
import { searchAnime, getTopAnime } from '../lib/jikan'
import { fromTmdb, fromJikan, type UnifiedResult } from '../lib/media'
import SearchResultTile from '../components/SearchResultTile.vue'

const query = ref('')
const recommended = ref<UnifiedResult[]>([])
const results = ref<UnifiedResult[]>([])
const mode = ref<'recommended' | 'results'>('recommended')
const loading = ref(false)
const error = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | undefined

function sortByTitle(items: UnifiedResult[]): UnifiedResult[] {
  return [...items].sort((a, b) => a.title.localeCompare(b.title, 'it', { sensitivity: 'base' }))
}

async function loadRecommended() {
  loading.value = true
  error.value = ''
  const [trending, topAnime] = await Promise.allSettled([getTrendingAll(), getTopAnime()])
  const items: UnifiedResult[] = []
  if (trending.status === 'fulfilled') items.push(...trending.value.map(fromTmdb))
  if (topAnime.status === 'fulfilled') items.push(...topAnime.value.map(fromJikan))
  if (trending.status === 'rejected' && topAnime.status === 'rejected') {
    error.value = 'Impossibile caricare i consigliati al momento.'
  }
  recommended.value = sortByTitle(items)
  loading.value = false
}

async function runSearch(q: string) {
  loading.value = true
  error.value = ''
  const [movies, tv, anime] = await Promise.allSettled([searchMovies(q), searchTv(q), searchAnime(q)])
  const items: UnifiedResult[] = []
  if (movies.status === 'fulfilled') items.push(...movies.value.map(fromTmdb))
  if (tv.status === 'fulfilled') items.push(...tv.value.map(fromTmdb))
  if (anime.status === 'fulfilled') items.push(...anime.value.map(fromJikan))
  if (movies.status === 'rejected' && tv.status === 'rejected' && anime.status === 'rejected') {
    error.value = 'Ricerca non riuscita. Riprova tra qualche istante.'
  }
  results.value = sortByTitle(items)
  loading.value = false
}

watch(query, (q) => {
  clearTimeout(debounceTimer)
  const trimmed = q.trim()
  if (!trimmed) {
    mode.value = 'recommended'
    return
  }
  mode.value = 'results'
  debounceTimer = setTimeout(() => runSearch(trimmed), 400)
})

onMounted(loadRecommended)
onBeforeUnmount(() => clearTimeout(debounceTimer))
</script>

<template>
  <div class="search-view">
    <IconField class="search-field">
      <InputIcon class="pi pi-search" />
      <InputText v-model="query" placeholder="Cerca film, serie o anime..." class="search-input" />
    </IconField>

    <div class="heading">
      <h2>{{ mode === 'recommended' ? 'Consigliati per te' : `Risultati per "${query}"` }}</h2>
      <p v-if="mode === 'results'" class="subtext">Risultati di ricerca</p>
    </div>

    <div v-if="loading" class="empty">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" stroke-width="4" />
    </div>
    <Message v-else-if="error" severity="error" :closable="false">{{ error }}</Message>
    <p v-else-if="(mode === 'recommended' ? recommended : results).length === 0" class="empty-text">
      {{ mode === 'recommended' ? 'Nessun consiglio disponibile al momento.' : 'Nessun risultato trovato.' }}
    </p>

    <ul v-else class="results-list">
      <li v-for="item in mode === 'recommended' ? recommended : results" :key="`${item.type}-${item.id}`">
        <SearchResultTile :result="item" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-view {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem;
}

.search-field {
  width: 100%;
  margin-bottom: 1.25rem;
}

.search-input {
  width: 100%;
}

.heading {
  margin-bottom: 0.75rem;
}

.heading h2 {
  margin: 0;
}

.subtext {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
  margin: 0.2rem 0 0;
}

.empty {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.empty-text {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 2rem 0;
}

.results-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
