<script setup lang="ts">
import { computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useTitlesStore } from '../stores/titles'
import type { TitleRow } from '../types/database'

const props = defineProps<{ title: TitleRow }>()

const titlesStore = useTitlesStore()
const confirm = useConfirm()
const toast = useToast()

const isMovie = computed(() => props.title.type === 'movie')
const isWatched = computed(() => props.title.status === 'completed')

const statusLabels: Record<string, string> = {
  plan_to_watch: 'Da vedere',
  watching: 'In corso',
  completed: 'Completato',
  dropped: 'Abbandonato',
}

const statusSeverity: Record<string, 'secondary' | 'info' | 'success' | 'danger'> = {
  plan_to_watch: 'secondary',
  watching: 'info',
  completed: 'success',
  dropped: 'danger',
}

async function toggleMovieWatched() {
  await titlesStore.updateTitle(props.title.id, {
    status: isWatched.value ? 'plan_to_watch' : 'completed',
  })
}

function handleDelete() {
  confirm.require({
    message: `Eliminare "${props.title.name}"?`,
    header: 'Conferma eliminazione',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Elimina',
    rejectLabel: 'Annulla',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await titlesStore.deleteTitle(props.title.id)
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'Errore',
          detail: e instanceof Error ? e.message : 'Impossibile eliminare il titolo',
          life: 4000,
        })
      }
    },
  })
}
</script>

<template>
  <div class="title-card">
    <img v-if="title.poster_url" :src="title.poster_url" alt="" class="poster" />
    <div v-else class="poster poster-placeholder"><i class="pi pi-image"></i></div>
    <div class="body">
      <div class="header-row">
        <h3>{{ title.name }}</h3>
        <Button icon="pi pi-times" text rounded size="small" severity="danger" @click="handleDelete" />
      </div>
      <Tag :value="statusLabels[title.status]" :severity="statusSeverity[title.status]" />
      <p v-if="title.overview" class="overview">{{ title.overview }}</p>

      <div class="actions">
        <Button
          v-if="isMovie"
          :label="isWatched ? 'Visto' : 'Segna come visto'"
          :icon="isWatched ? 'pi pi-check' : undefined"
          :severity="isWatched ? 'success' : 'primary'"
          :outlined="isWatched"
          size="small"
          @click="toggleMovieWatched"
        />
        <RouterLink v-else :to="{ name: 'title-detail', params: { id: title.id } }">
          <Button label="Gestisci episodi" size="small" outlined />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-card {
  display: flex;
  gap: 0.75rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 12px;
  background: var(--p-content-background);
  padding: 1rem;
}

.poster {
  width: 64px;
  height: 96px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-content-hover-background);
  color: var(--p-text-muted-color);
  font-size: 1.5rem;
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

h3 {
  font-size: 1rem;
  margin: 0;
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

.actions {
  margin-top: auto;
  display: flex;
  gap: 0.5rem;
}
</style>
