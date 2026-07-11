<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ icon: string; label: string; to: RouteLocationRaw }>()
</script>

<template>
  <RouterLink :to="to" class="settings-row">
    <i :class="icon"></i>
    <span class="label">{{ label }}</span>
    <i class="pi pi-chevron-right chevron"></i>
  </RouterLink>
</template>

<style scoped>
.settings-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 0.25rem;
  border-bottom: 1px solid var(--p-content-border-color);
  text-decoration: none;
  color: inherit;
}

.settings-row i:not(.chevron) {
  font-size: 1.1rem;
  color: var(--p-primary-color);
  width: 1.5rem;
  text-align: center;
}

.label {
  flex: 1;
}

.chevron {
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}
</style>
