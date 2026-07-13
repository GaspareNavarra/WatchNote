<script setup lang="ts">
import type { Titolo } from '../lib/titoliUi'
import { categoriaIcon, episodiLabel, progresso, statoColor, statoIcon } from '../lib/titoliUi'

defineProps<{ t: Titolo }>()
</script>

<template>
  <article class="title-card" :style="{ borderColor: statoColor[t.stato] }">
    <div class="poster">
      <img v-if="t.copertina" :src="t.copertina" alt="" class="poster-img" />
      <div v-else class="poster-fallback">
        <i :class="categoriaIcon[t.categoria]"></i>
      </div>

      <span class="status-badge" :style="{ color: statoColor[t.stato], borderColor: statoColor[t.stato] }">
        <i :class="statoIcon[t.stato]"></i>
      </span>

      <div class="poster-overlay">
        <p class="card-title">{{ t.titolo }}</p>
        <p class="card-episodes">{{ episodiLabel(t) }}</p>
      </div>
    </div>

    <div class="progress-track">
      <div class="progress-fill" :style="{ width: `${progresso(t)}%`, background: statoColor[t.stato] }"></div>
    </div>
  </article>
</template>

<style scoped>
.title-card {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 2px solid;
  background: #16141c;
  overflow: hidden;
  cursor: pointer;
}

.poster {
  position: relative;
  aspect-ratio: 2 / 3;
  width: 100%;
  background: linear-gradient(160deg, #2a1f3d, #16141c);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.poster-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.18);
  font-size: 2.5rem;
}

.status-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: rgba(8, 7, 9, 0.75);
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.poster-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.4rem 0.55rem 0.5rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 100%);
}

.card-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-episodes {
  margin: 0.15rem 0 0;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.7);
}

.progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
}

.progress-fill {
  height: 100%;
}
</style>
