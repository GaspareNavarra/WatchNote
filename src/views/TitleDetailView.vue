<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { useTitlesStore } from '../stores/titles'
import SeasonBlock from '../components/SeasonBlock.vue'

const props = defineProps<{ id: string }>()

const titlesStore = useTitlesStore()
const router = useRouter()
const confirm = useConfirm()

const loading = ref(true)
const newSeasonNumber = ref(1)
const newSeasonEpisodeCount = ref(12)
const error = ref('')

const title = computed(() => titlesStore.titles.find((t) => t.id === props.id))
const episodes = computed(() => titlesStore.episodesByTitle[props.id] ?? [])
const progress = computed(() => titlesStore.progress(props.id))
const isMovie = computed(() => title.value?.type === 'movie')
const isDropped = computed(() => title.value?.status === 'dropped')
const isMovieWatched = computed(() => title.value?.status === 'completed')

const statusLabels: Record<string, string> = {
  plan_to_watch: 'Da vedere',
  watching: 'In corso',
  completed: 'Completato',
  dropped: 'Abbandonato',
}

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
  if (!isMovie.value) {
    await titlesStore.fetchEpisodes(props.id)
    const existingSeasons = [...new Set(episodes.value.map((e) => e.season_number))]
    newSeasonNumber.value = existingSeasons.length > 0 ? Math.max(...existingSeasons) + 1 : 1
  }
  loading.value = false
})

async function toggleMovieWatched() {
  await titlesStore.updateTitle(props.id, {
    status: isMovieWatched.value ? 'plan_to_watch' : 'completed',
  })
}

async function handleDropToggle() {
  if (!title.value) return
  if (isDropped.value) {
    await titlesStore.undropTitle(title.value.id)
  } else {
    await titlesStore.dropTitle(title.value.id)
  }
}

async function handleAddSeason() {
  error.value = ''
  try {
    await titlesStore.addSeason(props.id, newSeasonNumber.value, newSeasonEpisodeCount.value)
    newSeasonNumber.value += 1
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Errore durante l'aggiunta della stagione"
  }
}

function handleDeleteTitle() {
  if (!title.value) return
  confirm.require({
    message: `Eliminare "${title.value.name}" e tutti i suoi episodi?`,
    header: 'Conferma eliminazione',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Elimina',
    rejectLabel: 'Annulla',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      await titlesStore.deleteTitle(props.id)
      router.push({ name: 'home' })
    },
  })
}
</script>

<template>
  <div class="detail">
    <RouterLink to="/" class="back">← Torna alla lista</RouterLink>

    <div v-if="loading" class="loading"><ProgressSpinner style="width: 2.5rem; height: 2.5rem" /></div>
    <p v-else-if="!title">Titolo non trovato.</p>

    <template v-else>
      <div class="header">
        <img v-if="title.poster_url" :src="title.poster_url" alt="" class="poster" />
        <div class="header-info">
          <h1>{{ title.name }}</h1>
          <p v-if="title.overview" class="overview">{{ title.overview }}</p>
          <Tag :value="statusLabels[title.status]" class="status-tag" />
          <template v-if="!isMovie">
            <p class="meta">{{ progress.watched }}/{{ progress.total }} episodi visti ({{ progress.percent }}%)</p>
            <ProgressBar :value="progress.percent" :show-value="false" class="progress" />
          </template>
          <div class="actions-row">
            <Button
              v-if="isMovie"
              :label="isMovieWatched ? 'Segna da vedere' : 'Segna come visto'"
              :icon="isMovieWatched ? undefined : 'pi pi-check'"
              size="small"
              :outlined="isMovieWatched"
              @click="toggleMovieWatched"
            />
            <Button
              :label="isDropped ? 'Riprendi' : 'Abbandona'"
              :icon="isDropped ? 'pi pi-refresh' : 'pi pi-ban'"
              severity="warn"
              outlined
              size="small"
              @click="handleDropToggle"
            />
            <Button label="Elimina titolo" icon="pi pi-trash" severity="danger" outlined size="small" @click="handleDeleteTitle" />
          </div>
        </div>
      </div>

      <template v-if="!isMovie">
        <div class="seasons">
          <SeasonBlock
            v-for="[seasonNumber, seasonEpisodes] in seasons"
            :key="seasonNumber"
            :title-id="props.id"
            :season-number="seasonNumber"
            :episodes="seasonEpisodes"
          />
        </div>

        <Card>
          <template #title>Aggiungi stagione</template>
          <template #content>
            <form class="add-season" @submit.prevent="handleAddSeason">
              <div class="fields">
                <label class="field">
                  <span>Numero stagione</span>
                  <InputNumber v-model="newSeasonNumber" :min="1" show-buttons button-layout="horizontal" />
                </label>
                <label class="field">
                  <span>Numero episodi</span>
                  <InputNumber v-model="newSeasonEpisodeCount" :min="1" show-buttons button-layout="horizontal" />
                </label>
              </div>
              <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
              <Button type="submit" label="Aggiungi" />
            </form>
          </template>
        </Card>
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
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-decoration: none;
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

.add-season {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fields {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
  flex: 1;
}
</style>
