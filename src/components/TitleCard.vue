<script setup lang="ts">
import { computed } from 'vue'
import { useTitlesStore } from '../stores/titles'
import type { TitleRow } from '../types/database'

const props = defineProps<{ title: TitleRow }>()

const titlesStore = useTitlesStore()

const isMovie = computed(() => props.title.type === 'movie')
const isWatched = computed(() => props.title.status === 'completed')

const statusLabels: Record<string, string> = {
  plan_to_watch: 'Da vedere',
  watching: 'In corso',
  completed: 'Completato',
  dropped: 'Abbandonato',
}

async function toggleMovieWatched() {
  await titlesStore.updateTitle(props.title.id, {
    status: isWatched.value ? 'plan_to_watch' : 'completed',
  })
}

async function handleDelete() {
  if (confirm(`Eliminare "${props.title.name}"?`)) {
    await titlesStore.deleteTitle(props.title.id)
  }
}
</script>

<template>
  <div class="card title-card">
    <img v-if="title.poster_url" :src="title.poster_url" alt="" class="poster" />
    <div class="body">
      <div class="header-row">
        <h3>{{ title.name }}</h3>
        <button class="btn-icon btn-danger" title="Elimina" @click="handleDelete">✕</button>
      </div>
      <p class="status">{{ statusLabels[title.status] }}</p>
      <p v-if="title.notes" class="notes">{{ title.notes }}</p>

      <div class="actions">
        <button v-if="isMovie" class="btn" :class="{ 'btn-primary': !isWatched }" @click="toggleMovieWatched">
          {{ isWatched ? '✓ Visto' : 'Segna come visto' }}
        </button>
        <RouterLink v-else :to="{ name: 'title-detail', params: { id: title.id } }" class="btn">
          Gestisci episodi
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-card {
  display: flex;
  gap: 0.75rem;
}

.poster {
  width: 64px;
  height: 96px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.body {
  flex: 1;
  min-width: 0;
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

h3 {
  font-size: 1rem;
}

.status {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0 0 0.4rem;
}

.notes {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0.2rem;
  border-radius: 4px;
}

.btn-icon:hover {
  background: var(--accent-bg);
}
</style>
