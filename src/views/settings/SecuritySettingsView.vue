<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../stores/auth'
import BackButton from '../../components/BackButton.vue'

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n({ useScope: 'global' })

const currentEmail = computed(() => auth.user?.email ?? '')

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordSubmitting = ref(false)

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordsMismatch = computed(
  () => confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
)

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

    <div class="section-card">
      <div class="card-header">
        <span class="card-icon-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </span>
        <h2 class="card-title">{{ t('settings.security.passwordSection') }}</h2>
      </div>

      <form class="form" @submit.prevent="handleUpdatePassword">
        <label class="field">
          <span class="field-label">{{ t('settings.security.currentPasswordPlaceholder') }}</span>
          <div class="input-row">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              v-model="currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :placeholder="t('settings.security.currentPasswordPlaceholder')"
              class="input-el"
            />
            <button
              type="button"
              class="input-toggle"
              :aria-label="showCurrentPassword ? t('settings.security.hidePassword') : t('settings.security.showPassword')"
              @click="showCurrentPassword = !showCurrentPassword"
            >
              <svg v-if="showCurrentPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </label>

        <label class="field">
          <span class="field-label">{{ t('settings.security.newPasswordPlaceholder') }}</span>
          <div class="input-row">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              autocomplete="new-password"
              minlength="6"
              :placeholder="t('settings.security.newPasswordPlaceholder')"
              class="input-el"
            />
            <button
              type="button"
              class="input-toggle"
              :aria-label="showNewPassword ? t('settings.security.hidePassword') : t('settings.security.showPassword')"
              @click="showNewPassword = !showNewPassword"
            >
              <svg v-if="showNewPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </label>

        <label class="field">
          <span class="field-label">{{ t('settings.security.confirmPasswordPlaceholder') }}</span>
          <div class="input-row" :class="{ 'input-row-invalid': passwordsMismatch }">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              minlength="6"
              :placeholder="t('settings.security.confirmPasswordPlaceholder')"
              class="input-el"
            />
            <button
              type="button"
              class="input-toggle"
              :aria-label="showConfirmPassword ? t('settings.security.hidePassword') : t('settings.security.showPassword')"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg v-if="showConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <small v-if="passwordsMismatch" class="mismatch">{{ t('settings.security.passwordMismatch') }}</small>
        </label>

        <button
          type="submit"
          class="submit-btn"
          :disabled="passwordSubmitting || !currentPassword || !newPassword || passwordsMismatch"
        >
          <span v-if="passwordSubmitting" class="spinner"></span>
          <span v-else>{{ t('settings.security.updatePassword') }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.section-card {
  position: relative;
  border-radius: 24px;
  padding: 22px 20px 20px;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  background: linear-gradient(
    180deg,
    var(--auth-card-from),
    color-mix(in srgb, var(--p-primary-color) 7%, var(--auth-card-to))
  );
  border: 1px solid color-mix(in srgb, var(--p-primary-color) 22%, transparent);
  box-shadow: 0 20px 45px -24px color-mix(in srgb, var(--p-primary-color) 55%, transparent);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.card-icon-badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--p-primary-color) 18%, transparent);
  color: var(--p-primary-color);
}

.card-icon-badge svg {
  width: 18px;
  height: 18px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.input-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 50px;
  padding: 0 14px;
  border-radius: 14px;
  background: var(--surface-chip);
  border: 1px solid color-mix(in srgb, var(--p-primary-color) 22%, transparent);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.input-row:focus-within {
  border-color: color-mix(in srgb, var(--p-primary-color) 85%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-primary-color) 18%, transparent);
}

.input-row-invalid {
  border-color: color-mix(in srgb, var(--p-red-500) 70%, transparent);
}

.input-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

.input-el {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14.5px;
  font-family: inherit;
}

.input-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  padding: 0;
  color: var(--text-muted);
  cursor: pointer;
}

.input-toggle svg {
  width: 18px;
  height: 18px;
}

.mismatch {
  color: var(--p-red-500);
  font-size: 12px;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--p-primary-color) 70%, white 30%),
    color-mix(in srgb, var(--p-primary-color) 85%, white 15%)
  );
  color: #140f24;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 28px -10px color-mix(in srgb, var(--p-primary-color) 85%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 32px -10px color-mix(in srgb, var(--p-primary-color) 95%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.submit-btn:disabled {
  opacity: 0.75;
  cursor: default;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(20, 15, 36, 0.35);
  border-top-color: #140f24;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
