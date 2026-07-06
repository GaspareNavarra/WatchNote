<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const error = ref('')
const info = ref('')
const loading = ref(false)
const googleLoading = ref(false)

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

async function handleGoogleSignIn() {
  error.value = ''
  googleLoading.value = true
  try {
    await auth.signInWithGoogle()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Errore durante il login con Google'
  } finally {
    googleLoading.value = false
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
    <Card class="login-card">
      <template #title>WatchNote</template>
      <template #subtitle>
        {{ mode === 'signin' ? 'Accedi al tuo account' : 'Crea un nuovo account' }}
      </template>
      <template #content>
        <Button
          label="Accedi con Google"
          icon="pi pi-google"
          severity="secondary"
          outlined
          class="google-btn"
          :loading="googleLoading"
          @click="handleGoogleSignIn"
        />

        <Divider align="center"><span class="divider-text">oppure</span></Divider>

        <form class="form" @submit.prevent="handleSubmit">
          <label class="field">
            <span>Email</span>
            <InputText v-model="email" type="email" required autocomplete="email" />
          </label>

          <label class="field">
            <span>Password</span>
            <Password
              v-model="password"
              :feedback="false"
              toggle-mask
              required
              autocomplete="current-password"
              :input-props="{ minlength: 6 }"
            />
          </label>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
          <Message v-if="info" severity="success" :closable="false">{{ info }}</Message>

          <Button type="submit" :label="mode === 'signin' ? 'Accedi' : 'Registrati'" :loading="loading" />

          <Button
            type="button"
            link
            class="toggle-link"
            :label="mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'"
            @click="toggleMode"
          />
        </form>
      </template>
    </Card>
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
  max-width: 380px;
}

.google-btn {
  width: 100%;
}

.divider-text {
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
}

.field :deep(input) {
  width: 100%;
}

.toggle-link {
  align-self: center;
  font-size: 0.85rem;
}
</style>
