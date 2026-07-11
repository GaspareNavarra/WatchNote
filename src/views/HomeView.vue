<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { useTitlesStore } from '../stores/titles'
import type { TitleStatus, TitleType } from '../types/database'
import TitlePoster from '../components/TitlePoster.vue'

const titlesStore = useTitlesStore()

type StatusTab = 'all' | TitleStatus

const query = ref('')
const typeFilter = ref<'all' | TitleType>('all')
const statusTab = ref<StatusTab>('all')

const typeOptions: { label: string; value: 'all' | TitleType }[] = [
  { label: 'Tutti', value: 'all' },
  { label: 'Film', value: 'movie' },
  { label: 'Serie', value: 'series' },
  { label: 'Anime', value: 'anime' },
]

const statusTabs: { value: StatusTab; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'plan_to_watch', label: 'Da vedere' },
  { value: 'watching', label: 'In corso' },
  { value: 'completed', label: 'Visti' },
  { value: 'dropped', label: 'Abbandonati' },
]

const statusSeverity: Record<TitleStatus, 'secondary' | 'info' | 'success' | 'danger'> = {
  plan_to_watch: 'secondary',
  watching: 'info',
  completed: 'success',
  dropped: 'danger',
}

const statusOrder: TitleStatus[] = ['plan_to_watch', 'watching', 'completed', 'dropped']

const searchFiltered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return titlesStore.titles.filter(
    (t) =>
      (typeFilter.value === 'all' || t.type === typeFilter.value) &&
      (!q || t.name.toLowerCase().includes(q))
  )
})

const groups = computed(() => ({
  all: searchFiltered.value,
  plan_to_watch: searchFiltered.value.filter((t) => t.status === 'plan_to_watch'),
  watching: searchFiltered.value.filter((t) => t.status === 'watching'),
  completed: searchFiltered.value.filter((t) => t.status === 'completed'),
  dropped: searchFiltered.value.filter((t) => t.status === 'dropped'),
}))

const activeTitles = computed(() => groups.value[statusTab.value])

const sections = computed(() =>
  statusOrder
    .map((status) => ({
      status,
      label: statusTabs.find((t) => t.value === status)!.label,
      items: groups.value[status],
    }))
    .filter((section) => section.items.length > 0)
)

onMounted(() => {
  titlesStore.fetchTitles()
})
</script>

<template>
  <div class="home">
    <div class="toolbar">
      <IconField class="search-field">
        <InputIcon class="pi pi-search" />
        <InputText v-model="query" placeholder="Cerca nella libreria..." class="search-input" />
      </IconField>
      <SelectButton
        v-model="typeFilter"
        :options="typeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        class="type-filter"
      />
    </div>

    <Tabs :value="statusTab" @update:value="(v) => (statusTab = v as StatusTab)">
      <TabList>
        <Tab v-for="tab in statusTabs" :key="tab.value" :value="tab.value">{{ tab.label }}</Tab>
      </TabList>
    </Tabs>

    <div v-if="titlesStore.loading" class="empty">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" stroke-width="4" />
    </div>
    <Message v-else-if="titlesStore.error" severity="error" :closable="false">{{ titlesStore.error }}</Message>

    <template v-else-if="statusTab === 'all'">
      <p v-if="sections.length === 0" class="empty-text">Nessun titolo qui.</p>
      <div v-else class="section" v-for="section in sections" :key="section.status">
        <div class="section-heading">
          <Tag :value="section.label" :severity="statusSeverity[section.status]" />
        </div>
        <div class="grid">
          <TitlePoster v-for="title in section.items" :key="title.id" :title="title" />
        </div>
      </div>
    </template>

    <template v-else>
      <p v-if="activeTitles.length === 0" class="empty-text">Nessun titolo qui.</p>
      <div v-else class="grid">
        <TitlePoster v-for="title in activeTitles" :key="title.id" :title="title" />
      </div>
    </template>
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
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-field {
  flex: 1;
  min-width: 160px;
}

.search-input {
  width: 100%;
}

.type-filter :deep(.p-togglebutton) {
  padding-inline: 0.6rem;
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
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
}

.section {
  margin-top: 2rem;
}

.section:first-child {
  margin-top: 1rem;
}

.section-heading {
  display: flex;
  justify-content: center;
}

.section-heading :deep(.p-tag) {
  font-size: 0.8rem;
  padding: 0.3rem 0.9rem;
}
</style>
