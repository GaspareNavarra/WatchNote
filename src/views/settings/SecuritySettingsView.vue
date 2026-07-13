<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore } from '../../stores/auth'
import BackButton from '../../components/BackButton.vue'

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n({ useScope: 'global' })

const currentEmail = computed(() => auth.user?.email ?? '')

const newEmail = ref('')
const emailSubmitting = ref(false)

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSubmitting = ref(false)

const passwordsMismatch = computed(
  () => confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
)

async function handleUpdateEmail() {
  if (!newEmail.value.trim()) return
  emailSubmitting.value = true
  try {
    await auth.updateEmail(newEmail.value.trim())
    newEmail.value = ''
    toast.add({
      severity: 'success',
      summary: t('settings.security.emailToast.successSummary'),
      detail: t('settings.security.emailToast.successDetail'),
      life: 5000,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('settings.security.emailToast.errorSummary'),
      detail: e instanceof Error ? e.message : t('settings.security.emailToast.errorSummary'),
      life: 5000,
    })
  } finally {
    emailSubmitting.value = false
  }
}

async function handleUpdatePassword() {
  if (!currentPassword.value || !newPassword.value || passwordsMismatch.value) return
  passwordSubmitting.value = true
  try {
    try {
      await auth.signIn(currentEmail.value, currentPassword.value)
    } catch {
      toast.add({
        severity: 'error',
        summary: t('settings.security.passwordToast.errorSummary'),
        detail: t('settings.security.wrongCurrentPassword'),
        life: 5000,
      })
      return
    }

    await auth.updatePassword(newPassword.value)
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    toast.add({
      severity: 'success',
      summary: t('settings.security.passwordToast.successSummary'),
      detail: t('settings.security.passwordToast.successDetail'),
      life: 3000,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('settings.security.passwordToast.errorSummary'),
      detail: e instanceof Error ? e.message : t('settings.security.passwordToast.errorSummary'),
      life: 5000,
    })
  } finally {
    passwordSubmitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <BackButton :to="{ name: 'settings' }" />
    <h1>{{ t('settings.security.title') }}</h1>

    <Card class="section-card">
      <template #title>{{ t('settings.security.emailSection') }}</template>
      <template #content>
        <form class="form" @submit.prevent="handleUpdateEmail">
          <label class="field">
            <span>{{ t('settings.security.currentEmail') }}</span>
            <InputText :model-value="currentEmail" disabled />
          </label>
          <label class="field">
            <span>{{ t('settings.security.newEmailPlaceholder') }}</span>
            <InputText v-model="newEmail" type="email" autocomplete="email" />
          </label>
          <Button
            type="submit"
            :label="t('settings.security.updateEmail')"
            :loading="emailSubmitting"
            :disabled="!newEmail.trim()"
          />
        </form>
      </template>
    </Card>

    <Card class="section-card">
      <template #title>{{ t('settings.security.passwordSection') }}</template>
      <template #content>
        <form class="form" @submit.prevent="handleUpdatePassword">
          <label class="field">
            <span>{{ t('settings.security.currentPasswordPlaceholder') }}</span>
            <Password
              v-model="currentPassword"
              :feedback="false"
              toggle-mask
              autocomplete="current-password"
            />
          </label>
          <label class="field">
            <span>{{ t('settings.security.newPasswordPlaceholder') }}</span>
            <Password
              v-model="newPassword"
              :feedback="false"
              toggle-mask
              autocomplete="new-password"
              :input-props="{ minlength: 6 }"
            />
          </label>
          <label class="field">
            <span>{{ t('settings.security.confirmPasswordPlaceholder') }}</span>
            <Password
              v-model="confirmPassword"
              :feedback="false"
              toggle-mask
              autocomplete="new-password"
              :input-props="{ minlength: 6 }"
              :invalid="passwordsMismatch"
            />
            <small v-if="passwordsMismatch" class="mismatch">{{ t('settings.security.passwordMismatch') }}</small>
          </label>
          <Button
            type="submit"
            :label="t('settings.security.updatePassword')"
            :loading="passwordSubmitting"
            :disabled="!currentPassword || !newPassword || passwordsMismatch"
          />
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.section-card {
  border-radius: 14px;
  margin-bottom: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
</style>
