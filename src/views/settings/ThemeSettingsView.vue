<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import SelectButton from 'primevue/selectbutton'
import { useThemeStore, type ThemeVariant } from '../../stores/theme'

const theme = useThemeStore()
const { t } = useI18n({ useScope: 'global' })

const modeOptions = computed(() => [
  { value: 'light', label: t('settings.theme.modes.light'), icon: 'pi pi-sun' },
  { value: 'dark', label: t('settings.theme.modes.dark'), icon: 'pi pi-moon' },
])

const variantOptions = computed<{ value: ThemeVariant; label: string; swatch: string }[]>(() => [
  { value: 'primary', label: t('settings.theme.variants.primary'), swatch: '#10b981' },
  { value: 'secondary', label: t('settings.theme.variants.secondary'), swatch: '#00478f' },
  { value: 'nebula', label: t('settings.theme.variants.nebula'), swatch: '#7c3aed' },
])
</script>

<template>
  <div class="page">
    <RouterLink :to="{ name: 'settings' }" class="back">← {{ t('settings.title') }}</RouterLink>
    <h1>{{ t('settings.theme.title') }}</h1>

    <Card class="theme-card">
      <template #content>
        <section class="section">
          <h3>{{ t('settings.theme.modeLabel') }}</h3>
          <SelectButton
            :model-value="theme.mode"
            :options="modeOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            @update:model-value="theme.setMode"
          >
            <template #option="{ option }">
              <i :class="option.icon"></i>
              <span>{{ option.label }}</span>
            </template>
          </SelectButton>
        </section>

        <section class="section">
          <h3>{{ t('settings.theme.colorLabel') }}</h3>
          <SelectButton
            :model-value="theme.variant"
            :options="variantOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            class="variant-select"
            @update:model-value="theme.setVariant"
          >
            <template #option="{ option }">
              <span class="swatch" :style="{ background: option.swatch }"></span>
              <span>{{ option.label }}</span>
            </template>
          </SelectButton>
        </section>
      </template>
    </Card>
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

.theme-card {
  border-radius: 14px;
}

.section {
  margin-bottom: 1.5rem;
}

.section:last-child {
  margin-bottom: 0;
}

h3 {
  font-size: 0.95rem;
  margin-bottom: 0.6rem;
}

.swatch {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.4rem;
  border: 1px solid var(--p-content-border-color);
}

.variant-select {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.5rem;
  width: 100%;
}

.variant-select :deep(.p-togglebutton) {
  border-radius: 999px;
  justify-content: center;
}
</style>
