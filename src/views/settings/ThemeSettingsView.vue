<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore, type ThemeMode, type ThemeVariant } from '../../stores/theme'
import BackButton from '../../components/BackButton.vue'

const theme = useThemeStore()
const { t } = useI18n({ useScope: 'global' })

const modeOptions = computed<{ value: ThemeMode; label: string; description: string; icon: string }[]>(() => [
  { value: 'light', label: t('settings.theme.modes.light'), description: t('settings.theme.modeDescriptions.light'), icon: 'pi pi-sun' },
  { value: 'dark', label: t('settings.theme.modes.dark'), description: t('settings.theme.modeDescriptions.dark'), icon: 'pi pi-moon' },
])

const variantOptions = computed<{ value: ThemeVariant; label: string; description: string; swatch: string }[]>(() => [
  { value: 'primary', label: t('settings.theme.variants.primary'), description: t('settings.theme.variantDescriptions.primary'), swatch: '#10b981' },
  { value: 'secondary', label: t('settings.theme.variants.secondary'), description: t('settings.theme.variantDescriptions.secondary'), swatch: '#00478f' },
  { value: 'nebula', label: t('settings.theme.variants.nebula'), description: t('settings.theme.variantDescriptions.nebula'), swatch: '#7c3aed' },
])
</script>

<template>
  <div class="page">
    <BackButton :to="{ name: 'settings' }" />
    <h1>{{ t('settings.theme.title') }}</h1>

    <div class="group-label">{{ t('settings.theme.modeLabel') }}</div>
    <div class="option-list">
      <button
        v-for="option in modeOptions"
        :key="option.value"
        type="button"
        class="option-row"
        :class="{ selected: theme.mode === option.value }"
        @click="theme.setMode(option.value)"
      >
        <div class="option-icon">
          <i :class="option.icon"></i>
        </div>
        <div class="option-text">
          <div class="option-title">{{ option.label }}</div>
          <div class="option-subtitle">{{ option.description }}</div>
        </div>
        <div v-if="theme.mode === option.value" class="check-badge">
          <i class="pi pi-check"></i>
        </div>
      </button>
    </div>

    <div class="group-label">{{ t('settings.theme.colorLabel') }}</div>
    <div class="option-list">
      <button
        v-for="option in variantOptions"
        :key="option.value"
        type="button"
        class="option-row"
        :class="{ selected: theme.variant === option.value }"
        @click="theme.setVariant(option.value)"
      >
        <div class="option-icon">
          <span
            class="dot"
            :style="{
              background: option.swatch,
              boxShadow: `0 0 0 5px ${option.swatch}22, 0 0 12px 2px ${option.swatch}55`,
            }"
          ></span>
        </div>
        <div class="option-text">
          <div class="option-title">{{ option.label }}</div>
          <div class="option-subtitle">{{ option.description }}</div>
        </div>
        <div v-if="theme.variant === option.value" class="check-badge">
          <i class="pi pi-check"></i>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 10px 8px 10px;
}

.group-label:first-of-type {
  margin-top: 1.5rem;
}

.option-list {
  background: var(--surface-card);
  border: 1px solid var(--hairline-border);
  border-radius: 18px;
  overflow: hidden;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  margin-bottom: 1.5rem;
}

.option-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
  min-height: 44px;
  border: none;
  border-bottom: 1px solid var(--divider-color);
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  margin: 0;
}

.option-row:last-child {
  border-bottom: none;
}

.option-row.selected {
  background: color-mix(in srgb, var(--p-primary-color) 10%, transparent);
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: color-mix(in srgb, var(--p-primary-color) 16%, transparent);
  color: var(--p-primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.option-icon .dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
}

.option-text {
  flex: 1;
  min-width: 0;
}

.option-title {
  font-size: 16px;
  font-weight: 700;
}

.option-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.check-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--p-primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
}
</style>
