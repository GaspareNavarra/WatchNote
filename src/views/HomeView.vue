<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import { useTitlesStore } from '../stores/titles'
import type { TitleType } from '../types/database'
import TitleCard from '../components/TitleCard.vue'
import AddTitleDialog from '../components/AddTitleDialog.vue'

const titlesStore = useTitlesStore()

const filter = ref<'all' | TitleType>('all')
const showAddDialog = ref(false)

const tabs: { value: 'all' | TitleType; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'movie', label: 'Film' },
  { value: 'series', label: 'Serie TV' },
  { value: 'anime', label: 'Anime' },
]

const filteredTitles = computed(() => {
  if (filter.value === 'all') return titlesStore.titles
  return titlesStore.byType(filter.value)
})

onMounted(() => {
  titlesStore.fetchTitles()
})
</script>

<template>
  <div class="home">
    <div class="toolbar">
      <Tabs :value="filter" @update:value="(v) => (filter = v as 'all' | TitleType)">
        <TabList>
          <Tab v-for="tab in tabs" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
        </TabList>
      </Tabs>
      <Button label="Aggiungi" icon="pi pi-plus" @click="showAddDialog = true" />
    </div>

    <div v-if="titlesStore.loading" class="empty">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" stroke-width="4" />
    </div>
    <Message v-else-if="titlesStore.error" severity="error" :closable="false">{{ titlesStore.error }}</Message>
    <p v-else-if="filteredTitles.length === 0" class="empty-text">
      Nessun titolo qui. Aggiungine uno per iniziare a tenere traccia.
    </p>

    <div v-else class="grid">
      <TitleCard v-for="title in filteredTitles" :key="title.id" :title="title" />
    </div>

    <AddTitleDialog v-if="showAddDialog" @close="showAddDialog = false" />
  </div>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.empty {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.empty-text {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 2rem 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
</style>
