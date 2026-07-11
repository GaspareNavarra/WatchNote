<script setup lang="ts">
import SettingsListItem from '../components/SettingsListItem.vue'
</script>

<template>
  <div class="settings">
    <h1>Impostazioni</h1>
    <div class="list">
      <SettingsListItem icon="pi pi-user" label="Account" :to="{ name: 'settings-account' }" />
      <SettingsListItem icon="pi pi-palette" label="Tema" :to="{ name: 'settings-theme' }" />
      <SettingsListItem icon="pi pi-send" label="Richieste" :to="{ name: 'settings-requests' }" />
    </div>
  </div>
</template>

<style scoped>
.settings {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.list {
  margin-top: 0.5rem;
}
</style>
