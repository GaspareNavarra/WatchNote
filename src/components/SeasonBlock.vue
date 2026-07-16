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

const props = defineProps<{ seasonNumber: number; episodes: DisplayEpisode[] }>()

const emit = defineEmits<{
  toggle: [episodeNumber: number, watched: boolean]
  markAll: [watched: boolean]
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
      </li>
    </ul>
  </div>
</template>

<style scoped>
.season {
  border: 1px solid var(--hairline-border);
  border-radius: 18px;
  padding: 1rem 0.9rem;
  background: var(--surface-card);
}

.season-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.season h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
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

.episode-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.episode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--hairline-border);
}

.episode-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.episode-row:first-child {
  padding-top: 0;
}

.episode-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
}

.episode-label :deep(.p-checkbox),
.episode-label :deep(.p-checkbox-box) {
  width: 22px;
  height: 22px;
  border-radius: 7px;
}
</style>
