<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })

const email = computed(() => auth.user?.email ?? '')

async function handleSignOut() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="page">
    <RouterLink :to="{ name: 'settings' }" class="back">← {{ t('settings.title') }}</RouterLink>
    <h1>{{ t('settings.account.title') }}</h1>
    <p class="email">{{ email }}</p>
    <Button :label="t('settings.account.signOut')" severity="danger" outlined @click="handleSignOut" />
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.back {
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-decoration: none;
}

.email {
  color: var(--p-text-muted-color);
  margin-bottom: 1.25rem;
}
</style>
