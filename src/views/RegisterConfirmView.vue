<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

function goToLogin() {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="confirm-page">
    <Card class="confirm-card">
      <template #content>
        <div class="icon-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <h1>{{ t('auth.register.confirmTitle') }}</h1>
        <p class="message">{{ t('auth.register.confirmEmail') }}</p>
        <Button :label="t('auth.register.confirmContinue')" class="continue-btn" @click="goToLogin" />
      </template>
    </Card>
  </div>
</template>

<style scoped>
.confirm-page {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.confirm-card {
  width: 100%;
  max-width: 380px;
  text-align: center;
}

.icon-circle {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--p-primary-color) 14%, transparent);
  color: var(--p-primary-color);
}

.icon-circle svg {
  width: 26px;
  height: 26px;
}

h1 {
  font-size: 1.3rem;
  margin: 0 0 0.6rem;
}

.message {
  color: var(--p-text-muted-color);
  margin: 0 0 1.5rem;
}

.continue-btn {
  width: 100%;
}
</style>
