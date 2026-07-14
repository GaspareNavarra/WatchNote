<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'

export type DisplayEpisode = {
  key: string
  episodeNumber: number
  name: string | null
  watched: boolean
}

const props = defineProps<{ seasonNumber: number; episodes: DisplayEpisode[]; removable?: boolean }>()

const emit = defineEmits<{
  toggle: [episodeNumber: number, watched: boolean]
  markAll: [watched: boolean]
  remove: [episodeNumber: number]
}>()

const { t } = useI18n({ useScope: 'global' })

const sorted = computed(() => [...props.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber))
const watchedCount = computed(() => props.episodes.filter((e) => e.watched).length)
</script>

<template>
  <div class="season">
    <div class="season-header">
      <h3>{{ t('seasonBlock.title', { number: seasonNumber }) }}</h3>
      <div class="season-actions">
        <span class="count">{{ watchedCount }}/{{ episodes.length }}</span>
        <Button :label="t('seasonBlock.markAll')" link size="small" @click="emit('markAll', true)" />
        <Button :label="t('seasonBlock.clear')" link size="small" @click="emit('markAll', false)" />
      </div>
    </div>
    <ul class="episode-list">
      <li v-for="episode in sorted" :key="episode.key" class="episode-row">
        <label class="episode-label">
          <Checkbox
            :model-value="episode.watched"
            binary
            @update:model-value="emit('toggle', episode.episodeNumber, !episode.watched)"
          />
          <span>{{ t('seasonBlock.episode', { number: episode.episodeNumber }) }}<template v-if="episode.name"> — {{ episode.name }}</template></span>
        </label>
        <Button
          v-if="removable !== false"
          icon="pi pi-times"
          text
          rounded
          size="small"
          severity="secondary"
          @click="emit('remove', episode.episodeNumber)"
        />
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
