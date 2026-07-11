<script setup lang="ts">
import { computed } from 'vue'
import { useTitlesStore } from '../stores/titles'
import type { TitleRow } from '../types/database'

const props = defineProps<{ title: TitleRow }>()

const titlesStore = useTitlesStore()

const progress = computed(() => titlesStore.progress(props.title.id))
const showProgress = computed(
  () => props.title.type !== 'movie' && props.title.status === 'watching' && progress.value.total > 0
)
</script>

<template>
  <RouterLink :to="{ name: 'title-detail', params: { id: title.id } }" class="poster-tile">
    <div class="poster">
      <img v-if="title.poster_url" :src="title.poster_url" alt="" />
      <div v-else class="poster-placeholder"><i class="pi pi-image"></i></div>
      <div v-if="showProgress" class="progress-badge">{{ progress.watched }}/{{ progress.total }}</div>
      <div class="scrim">
        <span class="name">{{ title.name }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.poster-tile {
  display: block;
  text-decoration: none;
  color: inherit;
}

.poster {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 10px;
  overflow: hidden;
  background: var(--p-content-hover-background);
}

.poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--p-text-muted-color);
  font-size: 1.75rem;
}

.progress-badge {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}

.scrim {
  position: absolute;
  inset: auto 0 0 0;
  padding: 1.5rem 0.5rem 0.4rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
}

.name {
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
