<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const error = ref('')
const info = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  info.value = ''
  loading.value = true
  try {
    if (mode.value === 'signin') {
      await auth.signIn(email.value, password.value)
      router.push({ name: 'home' })
    } else {
      await auth.signUp(email.value, password.value)
      if (!auth.session) {
        info.value = 'Controlla la tua email per confermare la registrazione.'
      } else {
        router.push({ name: 'home' })
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Si è verificato un errore'
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin'
  error.value = ''
  info.value = ''
}
</script>

<template>
  <div class="login-page">
    <form class="card login-card" @submit.prevent="handleSubmit">
      <h1>WatchNote</h1>
      <p class="subtitle">
        {{ mode === 'signin' ? 'Accedi al tuo account' : 'Crea un nuovo account' }}
      </p>

      <label>
        Email
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label>
        Password
        <input v-model="password" type="password" required autocomplete="current-password" minlength="6" />
      </label>

      <p v-if="error" class="message error">{{ error }}</p>
      <p v-if="info" class="message info">{{ info }}</p>

      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ mode === 'signin' ? 'Accedi' : 'Registrati' }}
      </button>

      <button class="btn-link" type="button" @click="toggleMode">
        {{ mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.subtitle {
  color: var(--text-muted);
  margin: 0 0 0.5rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
}

.message {
  font-size: 0.85rem;
  margin: 0;
}

.message.error {
  color: var(--danger);
}

.message.info {
  color: var(--success);
}

.btn-link {
  background: none;
  border: none;
  color: var(--accent);
  text-decoration: underline;
  padding: 0;
  font-size: 0.85rem;
}
</style>
