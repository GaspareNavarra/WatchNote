<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineProps<{
  to: RouteLocationRaw
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <RouterLink :to="to" class="back-btn" :aria-label="t('common.back')">
    <i class="pi pi-arrow-left"></i>
  </RouterLink>
</template>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 14px;
  background: transparent;
  color: var(--text-primary);
  text-decoration: none;
  margin-bottom: 1rem;
  transition: background-color 0.15s ease;
}

.back-btn:hover {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
}

.back-btn:active {
  background: color-mix(in srgb, var(--p-primary-color) 20%, transparent);
}
</style>
