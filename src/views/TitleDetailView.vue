<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTitlesStore } from '../stores/titles'
import SeasonBlock from '../components/SeasonBlock.vue'

const props = defineProps<{ id: string }>()

const titlesStore = useTitlesStore()
const router = useRouter()

const loading = ref(true)
const newSeasonNumber = ref(1)
const newSeasonEpisodeCount = ref(12)
const error = ref('')

const title = computed(() => titlesStore.titles.find((t) => t.id === props.id))
const episodes = computed(() => titlesStore.episodesByTitle[props.id] ?? [])
const progress = computed(() => titlesStore.progress(props.id))

const seasons = computed(() => {
  const map = new Map<number, typeof episodes.value>()
  for (const ep of episodes.value) {
    if (!map.has(ep.season_number)) map.set(ep.season_number, [])
    map.get(ep.season_number)!.push(ep)
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0])
})

onMounted(async () => {
  if (titlesStore.titles.length === 0) {
    await titlesStore.fetchTitles()
  }
  await titlesStore.fetchEpisodes(props.id)
  const existingSeasons = [...new Set(episodes.value.map((e) => e.season_number))]
  newSeasonNumber.value = existingSeasons.length > 0 ? Math.max(...existingSeasons) + 1 : 1
  loading.value = false
})

async function handleAddSeason() {
  error.value = ''
  try {
    await titlesStore.addSeason(props.id, newSeasonNumber.value, newSeasonEpisodeCount.value)
    newSeasonNumber.value += 1
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Errore durante l\'aggiunta della stagione'
  }
}

async function handleDeleteTitle() {
  if (!title.value) return
  if (confirm(`Eliminare "${title.value.name}" e tutti i suoi episodi?`)) {
    await titlesStore.deleteTitle(props.id)
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <div class="detail">
    <RouterLink to="/" class="back">← Torna alla lista</RouterLink>

    <p v-if="loading">Caricamento...</p>
    <p v-else-if="!title">Titolo non trovato.</p>

    <template v-else>
      <div class="header">
        <img v-if="title.poster_url" :src="title.poster_url" alt="" class="poster" />
        <div>
          <h1>{{ title.name }}</h1>
          <p class="meta">{{ progress.watched }}/{{ progress.total }} episodi visti ({{ progress.percent }}%)</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress.percent + '%' }"></div>
          </div>
          <button class="btn btn-danger" @click="handleDeleteTitle">Elimina titolo</button>
        </div>
      </div>

      <div class="seasons">
        <SeasonBlock
          v-for="[seasonNumber, seasonEpisodes] in seasons"
          :key="seasonNumber"
          :title-id="props.id"
          :season-number="seasonNumber"
          :episodes="seasonEpisodes"
        />
      </div>

      <form class="card add-season" @submit.prevent="handleAddSeason">
        <h3>Aggiungi stagione</h3>
        <div class="fields">
          <label>
            Numero stagione
            <input v-model.number="newSeasonNumber" type="number" min="1" required />
          </label>
          <label>
            Numero episodi
            <input v-model.number="newSeasonEpisodeCount" type="number" min="1" required />
          </label>
        </div>
        <p v-if="error" class="message error">{{ error }}</p>
        <button type="submit" class="btn btn-primary">Aggiungi</button>
      </form>
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
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-decoration: none;
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

.meta {
  color: var(--text-muted);
  margin: 0 0 0.5rem;
}

.progress-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
  margin-bottom: 0.75rem;
  max-width: 260px;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
}

.seasons {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
}

.add-season {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fields {
  display: flex;
  gap: 1rem;
}

.fields label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
  flex: 1;
}

.message.error {
  color: var(--danger);
  font-size: 0.85rem;
  margin: 0;
}
</style>
