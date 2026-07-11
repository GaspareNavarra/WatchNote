<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import { useFeatureRequestsStore } from '../../stores/featureRequests'

const store = useFeatureRequestsStore()
const toast = useToast()

const title = ref('')
const description = ref('')
const submitting = ref(false)

const statusLabels: Record<string, string> = {
  pending: 'In attesa',
  in_review: 'In revisione',
  done: 'Fatto',
  rejected: 'Rifiutata',
}

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
    toast.add({ severity: 'success', summary: 'Inviata', detail: 'Richiesta inviata, grazie!', life: 3000 })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Errore',
      detail: e instanceof Error ? e.message : "Errore durante l'invio",
      life: 5000,
    })
  } finally {
    submitting.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="page">
    <RouterLink :to="{ name: 'settings' }" class="back">← Impostazioni</RouterLink>
    <h1>Richieste</h1>
    <p class="hint">
      Proponi una funzionalità o segnala qualcosa: titolo + descrizione, max 3 richieste al giorno.
    </p>

    <form class="form" @submit.prevent="handleSubmit">
      <InputText v-model="title" placeholder="Titolo" required />
      <Textarea v-model="description" placeholder="Descrizione (opzionale)" rows="3" autoResize />
      <Message v-if="store.remainingToday === 0" severity="warn" :closable="false">
        Hai raggiunto il limite giornaliero. Torna domani.
      </Message>
      <p v-else class="remaining">Ti restano {{ store.remainingToday }} richieste oggi</p>
      <Button
        type="submit"
        label="Invia"
        icon="pi pi-send"
        :loading="submitting"
        :disabled="!title.trim() || store.remainingToday === 0"
      />
    </form>

    <div v-if="store.requests.length > 0" class="history">
      <h3>Le tue richieste</h3>
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
