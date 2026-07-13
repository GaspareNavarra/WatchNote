<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useTitlesStore } from '../stores/titles'
import type { EpisodeRow } from '../types/database'

const props = defineProps<{ titleId: string; seasonNumber: number; episodes: EpisodeRow[] }>()

const { t } = useI18n({ useScope: 'global' })
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
      <h3>{{ t('seasonBlock.title', { number: seasonNumber }) }}</h3>
      <div class="season-actions">
        <span class="count">{{ watchedCount }}/{{ episodes.length }}</span>
        <Button :label="t('seasonBlock.markAll')" link size="small" @click="markAllWatched(true)" />
        <Button :label="t('seasonBlock.clear')" link size="small" @click="markAllWatched(false)" />
      </div>
    </div>
    <ul class="episode-list">
      <li v-for="episode in sorted" :key="episode.id" class="episode-row">
        <label class="episode-label">
          <Checkbox :model-value="episode.watched" binary @update:model-value="toggle(episode)" />
          <span>{{ t('seasonBlock.episode', { number: episode.episode_number }) }}<template v-if="episode.name"> — {{ episode.name }}</template></span>
        </label>
        <Button icon="pi pi-times" text rounded size="small" severity="secondary" @click="removeEpisode(episode)" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.season {
  border: 1px solid var(--p-content-border-color);
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

.season h3 {
  margin: 0;
}

.season-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.8rem;
}

.count {
  color: var(--p-text-muted-color);
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

.episode-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  cursor: pointer;
}
</style>
