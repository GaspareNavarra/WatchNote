<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = computed(() => auth.user?.email ?? '')

async function handleSignOut() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div id="app-shell">
    <header v-if="auth.isAuthenticated" class="app-header">
      <RouterLink to="/" class="brand">WatchNote</RouterLink>
      <div class="header-actions">
        <span class="user-email">{{ email }}</span>
        <Button label="Esci" text size="small" @click="handleSignOut" />
      </div>
    </header>
    <main>
      <RouterView />
    </main>
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
#app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--p-content-border-color);
}

.brand {
  font-weight: 700;
  font-size: 1.25rem;
  text-decoration: none;
  color: inherit;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.user-email {
  opacity: 0.7;
}

main {
  flex: 1;
}
</style>
