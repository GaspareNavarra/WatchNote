<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeTab = computed(() => route.meta.tab as string | undefined)

const items = [
  { tab: 'home', to: { name: 'home' }, icon: 'pi pi-home', label: 'Home' },
  { tab: 'search', to: { name: 'search' }, icon: 'pi pi-search', label: 'Cerca' },
  { tab: 'settings', to: { name: 'settings' }, icon: 'pi pi-cog', label: 'Impostazioni' },
]
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in items"
      :key="item.tab"
      :to="item.to"
      class="nav-item"
      :class="{ active: activeTab === item.tab }"
    >
      <i :class="item.icon"></i>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px var(--glass-shadow);
  z-index: 50;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--p-text-muted-color);
  font-size: 0.7rem;
  transition: color 0.15s ease;
}

.nav-item i {
  font-size: 1.15rem;
}

.nav-item.active {
  color: var(--p-primary-color);
}
</style>
