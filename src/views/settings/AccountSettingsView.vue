<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Avatar from 'primevue/avatar'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'
import { useTitlesStore } from '../../stores/titles'
import SettingsListItem from '../../components/SettingsListItem.vue'

const auth = useAuthStore()
const profileStore = useProfileStore()
const titlesStore = useTitlesStore()
const router = useRouter()
const toast = useToast()
const { t } = useI18n({ useScope: 'global' })

const fileInput = ref<HTMLInputElement>()
const avatarLoadError = ref(false)

const nickname = ref('')
const bio = ref('')
const saving = ref(false)

const isDirty = computed(
  () =>
    nickname.value !== (profileStore.profile?.nickname ?? '') ||
    bio.value !== (profileStore.profile?.bio ?? '')
)

watch(
  () => profileStore.profile,
  (profile) => {
    nickname.value = profile?.nickname ?? ''
    bio.value = profile?.bio ?? ''
  },
  { immediate: true }
)

const avatarUrl = computed(() => (avatarLoadError.value ? null : profileStore.profile?.avatar_url ?? null))

const stats = computed(() => {
  const titles = titlesStore.titles
  const episodesWatched = Object.values(titlesStore.episodesByTitle).reduce(
    (sum, episodes) => sum + episodes.filter((e) => e.watched).length,
    0
  )
  return {
    total: titles.length,
    watching: titlesStore.byStatus('watching').length,
    planned: titlesStore.byStatus('plan_to_watch').length,
    watched: titlesStore.byStatus('completed').length,
    dropped: titlesStore.byStatus('dropped').length,
    episodesWatched,
  }
})

onMounted(async () => {
  if (!profileStore.profile) await profileStore.fetchProfile()
  if (titlesStore.titles.length === 0) await titlesStore.fetchTitles()
  await titlesStore.fetchAllEpisodes()
})

function triggerFileSelect() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  avatarLoadError.value = false
  try {
    await profileStore.uploadAvatar(file)
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('settings.account.avatarError'),
      detail: e instanceof Error ? e.message : t('settings.account.avatarError'),
      life: 5000,
    })
  }
}

async function handleSave() {
  saving.value = true
  try {
    await profileStore.updateProfile({ nickname: nickname.value.trim(), bio: bio.value.trim() })
    toast.add({ severity: 'success', summary: t('settings.account.saveSuccess'), life: 3000 })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('settings.account.saveError'),
      detail: e instanceof Error ? e.message : t('settings.account.saveError'),
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}

function goToSecurity() {
  router.push({ name: 'settings-security' })
}
</script>

<template>
  <div class="page">
    <RouterLink :to="{ name: 'settings' }" class="back">← {{ t('settings.title') }}</RouterLink>
    <h1>{{ t('settings.account.title') }}</h1>
    <p class="email">{{ auth.user?.email }}</p>

    <div class="avatar-section">
      <button
        type="button"
        class="avatar-wrap"
        :disabled="profileStore.uploading"
        :aria-label="t('settings.account.avatarChange')"
        @click="triggerFileSelect"
      >
        <Avatar
          :image="avatarUrl ?? undefined"
          :icon="!avatarUrl ? 'pi pi-user' : undefined"
          shape="circle"
          size="xlarge"
          class="avatar"
          @error="avatarLoadError = true"
        />
        <div v-if="profileStore.uploading" class="avatar-overlay">
          <ProgressSpinner style="width: 1.75rem; height: 1.75rem" stroke-width="4" />
        </div>
        <span class="avatar-edit">
          <i class="pi pi-camera"></i>
        </span>
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="handleFileChange" />
      <button type="button" class="avatar-change-label" @click="triggerFileSelect">
        {{ t('settings.account.avatarChange') }}
      </button>
    </div>

    <form class="form" @submit.prevent="handleSave">
      <label class="field">
        <span>{{ t('settings.account.nickname') }}</span>
        <InputText v-model="nickname" :placeholder="t('settings.account.nicknamePlaceholder')" />
      </label>
      <label class="field">
        <span>{{ t('settings.account.bio') }}</span>
        <Textarea v-model="bio" :placeholder="t('settings.account.bioPlaceholder')" rows="3" autoResize />
      </label>
      <Button type="submit" :label="t('settings.account.save')" :loading="saving" :disabled="!isDirty" />
    </form>

    <h3 class="stats-title">{{ t('settings.account.stats.title') }}</h3>
    <div class="stats-grid">
      <div class="stat-cell">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">{{ t('settings.account.stats.totalTitles') }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-value">{{ stats.watched }}</span>
        <span class="stat-label">{{ t('settings.account.stats.watched') }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-value">{{ stats.watching }}</span>
        <span class="stat-label">{{ t('settings.account.stats.watching') }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-value">{{ stats.planned }}</span>
        <span class="stat-label">{{ t('settings.account.stats.planned') }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-value">{{ stats.dropped }}</span>
        <span class="stat-label">{{ t('settings.account.stats.dropped') }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-value">{{ stats.episodesWatched }}</span>
        <span class="stat-label">{{ t('settings.account.stats.episodesWatched') }}</span>
      </div>
    </div>

    <div class="security-link">
      <SettingsListItem
        :title="t('settings.security.title')"
        :subtitle="t('settings.security.subtitle')"
        @click="goToSecurity"
      >
        <template #icon>
          <i class="pi pi-lock"></i>
        </template>
      </SettingsListItem>
    </div>
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

.email {
  color: var(--p-text-muted-color);
  margin-bottom: 1.5rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
}

.avatar-wrap:disabled {
  cursor: default;
}

.avatar-wrap :deep(.avatar) {
  width: 96px;
  height: 96px;
  font-size: 2.5rem;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
}

.avatar-edit {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--p-content-background, #fff);
  background: var(--p-primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.avatar-change-label {
  border: none;
  background: none;
  color: var(--p-primary-color);
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
}

.field :deep(input) {
  width: 100%;
}

.stats-title {
  font-size: 0.95rem;
  margin-bottom: 0.6rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.75rem 0.25rem;
  border-radius: 12px;
  border: 1px solid var(--p-content-border-color);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 0.68rem;
  color: var(--p-text-muted-color);
  text-align: center;
}

.security-link {
  border: 1px solid var(--p-content-border-color);
  border-radius: 20px;
  overflow: hidden;
}
</style>
