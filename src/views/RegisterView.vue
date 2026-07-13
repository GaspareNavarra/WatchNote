<script setup lang="ts">
import { computed, ref } from 'vue'
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
    error.value = t('auth.register.passwordMismatch')
    return
  }

  loading.value = true
  try {
    await auth.signUp(email.value, password.value)
    if (!auth.session) {
      info.value = t('auth.register.confirmEmail')
    } else {
      router.push({ name: 'home' })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('auth.register.genericError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <Card class="register-card">
      <template #title>WatchNote</template>
      <template #subtitle>{{ t('auth.register.subtitle') }}</template>
      <template #content>
        <form class="form" @submit.prevent="handleSubmit">
          <label class="field">
            <span>{{ t('auth.register.email') }}</span>
            <InputText v-model="email" type="email" required autocomplete="email" />
          </label>

          <label class="field">
            <span>{{ t('auth.register.password') }}</span>
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
            <span>{{ t('auth.register.confirmPassword') }}</span>
            <Password
              v-model="confirmPassword"
              :feedback="false"
              toggle-mask
              required
              autocomplete="new-password"
              :input-props="{ minlength: 6 }"
              :invalid="passwordsMismatch"
            />
            <small v-if="passwordsMismatch" class="mismatch">{{ t('auth.register.passwordMismatch') }}</small>
          </label>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
          <Message v-if="info" severity="success" :closable="false">{{ info }}</Message>

          <Button type="submit" :label="t('auth.register.submit')" :loading="loading" />

          <Button
            type="button"
            link
            class="toggle-link"
            :label="t('auth.register.toggleLink')"
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