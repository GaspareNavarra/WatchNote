<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useAuthStore } from './stores/auth'
import BottomNav from './components/BottomNav.vue'

const auth = useAuthStore()
</script>

<template>
  <div id="app-shell">
    <main :class="{ 'with-nav': auth.isAuthenticated }">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="['HomeView', 'SearchView']">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
    <BottomNav v-if="auth.isAuthenticated" />
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

main {
  flex: 1;
}

main.with-nav {
  padding-bottom: calc(112px + env(safe-area-inset-bottom));
}
</style>
