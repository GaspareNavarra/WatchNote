<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import { useTitlesStore } from '../stores/titles'
import { useAddToLibrary } from '../composables/useAddToLibrary'
import type { UnifiedResult } from '../lib/media'

const props = defineProps<{ result: UnifiedResult }>()

const titlesStore = useTitlesStore()
const { importingId, handleImport } = useAddToLibrary()

const externalSource = computed(() => (props.result.type === 'anime' ? 'jikan' : 'tmdb'))

const isAlreadyAdded = computed(() =>
  titlesStore.titles.some(
    (t) =>
      t.type === props.result.type &&
      t.external_source === externalSource.value &&
      t.external_id === String(props.result.id)
  )
)
</script>

<template>
  <div class="tile">
    <div class="poster">
      <img v-if="result.posterUrl" :src="result.posterUrl" alt="" />
      <div v-else class="poster-placeholder"><i class="pi pi-image"></i></div>
    </div>
    <div class="info">
      <div class="title-row">
        <strong>{{ result.title }}</strong>
        <span v-if="result.year" class="year">({{ result.year }})</span>
      </div>
      <p class="overview">{{ result.overview || 'Nessuna descrizione disponibile.' }}</p>
      <Button
        v-if="isAlreadyAdded"
        label="Già in libreria"
        size="small"
        disabled
        outlined
      />
      <Button
        v-else
        label="Aggiungi"
        icon="pi pi-plus"
        size="small"
        :loading="importingId === result.id"
        :disabled="importingId !== null && importingId !== result.id"
        @click="handleImport(result)"
      />
    </div>
  </div>
</template>

<style scoped>
.tile {
  display: flex;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--p-content-border-color);
}

.poster {
  width: 64px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--p-content-hover-background);
}

.poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--p-text-muted-color);
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.year {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}

.overview {
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
