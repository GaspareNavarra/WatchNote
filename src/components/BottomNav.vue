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
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  display: flex;
  align-items: stretch;
  width: min(90vw, 360px);
  padding: 0.55rem 0.5rem;
  border-radius: 999px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px var(--glass-shadow);
  z-index: 50;
}

.nav-item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.35rem 0.25rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--p-text-muted-color);
  font-size: 0.68rem;
  line-height: 1.2;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.nav-item i {
  font-size: 1.15rem;
  line-height: 1;
}

.nav-item.active {
  color: var(--p-primary-color);
}
</style>
