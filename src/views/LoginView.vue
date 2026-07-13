<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value, password.value)
    router.push({ name: 'home' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('auth.login.genericError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <Card class="login-card">
      <template #title>WatchNote</template>
      <template #subtitle>{{ t('auth.login.subtitle') }}</template>
      <template #content>
        <form class="form" @submit.prevent="handleSubmit">
          <label class="field">
            <span>{{ t('auth.login.email') }}</span>
            <InputText v-model="email" type="email" required autocomplete="email" />
          </label>

          <label class="field">
            <span>{{ t('auth.login.password') }}</span>
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

          <Button type="submit" :label="t('auth.login.submit')" :loading="loading" />

          <Button
            type="button"
            link
            class="toggle-link"
            :label="t('auth.login.toggleLink')"
            @click="router.push({ name: 'register' })"
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