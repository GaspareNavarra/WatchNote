<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNavPreferencesStore } from '../stores/navPreferences'

const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const navPreferences = useNavPreferencesStore()
const activeTab = computed(() => route.meta.tab as string | undefined)

const items = computed(() => [
  { tab: 'home', to: { name: 'home' }, icon: 'pi pi-home', label: t('nav.home') },
  { tab: 'search', to: { name: 'search' }, icon: 'pi pi-search', label: t('nav.search') },
  { tab: 'settings', to: { name: 'settings' }, icon: 'pi pi-cog', label: t('nav.settings') },
])

const SCROLL_THRESHOLD = 6
const TOP_OFFSET = 24

const visible = ref(true)
let lastScrollY = 0

function onScroll() {
  if (!navPreferences.autoHide) return
  const currentY = Math.max(window.scrollY, 0)
  if (currentY <= TOP_OFFSET) {
    visible.value = true
  } else {
    const delta = currentY - lastScrollY
    if (delta > SCROLL_THRESHOLD) visible.value = false
    else if (delta < -SCROLL_THRESHOLD) visible.value = true
  }
  lastScrollY = currentY
}

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

watch(
  () => route.fullPath,
  () => {
    lastScrollY = window.scrollY
    visible.value = true
  },
)

watch(
  () => navPreferences.autoHide,
  (enabled) => {
    if (!enabled) visible.value = true
  },
)
</script>

<template>
  <nav class="bottom-nav" :class="{ 'bottom-nav-hidden': !visible }">
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
  transition: transform 0.25s ease, opacity 0.25s ease;
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

.bottom-nav-hidden {
  transform: translateX(-50%) translateY(140%);
  opacity: 0;
  pointer-events: none;
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
