<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const NICKNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/

const email = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const nicknameStatus = ref<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')

const passwordsMismatch = computed(
  () => confirmPassword.value.length > 0 && password.value !== confirmPassword.value
)

let nicknameDebounce: ReturnType<typeof setTimeout> | undefined
let nicknameCheckToken = 0

async function checkNicknameAvailability(value: string) {
  const token = ++nicknameCheckToken
  const { data, error: rpcError } = await supabase.rpc('nickname_available', { p_nickname: value })
  if (token !== nicknameCheckToken) return
  if (rpcError) {
    nicknameStatus.value = 'idle'
    return
  }
  nicknameStatus.value = data ? 'available' : 'taken'
}

watch(nickname, (value) => {
  const trimmed = value.trim()
  nicknameCheckToken++
  if (nicknameDebounce) clearTimeout(nicknameDebounce)

  if (!trimmed) {
    nicknameStatus.value = 'idle'
    return
  }
  if (!NICKNAME_PATTERN.test(trimmed)) {
    nicknameStatus.value = 'invalid'
    return
  }
  nicknameStatus.value = 'checking'
  nicknameDebounce = setTimeout(() => checkNicknameAvailability(trimmed), 500)
})

async function handleSubmit() {
  error.value = ''

  const trimmedNickname = nickname.value.trim()
  if (!NICKNAME_PATTERN.test(trimmedNickname)) {
    nicknameStatus.value = 'invalid'
    error.value = t('auth.register.nicknameInvalid')
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = t('auth.register.passwordMismatch')
    return
  }

  loading.value = true
  try {
    const { data: available, error: rpcError } = await supabase.rpc('nickname_available', {
      p_nickname: trimmedNickname,
    })
    if (rpcError) throw rpcError
    if (!available) {
      nicknameStatus.value = 'taken'
      error.value = t('auth.register.nicknameTaken')
      return
    }

    await auth.signUp(email.value, password.value, trimmedNickname)
    if (!auth.session) {
      router.push({ name: 'register-confirm' })
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
  <div class="login-page">
    <div class="card-shell">
      <div class="card-glow"></div>
      <div class="card-border">
        <div class="card-inner">
          <div class="brand">
            <img src="/logo.png" alt="WatchNote" class="brand-icon" />
            <div class="brand-text">
              <span class="brand-name">WatchNote</span>
              <span class="brand-subtitle">{{ t('auth.register.subtitle') }}</span>
            </div>
          </div>

          <form class="form" @submit.prevent="handleSubmit">
            <label class="field">
              <span class="field-label">{{ t('auth.register.email') }}</span>
              <div class="input-row">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  :placeholder="t('auth.register.emailPlaceholder')"
                  class="input-el"
                />
              </div>
            </label>

            <label class="field">
              <span class="field-label">{{ t('auth.register.nickname') }}</span>
              <div
                class="input-row"
                :class="{
                  'input-row-invalid': nicknameStatus === 'taken' || nicknameStatus === 'invalid',
                  'input-row-valid': nicknameStatus === 'available',
                }"
              >
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  v-model="nickname"
                  type="text"
                  required
                  autocomplete="username"
                  minlength="3"
                  maxlength="20"
                  :placeholder="t('auth.register.nicknamePlaceholder')"
                  class="input-el"
                />
                <svg
                  v-if="nicknameStatus === 'available'"
                  class="input-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <small v-if="nicknameStatus === 'taken'" class="mismatch">{{ t('auth.register.nicknameTaken') }}</small>
              <small v-else-if="nicknameStatus === 'invalid'" class="mismatch">{{ t('auth.register.nicknameInvalid') }}</small>
              <small v-else-if="nicknameStatus === 'checking'" class="hint">{{ t('common.loading') }}</small>
            </label>

            <label class="field">
              <span class="field-label">{{ t('auth.register.password') }}</span>
              <div class="input-row">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  minlength="6"
                  :placeholder="t('auth.register.passwordPlaceholder')"
                  class="input-el"
                />
                <button
                  type="button"
                  class="input-toggle"
                  :aria-label="showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
                  @click="showPassword = !showPassword"
                >
                  <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
              <span class="field-label">{{ t('auth.register.confirmPassword') }}</span>
              <div class="input-row" :class="{ 'input-row-invalid': passwordsMismatch }">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  minlength="6"
                  :placeholder="t('auth.register.confirmPasswordPlaceholder')"
                  class="input-el"
                />
                <button
                  type="button"
                  class="input-toggle"
                  :aria-label="showConfirmPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')"
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
              <small v-if="passwordsMismatch" class="mismatch">{{ t('auth.register.passwordMismatch') }}</small>
            </label>

            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <span v-else>{{ t('auth.register.submit') }}</span>
            </button>
          </form>

          <p class="footer-text">
            {{ t('auth.register.toggleLinkPrefix') }}
            <a href="#" class="footer-link" @click.prevent="router.push({ name: 'login' })">{{
              t('auth.register.toggleLinkAction')
            }}</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.login-page {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

.card-shell {
  position: relative;
  width: 100%;
  max-width: 360px;
}

.card-glow {
  position: absolute;
  inset: -40px;
  background: radial-gradient(
    circle at 50% 35%,
    color-mix(in srgb, var(--p-primary-color) 35%, transparent),
    transparent 70%
  );
  filter: blur(20px);
  z-index: 0;
  pointer-events: none;
}

.card-border {
  position: relative;
  z-index: 1;
  border-radius: 24px;
  padding: 1px;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--p-primary-color) 55%, transparent) 0%,
    transparent 100%
  );
  box-shadow: 0 24px 60px -18px rgba(0, 0, 0, 0.7);
}

.card-inner {
  border-radius: 23px;
  background: linear-gradient(180deg, var(--auth-card-from), var(--auth-card-to));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 30px 26px 26px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 26px;
}

.brand-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-name {
  font-size: 21px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.brand-subtitle {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  border: 1px solid var(--hairline-border);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.input-row:focus-within {
  border-color: color-mix(in srgb, var(--p-primary-color) 85%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--p-primary-color) 18%, transparent);
}

.input-row-invalid {
  border-color: color-mix(in srgb, var(--p-red-500, #ef4444) 70%, transparent);
}

.input-row-valid {
  border-color: color-mix(in srgb, var(--p-green-500, #22c55e) 70%, transparent);
}

.input-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--text-muted);
}

.input-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--p-green-500, #22c55e);
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
  color: var(--p-red-500, #ef4444);
  font-size: 12px;
}

.hint {
  color: var(--text-muted);
  font-size: 12px;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--p-primary-color) 70%, white 30%),
    color-mix(in srgb, var(--p-primary-color) 85%, white 15%)
  );
  color: #140f24;
  font-family: inherit;
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

.footer-text {
  margin: 20px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}

.footer-link {
  margin-left: 4px;
  color: var(--p-primary-color);
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 380px) {
  .brand-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
