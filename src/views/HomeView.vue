<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import { useTitlesStore } from '../stores/titles'
import type { TitleStatus, TitleType } from '../types/database'
import type { Categoria, Stato, Titolo } from '../lib/titoliUi'
import { statoColor, statoLabel } from '../lib/titoliUi'
import HomeTitleCard from '../components/HomeTitleCard.vue'

const router = useRouter()
const titlesStore = useTitlesStore()

function toCategoria(type: TitleType): Categoria {
  if (type === 'movie') return 'film'
  if (type === 'series') return 'serie'
  return 'anime'
}

function toStato(status: TitleStatus): Stato {
  if (status === 'completed') return 'visto'
  if (status === 'watching') return 'in_corso'
  if (status === 'dropped') return 'abbandonato'
  return 'da_vedere'
}

const titoli = computed<Titolo[]>(() =>
  titlesStore.titles.map((t) => {
    const categoria = toCategoria(t.type)
    const isMovie = categoria === 'film'
    const prog = titlesStore.progress(t.id)
    return {
      id: t.id,
      titolo: t.name,
      categoria,
      stato: toStato(t.status),
      episodiVisti: isMovie ? (t.status === 'completed' ? 1 : 0) : prog.watched,
      episodiTotali: isMovie ? 1 : prog.total,
      copertina: t.poster_url ?? undefined,
    }
  })
)

onMounted(() => {
  titlesStore.fetchTitles()
  titlesStore.fetchAllEpisodes()
})

const query = ref('')
const categoriaAttiva = ref<'tutti' | Categoria>('tutti')
const statoAttivo = ref<'tutti' | Stato>('tutti')

const categorieOptions: { value: 'tutti' | Categoria; label: string; icon: string }[] = [
  { value: 'tutti', label: 'Tutti', icon: 'pi pi-th-large' },
  { value: 'film', label: 'Film', icon: 'pi pi-video' },
  { value: 'serie', label: 'Serie', icon: 'pi pi-desktop' },
  { value: 'anime', label: 'Anime', icon: 'pi pi-star' },
]

const statoOptions: { value: 'tutti' | Stato; label: string; dot: string }[] = [
  { value: 'tutti', label: 'Tutti gli stati', dot: 'transparent' },
  { value: 'in_corso', label: 'In corso', dot: statoColor.in_corso },
  { value: 'da_vedere', label: 'Da vedere', dot: statoColor.da_vedere },
  { value: 'visto', label: 'Visto', dot: statoColor.visto },
  { value: 'abbandonato', label: 'Abbandonato', dot: statoColor.abbandonato },
]

// Ordine di priorità delle sezioni quando sono visibili tutti gli stati.
const statoOrder: Stato[] = ['in_corso', 'da_vedere', 'visto', 'abbandonato']

const stats = computed(() => ({
  visto: titoli.value.filter((t) => t.stato === 'visto').length,
  in_corso: titoli.value.filter((t) => t.stato === 'in_corso').length,
  da_vedere: titoli.value.filter((t) => t.stato === 'da_vedere').length,
  abbandonato: titoli.value.filter((t) => t.stato === 'abbandonato').length,
}))

const titoliFiltrati = computed(() => {
  const q = query.value.trim().toLowerCase()
  return titoli.value.filter((t) => {
    if (categoriaAttiva.value !== 'tutti' && t.categoria !== categoriaAttiva.value) return false
    if (statoAttivo.value !== 'tutti' && t.stato !== statoAttivo.value) return false
    if (q && !t.titolo.toLowerCase().includes(q)) return false
    return true
  })
})

const sezioni = computed(() =>
  statoOrder
    .map((stato) => ({
      stato,
      label: statoLabel[stato],
      items: titoliFiltrati.value.filter((t) => t.stato === stato),
    }))
    .filter((sezione) => sezione.items.length > 0)
)

function apriDettaglio(t: Titolo) {
  router.push({ name: 'title-detail', params: { id: t.id } })
}
</script>

<template>
  <div class="home-screen">
    <header class="home-header">
      <img src="/logo.png" alt="WatchNote" class="logo-box" />
      <div class="header-text">
        <h1>WatchNote</h1>
        <p>{{ titoli.length }} titoli in raccolta</p>
      </div>
    </header>

    <div class="home-content">
      <IconField class="search-field">
        <InputIcon class="pi pi-search" />
        <InputText v-model="query" placeholder="Cerca serie, film o anime…" class="search-input" />
      </IconField>

      <div class="stats-grid">
        <div class="stat-cell">
          <span class="stat-value" :style="{ color: statoColor.visto }">{{ stats.visto }}</span>
          <span class="stat-label">Visti</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value" :style="{ color: statoColor.in_corso }">{{ stats.in_corso }}</span>
          <span class="stat-label">In corso</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value" :style="{ color: statoColor.da_vedere }">{{ stats.da_vedere }}</span>
          <span class="stat-label">Da vedere</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value" :style="{ color: statoColor.abbandonato }">{{ stats.abbandonato }}</span>
          <span class="stat-label">Mollati</span>
        </div>
      </div>

      <div class="category-row">
        <button
          v-for="opt in categorieOptions"
          :key="opt.value"
          type="button"
          class="category-btn"
          :class="{ active: categoriaAttiva === opt.value }"
          @click="categoriaAttiva = opt.value"
        >
          <i :class="opt.icon"></i>
          <span>{{ opt.label }}</span>
        </button>
      </div>

      <div class="status-row">
        <button
          v-for="opt in statoOptions"
          :key="opt.value"
          type="button"
          class="status-chip"
          :class="{ active: statoAttivo === opt.value }"
          @click="statoAttivo = opt.value"
        >
          <span v-if="opt.value !== 'tutti'" class="dot" :style="{ background: opt.dot }"></span>
          <span>{{ opt.label }}</span>
        </button>
      </div>

      <div v-if="titlesStore.loading" class="empty-state">
        <ProgressSpinner style="width: 2.5rem; height: 2.5rem" stroke-width="4" />
      </div>
      <Message v-else-if="titlesStore.error" severity="error" :closable="false">{{ titlesStore.error }}</Message>
      <div v-else-if="titoliFiltrati.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>Nessun titolo trovato</p>
      </div>

      <div v-else-if="statoAttivo === 'tutti'" class="sections">
        <div v-for="sezione in sezioni" :key="sezione.stato" class="section">
          <div class="section-heading">
            <span class="section-chip" :style="{ color: statoColor[sezione.stato], borderColor: statoColor[sezione.stato] }">
              {{ sezione.label }}
            </span>
          </div>
          <div class="cards-grid">
            <HomeTitleCard v-for="t in sezione.items" :key="t.id" :t="t" @click="apriDettaglio(t)" />
          </div>
        </div>
      </div>

      <div v-else class="cards-grid">
        <HomeTitleCard v-for="t in titoliFiltrati" :key="t.id" :t="t" @click="apriDettaglio(t)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.home-screen {
  --bg-primary-text: #f1f5f9;
  --bg-muted-text: #8b8b96;
  --bg-accent: var(--p-primary-color);
  --bg-border: rgba(255, 255, 255, 0.08);
  --bg-chip: rgba(255, 255, 255, 0.05);
  --bg-card: #16141c;

  position: relative;
  min-height: 100%;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--bg-primary-text);
  background: var(--app-gradient);
}

.home-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: calc(0.85rem + env(safe-area-inset-top)) 1.1rem 0.85rem;
  background: rgba(13, 11, 18, 0.68);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--bg-border);
}

.logo-box {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  object-fit: cover;
  display: block;
}

.header-text h1 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--bg-primary-text);
}

.header-text p {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--bg-muted-text);
}

.home-content {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem 1.1rem 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.search-field {
  width: 100%;
}

.search-input {
  width: 100%;
  background: var(--bg-chip);
  border: 1px solid var(--bg-border);
  color: var(--bg-primary-text);
}

.search-input::placeholder {
  color: var(--bg-muted-text);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.25rem;
  border-radius: 12px;
  background: var(--bg-chip);
  border: 1px solid var(--bg-border);
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 0.68rem;
  color: var(--bg-muted-text);
  text-align: center;
}

.category-row {
  display: flex;
  gap: 0.5rem;
}

.category-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.55rem 0.25rem;
  border-radius: 12px;
  border: 1px solid var(--bg-border);
  background: var(--bg-chip);
  color: var(--bg-muted-text);
  font-size: 0.72rem;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}

.category-btn i {
  font-size: 1rem;
}

.category-btn.active {
  background: var(--bg-accent);
  border-color: var(--bg-accent);
  color: #fff;
}

.status-row {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.status-row::-webkit-scrollbar {
  display: none;
}

.status-chip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--bg-border);
  background: var(--bg-chip);
  color: var(--bg-muted-text);
  font-size: 0.75rem;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.status-chip .dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex-shrink: 0;
}

.status-chip.active {
  background: rgba(255, 255, 255, 0.14);
  color: var(--bg-primary-text);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 3rem 0;
  color: var(--bg-muted-text);
}

.empty-state i {
  font-size: 2rem;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-heading {
  display: flex;
  justify-content: center;
}

.section-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.05);
  font-size: 0.75rem;
  font-weight: 700;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}
</style>
