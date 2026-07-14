<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useTitlesStore } from '../stores/titles'
import { useAddToLibrary } from '../composables/useAddToLibrary'
import type { UnifiedResult } from '../lib/media'

const props = defineProps<{ result: UnifiedResult }>()

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const titlesStore = useTitlesStore()
const { importingId, handleImport } = useAddToLibrary()

const externalSource = computed(() => (props.result.type === 'anime' ? 'anilist' : 'tmdb'))

const matchedTitle = computed(() =>
  titlesStore.titles.find(
    (t) =>
      t.type === props.result.type &&
      t.external_source === externalSource.value &&
      t.external_id === String(props.result.id)
  )
)

const isAlreadyAdded = computed(() => !!matchedTitle.value)

function openDetail() {
  if (matchedTitle.value) {
    router.push({ name: 'title-detail', params: { id: matchedTitle.value.id } })
    return
  }
  router.push({
    name: 'title-preview',
    params: { type: props.result.type, externalId: String(props.result.id) },
  })
}
</script>

<template>
  <div
    class="tile tile-clickable"
    role="link"
    tabindex="0"
    @click="openDetail"
    @keydown.enter="openDetail"
  >
    <div class="content-row">
      <div class="poster">
        <img v-if="result.posterUrl" :src="result.posterUrl" alt="" />
        <div v-else class="poster-placeholder"><i class="pi pi-image"></i></div>
      </div>
      <div class="info">
        <div class="title-row">
          <strong>{{ result.title }}</strong>
          <span v-if="result.year" class="year">({{ result.year }})</span>
        </div>
        <p class="overview">{{ result.overview || t('searchResultTile.noOverview') }}</p>
      </div>
    </div>

    <button
      v-if="!isAlreadyAdded"
      type="button"
      class="add-btn"
      :disabled="importingId !== null && importingId !== result.id"
      @click.stop="handleImport(result)"
    >
      <span v-if="importingId === result.id" class="spinner"></span>
      <template v-else>
        <svg class="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>{{ t('searchResultTile.add') }}</span>
      </template>
    </button>
    <button v-else type="button" class="add-btn add-btn-added" disabled @click.stop>
      <i class="pi pi-check add-icon"></i>
      <span>{{ t('searchResultTile.alreadyAdded') }}</span>
    </button>
  </div>
</template>

<style scoped>
.tile {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    var(--auth-card-from),
    color-mix(in srgb, var(--p-primary-color) 7%, var(--auth-card-to))
  );
  border: 1px solid color-mix(in srgb, var(--p-primary-color) 22%, transparent);
  box-shadow: 0 20px 45px -28px color-mix(in srgb, var(--p-primary-color) 55%, transparent);
}

.tile-clickable {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.tile-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 50px -26px color-mix(in srgb, var(--p-primary-color) 65%, transparent);
}

.tile-clickable:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--p-primary-color) 75%, transparent);
  outline-offset: 2px;
}

.content-row {
  display: flex;
  gap: 0.85rem;
}

.poster {
  width: 72px;
  height: 104px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-chip);
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
  color: var(--text-muted);
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
}

.title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.title-row strong {
  color: var(--text-primary);
  font-size: 0.98rem;
}

.year {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.overview {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--p-primary-color) 70%, white 30%),
    color-mix(in srgb, var(--p-primary-color) 85%, white 15%)
  );
  color: #140f24;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px -10px color-mix(in srgb, var(--p-primary-color) 85%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px -10px color-mix(in srgb, var(--p-primary-color) 95%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.add-btn:disabled {
  opacity: 0.65;
  cursor: default;
  transform: none;
}

.add-icon {
  width: 18px;
  height: 18px;
}

.add-btn-added {
  background: var(--surface-chip);
  color: var(--text-secondary);
  border: 1px solid var(--hairline-border);
  box-shadow: none;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(20, 15, 36, 0.35);
  border-top-color: #140f24;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
