<script setup lang="ts">
import { computed } from 'vue'
import { useTitlesStore } from '../stores/titles'
import type { EpisodeRow } from '../types/database'

const props = defineProps<{ titleId: string; seasonNumber: number; episodes: EpisodeRow[] }>()

const titlesStore = useTitlesStore()

const sorted = computed(() => [...props.episodes].sort((a, b) => a.episode_number - b.episode_number))
const watchedCount = computed(() => props.episodes.filter((e) => e.watched).length)

async function toggle(episode: EpisodeRow) {
  await titlesStore.setEpisodeWatched(props.titleId, episode.id, !episode.watched)
}

async function markAllWatched(watched: boolean) {
  for (const episode of sorted.value) {
    if (episode.watched !== watched) {
      await titlesStore.setEpisodeWatched(props.titleId, episode.id, watched)
    }
  }
}

async function removeEpisode(episode: EpisodeRow) {
  await titlesStore.deleteEpisode(props.titleId, episode.id)
}
</script>

<template>
  <div class="season">
    <div class="season-header">
      <h3>Stagione {{ seasonNumber }}</h3>
      <div class="season-actions">
        <span class="count">{{ watchedCount }}/{{ episodes.length }}</span>
        <button class="btn-link" @click="markAllWatched(true)">Segna tutti</button>
        <button class="btn-link" @click="markAllWatched(false)">Azzera</button>
      </div>
    </div>
    <ul class="episode-list">
      <li v-for="episode in sorted" :key="episode.id" class="episode-row">
        <label>
          <input type="checkbox" :checked="episode.watched" @change="toggle(episode)" />
          <span>Episodio {{ episode.episode_number }}<template v-if="episode.name"> — {{ episode.name }}</template></span>
        </label>
        <button class="btn-icon" title="Elimina episodio" @click="removeEpisode(episode)">✕</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.season {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.85rem;
}

.season-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.season-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
}

.count {
  color: var(--text-muted);
}

.btn-link {
  background: none;
  border: none;
  color: var(--accent);
  text-decoration: underline;
  padding: 0;
  font-size: 0.8rem;
}

.episode-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.episode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.episode-row label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.episode-row input[type='checkbox'] {
  width: auto;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 0.85rem;
  padding: 0.2rem;
  border-radius: 4px;
  color: var(--text-muted);
}

.btn-icon:hover {
  background: var(--accent-bg);
  color: var(--danger);
}
</style>
