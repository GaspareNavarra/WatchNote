<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import ToggleSwitch from 'primevue/toggleswitch'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'
import SettingsListItem from '../components/SettingsListItem.vue'
import { useFeatureRequestsStore } from '../stores/featureRequests'
import { useNotificationsStore } from '../stores/notifications'
import { useLocaleStore } from '../stores/locale'
import { getAppVersion } from '../lib/appInfo'
import type { AppLocale } from '../i18n'

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const toast = useToast()

const featureRequests = useFeatureRequestsStore()
const notifications = useNotificationsStore()
const locale = useLocaleStore()

const appVersion = ref('')
const languageDialogVisible = ref(false)

const languageOptions: { value: AppLocale; label: string }[] = [
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
]

const currentLanguageLabel = computed(
  () => languageOptions.find((o) => o.value === locale.locale)?.label ?? 'Italiano'
)

onMounted(async () => {
  if (featureRequests.requests.length === 0) {
    featureRequests.fetchRequests()
  }
  if (!notifications.ready) {
    await notifications.init()
  }
  appVersion.value = await getAppVersion()
})

function goToAccount() {
  router.push({ name: 'settings-account' })
}

function goToTheme() {
  router.push({ name: 'settings-theme' })
}

function goToRequests() {
  router.push({ name: 'settings-requests' })
}

async function handleNotificationsToggle(value: boolean) {
  try {
    await notifications.setEnabled(value)
  } catch {
    toast.add({
      severity: 'warn',
      summary: t('settings.notifications.title'),
      detail: t('settings.notifications.permissionDenied'),
      life: 4000,
    })
  }
}

function openLanguageDialog() {
  languageDialogVisible.value = true
}

async function selectLanguage(value: AppLocale) {
  await locale.setLocale(value)
  languageDialogVisible.value = false
}
</script>

<template>
  <div class="settings-screen">
    <header class="header">
      <h1>{{ t('settings.title') }}</h1>
      <p>{{ t('settings.subtitle') }}</p>
    </header>

    <div class="content">
      <div class="group-label">{{ t('settings.groups.general') }}</div>
      <div class="card">
        <SettingsListItem
          :title="t('settings.account.title')"
          :subtitle="t('settings.account.subtitle')"
          @click="goToAccount"
        >
          <template #icon>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a892f2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </template>
        </SettingsListItem>

        <SettingsListItem
          :title="t('settings.theme.title')"
          :subtitle="t('settings.theme.subtitle')"
          @click="goToTheme"
        >
          <template #icon>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a892f2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="13.5" cy="6.5" r=".5" fill="#a892f2"></circle>
              <circle cx="17.5" cy="10.5" r=".5" fill="#a892f2"></circle>
              <circle cx="8.5" cy="7.5" r=".5" fill="#a892f2"></circle>
              <circle cx="6.5" cy="12.5" r=".5" fill="#a892f2"></circle>
              <path
                d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"
              ></path>
            </svg>
          </template>
        </SettingsListItem>

        <SettingsListItem
          :title="t('settings.requests.title')"
          :subtitle="t('settings.requests.subtitle')"
          @click="goToRequests"
        >
          <template #icon>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a892f2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </template>
          <template #trailing>
            <Badge v-if="featureRequests.pendingCount > 0" :value="featureRequests.pendingCount" class="requests-badge" />
            <svg
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
          </template>
        </SettingsListItem>
      </div>

      <div class="group-label">{{ t('settings.groups.preferences') }}</div>
      <div class="card">
        <SettingsListItem
          :title="t('settings.notifications.title')"
          :subtitle="t('settings.notifications.subtitle')"
          :clickable="false"
        >
          <template #icon>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a892f2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </template>
          <template #trailing>
            <ToggleSwitch
              :model-value="notifications.enabled"
              class="notif-switch"
              :aria-label="t('settings.notifications.title')"
              @update:model-value="handleNotificationsToggle"
            />
          </template>
        </SettingsListItem>

        <SettingsListItem
          :title="t('settings.language.title')"
          :subtitle="currentLanguageLabel"
          :aria-label="t('settings.language.title')"
          @click="openLanguageDialog"
        >
          <template #icon>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a892f2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 12h20"></path>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </template>
        </SettingsListItem>
      </div>

      <p class="version">{{ t('settings.version', { version: appVersion }) }}</p>
    </div>

    <Dialog
      v-model:visible="languageDialogVisible"
      modal
      :header="t('settings.language.dialogTitle')"
      class="language-dialog"
      :style="{ width: '20rem', maxWidth: '92vw' }"
    >
      <div class="language-options">
        <button
          v-for="option in languageOptions"
          :key="option.value"
          type="button"
          class="language-option"
          :class="{ active: locale.locale === option.value }"
          @click="selectLanguage(option.value)"
        >
          <span>{{ option.label }}</span>
          <svg
            v-if="locale.locale === option.value"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a892f2"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.settings-screen {
  min-height: 100%;
  font-family: 'Inter', system-ui, sans-serif;
  color: #ffffff;
  background: radial-gradient(120% 80% at 15% 0%, #1c1830 0%, #131022 45%, #0a0810 100%);
}

.header {
  padding: calc(26px + env(safe-area-inset-top)) 22px 18px;
}

.header h1 {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.header p {
  font-size: 14px;
  color: #8f88a8;
  margin: 4px 0 0;
}

.content {
  max-width: 480px;
  margin: 0 auto;
  padding: 6px 16px 16px;
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6f6890;
  margin: 10px 8px 10px;
}

.group-label:not(:first-child) {
  margin-top: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.version {
  text-align: center;
  font-size: 12px;
  color: #4f4a68;
  margin: 26px 0 8px;
}

.requests-badge {
  background: rgba(155, 127, 230, 0.18);
  color: #cbb9ff;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 9px;
  min-width: auto;
  height: auto;
  border-radius: 999px;
}

.notif-switch :deep(.p-toggleswitch-slider) {
  background: rgba(255, 255, 255, 0.12);
}

.notif-switch.p-toggleswitch-checked :deep(.p-toggleswitch-slider) {
  background: #8b6fe0;
}

.notif-switch :deep(.p-toggleswitch-handle) {
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.language-dialog {
  font-family: 'Inter', system-ui, sans-serif;
}

.language-dialog :deep(.p-dialog) {
  background: #16131f;
}

.language-dialog:deep(.p-dialog-header),
.language-dialog :deep(.p-dialog-content) {
  background: #16131f;
  color: #ffffff;
}

.language-dialog :deep(.p-dialog-title) {
  color: #ffffff;
}

.language-options {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.language-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  padding: 0.7rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  color: #ffffff;
  font-family: inherit;
  font-size: 15px;
  cursor: pointer;
}

.language-option.active {
  border-color: rgba(168, 146, 242, 0.5);
  background: rgba(155, 127, 230, 0.14);
}
</style>
