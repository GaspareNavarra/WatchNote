<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import { useFeatureRequestsStore } from '../../stores/featureRequests'

const store = useFeatureRequestsStore()
const toast = useToast()
const { t, locale } = useI18n({ useScope: 'global' })

const title = ref('')
const description = ref('')
const submitting = ref(false)

const statusLabels = computed<Record<string, string>>(() => ({
  pending: t('settings.requests.status.pending'),
  in_review: t('settings.requests.status.in_review'),
  done: t('settings.requests.status.done'),
  rejected: t('settings.requests.status.rejected'),
}))

const statusSeverity: Record<string, 'secondary' | 'info' | 'success' | 'danger'> = {
  pending: 'secondary',
  in_review: 'info',
  done: 'success',
  rejected: 'danger',
}

onMounted(() => {
  store.fetchRequests()
})

async function handleSubmit() {
  if (!title.value.trim() || store.remainingToday === 0) return
  submitting.value = true
  try {
    await store.createRequest(title.value.trim(), description.value.trim())
    title.value = ''
    description.value = ''
    toast.add({
      severity: 'success',
      summary: t('settings.requests.toast.successSummary'),
      detail: t('settings.requests.toast.successDetail'),
      life: 3000,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('settings.requests.toast.errorSummary'),
      detail: e instanceof Error ? e.message : t('settings.requests.toast.errorDetailFallback'),
      life: 5000,
    })
  } finally {
    submitting.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(locale.value === 'it' ? 'it-IT' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="page">
    <RouterLink :to="{ name: 'settings' }" class="back">← {{ t('settings.title') }}</RouterLink>
    <h1>{{ t('settings.requests.title') }}</h1>
    <p class="hint">
      {{ t('settings.requests.hint') }}
    </p>

    <form class="form" @submit.prevent="handleSubmit">
      <InputText v-model="title" :placeholder="t('settings.requests.titlePlaceholder')" required />
      <Textarea v-model="description" :placeholder="t('settings.requests.descriptionPlaceholder')" rows="3" autoResize />
      <Message v-if="store.remainingToday === 0" severity="warn" :closable="false">
        {{ t('settings.requests.limitReached') }}
      </Message>
      <p v-else class="remaining">{{ t('settings.requests.remaining', { count: store.remainingToday }) }}</p>
      <Button
        type="submit"
        :label="t('settings.requests.submit')"
        icon="pi pi-send"
        :loading="submitting"
        :disabled="!title.trim() || store.remainingToday === 0"
      />
    </form>

    <div v-if="store.requests.length > 0" class="history">
      <h3>{{ t('settings.requests.history') }}</h3>
      <ul class="history-list">
        <li v-for="r in store.requests" :key="r.id" class="history-item">
          <div class="history-header">
            <strong>{{ r.title }}</strong>
            <Tag :value="statusLabels[r.status]" :severity="statusSeverity[r.status]" />
          </div>
          <p v-if="r.description" class="history-desc">{{ r.description }}</p>
          <span class="history-date">{{ formatDate(r.created_at) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.back {
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-decoration: none;
}

.hint {
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.remaining {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
  margin: 0;
}

.history h3 {
  font-size: 0.95rem;
  margin-bottom: 0.6rem;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
  padding: 0.75rem;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.history-desc {
  font-size: 0.85rem;
  color: var(--p-text-muted-color);
  margin: 0 0 0.3rem;
}

.history-date {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
}
</style>
