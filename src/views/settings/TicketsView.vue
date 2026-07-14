<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'
import { useTicketsStore } from '../../stores/tickets'
import { useProfileStore } from '../../stores/profile'
import type { FeatureRequestStatus } from '../../types/database'
import BackButton from '../../components/BackButton.vue'

const store = useTicketsStore()
const profileStore = useProfileStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const { t, locale } = useI18n({ useScope: 'global' })

const searchQuery = ref('')
const statusFilter = ref<FeatureRequestStatus | 'all'>('all')

const statusOptions = computed<{ value: FeatureRequestStatus; label: string }[]>(() => [
  { value: 'pending', label: t('settings.requests.status.pending') },
  { value: 'in_review', label: t('settings.requests.status.in_review') },
  { value: 'done', label: t('settings.requests.status.done') },
  { value: 'rejected', label: t('settings.requests.status.rejected') },
])

const filterStatusOptions = computed<{ value: FeatureRequestStatus | 'all'; label: string }[]>(() => [
  { value: 'all', label: t('settings.tickets.filterAll') },
  { value: 'pending', label: t('settings.requests.status.pending') },
  { value: 'in_review', label: t('settings.requests.status.in_review') },
  { value: 'done', label: t('settings.requests.status.done') },
  { value: 'rejected', label: t('settings.requests.status.rejected') },
  { value: 'deleted', label: t('settings.requests.status.deleted') },
])

const statusLabels = computed<Record<string, string>>(() => ({
  pending: t('settings.requests.status.pending'),
  in_review: t('settings.requests.status.in_review'),
  done: t('settings.requests.status.done'),
  rejected: t('settings.requests.status.rejected'),
  deleted: t('settings.requests.status.deleted'),
}))

const statusSeverity: Record<string, 'secondary' | 'info' | 'success' | 'danger'> = {
  pending: 'secondary',
  in_review: 'info',
  done: 'success',
  rejected: 'danger',
  deleted: 'danger',
}

const filteredTickets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return store.tickets.filter((ticket) => {
    if (statusFilter.value !== 'all' && ticket.status !== statusFilter.value) return false
    if (!q) return true
    return (
      ticket.title.toLowerCase().includes(q) ||
      (ticket.description ?? '').toLowerCase().includes(q) ||
      submitterName(ticket.user_id).toLowerCase().includes(q)
    )
  })
})

onMounted(async () => {
  if (!profileStore.profile) {
    await profileStore.fetchProfile()
  }
  if (!profileStore.isAdmin) {
    router.replace({ name: 'settings' })
    return
  }
  store.fetchRecent()
})

function submitterName(userId: string) {
  return store.profilesById[userId]?.nickname || userId.slice(0, 8)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'it' ? 'it-IT' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function viewAll() {
  store.fetchAll()
}

async function handleStatusChange(id: string, status: FeatureRequestStatus) {
  try {
    await store.updateStatus(id, status)
    toast.add({ severity: 'success', summary: t('settings.tickets.updateSuccess'), life: 2000 })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('settings.tickets.updateError'),
      detail: e instanceof Error ? e.message : t('settings.tickets.updateError'),
      life: 5000,
    })
  }
}

async function handleReopen(id: string) {
  try {
    await store.updateStatus(id, 'pending')
    toast.add({ severity: 'success', summary: t('settings.tickets.reopenSuccess'), life: 2000 })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('settings.tickets.updateError'),
      detail: e instanceof Error ? e.message : t('settings.tickets.updateError'),
      life: 5000,
    })
  }
}

function handleDelete(id: string) {
  confirm.require({
    message: t('settings.tickets.deleteConfirm.message'),
    header: t('settings.tickets.deleteConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('settings.tickets.deleteConfirm.accept'),
    rejectLabel: t('settings.tickets.deleteConfirm.reject'),
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await store.deleteTicket(id)
        toast.add({ severity: 'success', summary: t('settings.tickets.deleteSuccess'), life: 2000 })
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: t('settings.tickets.deleteError'),
          detail: e instanceof Error ? e.message : t('settings.tickets.deleteError'),
          life: 5000,
        })
      }
    },
  })
}
</script>

<template>
  <div class="page">
    <BackButton :to="{ name: 'settings' }" />
    <h1>{{ t('settings.tickets.title') }}</h1>
    <p class="hint">{{ t('settings.tickets.subtitle') }}</p>

    <div v-if="store.loading" class="loading">
      <ProgressSpinner style="width: 2.5rem; height: 2.5rem" stroke-width="4" />
    </div>

    <template v-else>
      <div v-if="store.showingAll" class="filters">
        <IconField class="search-field">
          <InputIcon class="pi pi-search" />
          <InputText v-model="searchQuery" :placeholder="t('settings.tickets.searchPlaceholder')" class="search-input" />
        </IconField>
        <Select
          v-model="statusFilter"
          :options="filterStatusOptions"
          option-label="label"
          option-value="value"
          class="status-filter"
        />
      </div>

      <p v-if="filteredTickets.length === 0" class="empty">{{ t('settings.tickets.empty') }}</p>

      <ul v-else class="ticket-list">
        <li
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          class="ticket-item"
          :class="{ 'ticket-item-deleted': ticket.status === 'deleted' }"
        >
          <div class="ticket-header">
            <strong>{{ ticket.title }}</strong>
            <Tag :value="statusLabels[ticket.status]" :severity="statusSeverity[ticket.status]" />
          </div>
          <p v-if="ticket.description" class="ticket-desc">{{ ticket.description }}</p>
          <div class="ticket-meta">
            <span>{{ t('settings.tickets.submittedBy', { name: submitterName(ticket.user_id) }) }}</span>
            <span>{{ formatDate(ticket.created_at) }}</span>
          </div>
          <div class="ticket-actions">
            <template v-if="ticket.status !== 'deleted'">
              <Select
                :model-value="ticket.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                class="status-select"
                @update:model-value="(value: FeatureRequestStatus) => handleStatusChange(ticket.id, value)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                :aria-label="t('settings.tickets.deleteButton')"
                @click="handleDelete(ticket.id)"
              />
            </template>
            <Button
              v-else
              :label="t('settings.tickets.reopen')"
              icon="pi pi-refresh"
              text
              @click="handleReopen(ticket.id)"
            />
          </div>
        </li>
      </ul>

      <Button
        v-if="!store.showingAll && store.tickets.length >= 6"
        :label="t('settings.tickets.viewAll')"
        text
        class="view-all-btn"
        @click="viewAll"
      />
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.hint {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.empty {
  color: var(--p-text-muted-color);
  text-align: center;
  padding: 2rem 0;
}

.ticket-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.ticket-item {
  border: 1px solid var(--p-content-border-color);
  border-radius: 12px;
  padding: 0.85rem;
}

.ticket-item-deleted {
  opacity: 0.5;
}

.filters {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.search-field {
  flex: 1;
}

.search-input {
  width: 100%;
}

.status-filter {
  flex-shrink: 0;
  width: 160px;
}

.view-all-btn {
  display: block;
  margin: 1rem auto 0;
}

.ticket-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.ticket-desc {
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  margin: 0 0 0.5rem;
}

.ticket-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  margin-bottom: 0.6rem;
}

.ticket-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-select {
  flex: 1;
}
</style>
