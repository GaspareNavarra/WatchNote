<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const info = ref('')
const loading = ref(false)

const passwordsMismatch = computed(
  () => confirmPassword.value.length > 0 && password.value !== confirmPassword.value
)

async function handleSubmit() {
  error.value = ''
  info.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Le password non coincidono'
    return
  }

  loading.value = true
  try {
    await auth.signUp(email.value, password.value)
    if (!auth.session) {
      info.value = 'Controlla la tua email per confermare la registrazione.'
    } else {
      router.push({ name: 'home' })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Si è verificato un errore'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <Card class="register-card">
      <template #title>WatchNote</template>
      <template #subtitle>Crea un nuovo account</template>
      <template #content>
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
              autocomplete="new-password"
              :input-props="{ minlength: 6 }"
            />
          </label>

          <label class="field">
            <span>Conferma password</span>
            <Password
              v-model="confirmPassword"
              :feedback="false"
              toggle-mask
              required
              autocomplete="new-password"
              :input-props="{ minlength: 6 }"
              :invalid="passwordsMismatch"
            />
            <small v-if="passwordsMismatch" class="mismatch">Le password non coincidono</small>
          </label>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
          <Message v-if="info" severity="success" :closable="false">{{ info }}</Message>

          <Button type="submit" label="Registrati" :loading="loading" />

          <Button
            type="button"
            link
            class="toggle-link"
            label="Hai già un account? Accedi"
            @click="router.push({ name: 'login' })"
          />
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.register-card {
  width: 100%;
  max-width: 380px;
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

.mismatch {
  color: var(--p-red-500);
}

.toggle-link {
  align-self: center;
  font-size: 0.85rem;
}
</style>