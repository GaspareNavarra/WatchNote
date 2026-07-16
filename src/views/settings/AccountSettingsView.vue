<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Avatar from 'primevue/avatar'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useAuthStore } from '../../stores/auth'
import { useProfileStore } from '../../stores/profile'
import { useTitlesStore } from '../../stores/titles'
import SettingsListItem from '../../components/SettingsListItem.vue'
import AvatarCropModal from '../../components/AvatarCropModal.vue'
import BackButton from '../../components/BackButton.vue'

const auth = useAuthStore()
const profileStore = useProfileStore()
const titlesStore = useTitlesStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n({ useScope: 'global' })

const fileInput = ref<HTMLInputElement>()
const avatarLoadError = ref(false)
const cropModalVisible = ref(false)
const pendingFile = ref<File | null>(null)

const nickname = ref('')
const bio = ref('')
const saving = ref(false)
const editing = ref(false)

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
const bioDisplay = computed(() => profileStore.profile?.bio || t('settings.account.bioPlaceholder'))

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

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  pendingFile.value = file
  cropModalVisible.value = true
}

async function handleCropConfirm(blob: Blob) {
  cropModalVisible.value = false
  avatarLoadError.value = false
  try {
    await profileStore.uploadAvatar(blob)
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('settings.account.avatarError'),
      detail: e instanceof Error ? e.message : t('settings.account.avatarError'),
      life: 5000,
    })
  } finally {
    pendingFile.value = null
  }
}

function handleCropModalVisibility(visible: boolean) {
  cropModalVisible.value = visible
  if (!visible) pendingFile.value = null
}

async function handleSave() {
  saving.value = true
  try {
    await profileStore.updateProfile({ nickname: nickname.value.trim(), bio: bio.value.trim() })
    toast.add({ severity: 'success', summary: t('settings.account.saveSuccess'), life: 3000 })
    editing.value = false
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

function toggleEdit() {
  editing.value = !editing.value
}

function cancelEdit() {
  nickname.value = profileStore.profile?.nickname ?? ''
  bio.value = profileStore.profile?.bio ?? ''
  editing.value = false
}

function goToSecurity() {
  router.push({ name: 'settings-security' })
}

function handleLogout() {
  confirm.require({
    message: t('settings.session.confirm.message'),
    header: t('settings.session.confirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('settings.session.confirm.accept'),
    rejectLabel: t('settings.session.confirm.reject'),
    acceptProps: { severity: 'danger' },
    accept: async () => {
      await auth.signOut()
      router.push({ name: 'login' })
    },
  })
}
</script>

<template>
  <div class="page">
    <BackButton :to="{ name: 'settings' }" />
    <h1>{{ t('settings.account.title') }}</h1>

    <div class="hero-card">
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

      <div class="identity">
        <div class="nickname-display">{{ profileStore.profile?.nickname || t('settings.account.nicknamePlaceholder') }}</div>
        <p class="email">{{ auth.user?.email }}</p>
        <p class="bio-display">{{ bioDisplay }}</p>
        <button type="button" class="edit-toggle-btn" @click="toggleEdit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
          </svg>
          {{ t('settings.account.editProfile') }}
        </button>
      </div>
    </div>

    <div v-if="editing" class="edit-panel">
      <form class="form" @submit.prevent="handleSave">
        <label class="field">
          <span>{{ t('settings.account.nickname') }}</span>
          <InputText v-model="nickname" :placeholder="t('settings.account.nicknamePlaceholder')" />
        </label>
        <label class="field">
          <span>{{ t('settings.account.bio') }}</span>
          <Textarea v-model="bio" :placeholder="t('settings.account.bioPlaceholder')" rows="3" autoResize />
        </label>
        <div class="edit-actions">
          <Button type="button" :label="t('settings.account.cancel')" severity="secondary" outlined @click="cancelEdit" />
          <Button type="submit" :label="t('settings.account.save')" :loading="saving" :disabled="!isDirty" />
        </div>
      </form>
    </div>

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

    <div class="logout-section">
      <Button
        :label="t('settings.session.logoutButton')"
        icon="pi pi-sign-out"
        severity="danger"
        text
        class="logout-btn"
        @click="handleLogout"
      />
    </div>

    <AvatarCropModal
      :visible="cropModalVisible"
      :file="pendingFile"
      @update:visible="handleCropModalVisibility"
      @confirm="handleCropConfirm"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.page h1 {
  margin-bottom: 1rem;
}

.hero-card {
  position: relative;
  border-radius: 24px;
  padding: 26px 20px 22px;
  margin-bottom: 2rem;
  background: linear-gradient(
    180deg,
    var(--auth-card-from),
    color-mix(in srgb, var(--p-primary-color) 7%, var(--auth-card-to))
  );
  border: 1px solid color-mix(in srgb, var(--p-primary-color) 22%, transparent);
  box-shadow: 0 20px 45px -24px color-mix(in srgb, var(--p-primary-color) 55%, transparent);
  text-align: center;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
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

.identity {
  margin-top: 4px;
}

.nickname-display {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.email {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0.2rem 0 0;
}

.bio-display {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0.6rem 0 0;
  line-height: 1.4;
  padding: 0 0.5rem;
}

.edit-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0.85rem auto 0;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--surface-chip);
  border: 1px solid var(--hairline-border);
  color: var(--p-primary-color);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.edit-toggle-btn:hover {
  background: color-mix(in srgb, var(--p-primary-color) 14%, transparent);
}

.edit-panel {
  border-radius: 20px;
  padding: 1rem;
  margin-bottom: 1.25rem;
  background: var(--surface-card);
  border: 1px solid var(--hairline-border);
}

.edit-actions {
  display: flex;
  gap: 0.6rem;
}

.edit-actions > * {
  flex: 1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  gap: 0.3rem;
  padding: 0.9rem 0.35rem;
  border-radius: 16px;
  background: var(--surface-chip);
  border: 1px solid var(--hairline-border);
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-align: center;
}

.security-link {
  border: 1px solid var(--p-content-border-color);
  border-radius: 20px;
  overflow: hidden;
}

.logout-section {
  border: 1px solid var(--p-content-border-color);
  border-radius: 20px;
  padding: 4px;
  margin-top: 1rem;
}

.logout-btn {
  width: 100%;
  justify-content: center;
  padding: 13px 16px;
  font-weight: 600;
  border-radius: 16px;
  background: transparent;
  transition: background-color 0.15s ease;
}

.logout-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--p-red-500, #ef4444) 12%, transparent);
}

.logout-btn:active:not(:disabled) {
  background: color-mix(in srgb, var(--p-red-500, #ef4444) 20%, transparent);
}
</style>
