<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTitlesStore } from '../stores/titles'
import type { TitleType } from '../types/database'
import TitleCard from '../components/TitleCard.vue'
import TitleFormModal from '../components/TitleFormModal.vue'

const titlesStore = useTitlesStore()

const filter = ref<'all' | TitleType>('all')
const showAddModal = ref(false)

const tabs: { value: 'all' | TitleType; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'movie', label: 'Film' },
  { value: 'series', label: 'Serie TV' },
  { value: 'anime', label: 'Anime' },
]

const filteredTitles = computed(() => {
  if (filter.value === 'all') return titlesStore.titles
  return titlesStore.byType(filter.value)
})

onMounted(() => {
  titlesStore.fetchTitles()
})
</script>

<template>
  <div class="home">
    <div class="toolbar">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab"
          :class="{ active: filter === tab.value }"
          @click="filter = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">+ Aggiungi</button>
    </div>

    <p v-if="titlesStore.loading" class="empty">Caricamento...</p>
    <p v-else-if="titlesStore.error" class="empty error">{{ titlesStore.error }}</p>
    <p v-else-if="filteredTitles.length === 0" class="empty">
      Nessun titolo qui. Aggiungine uno per iniziare a tenere traccia.
    </p>

    <div v-else class="grid">
      <TitleCard v-for="title in filteredTitles" :key="title.id" :title="title" />
    </div>

    <TitleFormModal
      v-if="showAddModal"
      :default-type="filter === 'all' ? 'movie' : filter"
      @close="showAddModal = false"
    />
  </div>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 0.4rem;
}

.tab {
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
}

.tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.empty {
  color: var(--text-muted);
  text-align: center;
  padding: 2rem 0;
}

.empty.error {
  color: var(--danger);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
</style>
