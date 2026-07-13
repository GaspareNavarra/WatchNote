<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    clickable?: boolean
    showChevron?: boolean
    ariaLabel?: string
  }>(),
  {
    clickable: true,
    showChevron: true,
  }
)
</script>

<template>
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : undefined"
    class="settings-row"
    :class="{ clickable }"
    :aria-label="ariaLabel ?? title"
  >
    <div class="icon-box"><slot name="icon" /></div>
    <div class="text">
      <div class="title">{{ title }}</div>
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
    </div>
    <div class="trailing">
      <slot name="trailing">
        <svg
          v-if="showChevron"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5f597a"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </slot>
    </div>
  </component>
</template>

<style scoped>
.settings-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
  min-height: 44px;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  margin: 0;
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row.clickable {
  cursor: pointer;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--p-primary-color) 14%, transparent);
  color: var(--p-primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.text {
  flex: 1;
  min-width: 0;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.subtitle {
  font-size: 13px;
  color: #8f88a8;
  margin-top: 2px;
}

.trailing {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
</style>
