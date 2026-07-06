<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

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
        <button class="btn-link" @click="handleSignOut">Esci</button>
      </div>
    </header>
    <main>
      <RouterView />
    </main>
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
  border-bottom: 1px solid var(--border-color, #2a2a2a);
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

.btn-link {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  text-decoration: underline;
  font: inherit;
  padding: 0;
}

main {
  flex: 1;
}
</style>
