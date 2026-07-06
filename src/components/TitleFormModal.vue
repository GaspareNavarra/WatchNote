<script setup lang="ts">
import { ref } from 'vue'
import { useTitlesStore } from '../stores/titles'
import type { TitleType } from '../types/database'

const props = defineProps<{ defaultType?: TitleType }>()
const emit = defineEmits<{ close: [] }>()

const titlesStore = useTitlesStore()

const name = ref('')
const type = ref<TitleType>(props.defaultType ?? 'movie')
const posterUrl = ref('')
const notes = ref('')
const error = ref('')
const saving = ref(false)

async function handleSubmit() {
  if (!name.value.trim()) return
  error.value = ''
  saving.value = true
  try {
    await titlesStore.addTitle({
      name: name.value.trim(),
      type: type.value,
      poster_url: posterUrl.value.trim() || null,
      notes: notes.value.trim() || null,
    })
    emit('close')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Errore durante il salvataggio'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <form class="card modal" @submit.prevent="handleSubmit">
      <h2>Aggiungi titolo</h2>

      <label>
        Nome
        <input v-model="name" type="text" required autofocus />
      </label>

      <label>
        Tipo
        <select v-model="type">
          <option value="movie">Film</option>
          <option value="series">Serie TV</option>
          <option value="anime">Anime</option>
        </select>
      </label>

      <label>
        Poster URL (opzionale)
        <input v-model="posterUrl" type="text" placeholder="https://..." />
      </label>

      <label>
        Note (opzionale)
        <textarea v-model="notes" rows="2"></textarea>
      </label>

      <p v-if="error" class="message error">{{ error }}</p>

      <div class="actions">
        <button type="button" class="btn" @click="emit('close')">Annulla</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">Salva</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 10;
}

.modal {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.message.error {
  color: var(--danger);
  font-size: 0.85rem;
  margin: 0;
}
</style>
