<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Avatar from 'primevue/avatar'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'
import { useFriendsStore } from '../stores/friends'
import { useChatStore } from '../stores/chat'
import BackButton from '../components/BackButton.vue'

const friendsStore = useFriendsStore()
const chatStore = useChatStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n({ useScope: 'global' })

const query = ref('')
const searchedOnce = ref(false)
const pendingActionId = ref<string | null>(null)

let searchDebounce: ReturnType<typeof setTimeout> | undefined
let searchToken = 0

type RelationshipStatus = 'friends' | 'sent' | 'received' | 'none'

function relationshipStatus(userId: string): RelationshipStatus {
  if (friendsStore.friends.some((f) => f.id === userId)) return 'friends'
  if (friendsStore.outgoingRequests.some((r) => r.profile.id === userId)) return 'sent'
  if (friendsStore.incomingRequests.some((r) => r.profile.id === userId)) return 'received'
  return 'none'
}

onMounted(async () => {
  await Promise.all([
    friendsStore.fetchFriends(),
    friendsStore.fetchIncomingRequests(),
    friendsStore.fetchOutgoingRequests(),
  ])
})

async function runSearch(value: string) {
  const token = ++searchToken
  try {
    await friendsStore.searchUsers(value)
    if (token !== searchToken) return
    searchedOnce.value = true
  } catch (e) {
    if (token !== searchToken) return
    toast.add({
      severity: 'error',
      summary: t('chat.friends.toast.searchError'),
      detail: e instanceof Error ? e.message : t('chat.friends.toast.searchError'),
      life: 5000,
    })
  }
}

function onQueryInput() {
  searchToken++
  if (searchDebounce) clearTimeout(searchDebounce)
  const trimmed = query.value.trim()
  if (!trimmed) {
    friendsStore.searchResults = []
    searchedOnce.value = false
    return
  }
  searchDebounce = setTimeout(() => runSearch(trimmed), 500)
}

async function handleAdd(userId: string) {
  pendingActionId.value = userId
  try {
    await friendsStore.sendFriendRequest(userId)
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('chat.friends.toast.addError'),
      detail: e instanceof Error ? e.message : t('chat.friends.toast.addError'),
      life: 5000,
    })
  } finally {
    pendingActionId.value = null
  }
}

async function handleAccept(requestId: string) {
  pendingActionId.value = requestId
  try {
    await friendsStore.acceptRequest(requestId)
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('chat.friends.toast.acceptError'),
      detail: e instanceof Error ? e.message : t('chat.friends.toast.acceptError'),
      life: 5000,
    })
  } finally {
    pendingActionId.value = null
  }
}

async function handleDecline(requestId: string) {
  pendingActionId.value = requestId
  try {
    await friendsStore.declineRequest(requestId)
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('chat.friends.toast.declineError'),
      detail: e instanceof Error ? e.message : t('chat.friends.toast.declineError'),
      life: 5000,
    })
  } finally {
    pendingActionId.value = null
  }
}

async function handleCancel(requestId: string) {
  pendingActionId.value = requestId
  try {
    await friendsStore.cancelRequest(requestId)
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('chat.friends.toast.cancelError'),
      detail: e instanceof Error ? e.message : t('chat.friends.toast.cancelError'),
      life: 5000,
    })
  } finally {
    pendingActionId.value = null
  }
}

function handleRemove(friendId: string, nickname: string | null) {
  confirm.require({
    message: t('chat.friends.removeConfirm.message', { name: nickname ?? '' }),
    header: t('chat.friends.removeConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('chat.friends.removeConfirm.accept'),
    rejectLabel: t('chat.friends.removeConfirm.reject'),
    acceptProps: { severity: 'danger' },
    accept: async () => {
      try {
        await friendsStore.removeFriend(friendId)
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: t('chat.friends.toast.removeError'),
          detail: e instanceof Error ? e.message : t('chat.friends.toast.removeError'),
          life: 5000,
        })
      }
    },
  })
}

async function openConversation(friendId: string) {
  try {
    await chatStore.getOrCreateConversation(friendId)
    router.push({ name: 'chat-conversation', params: { friendId } })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('chat.friends.toast.openError'),
      detail: e instanceof Error ? e.message : t('chat.friends.toast.openError'),
      life: 5000,
    })
  }
}

const searchButtonLabel = computed(() => (id: string) => {
  const status = relationshipStatus(id)
  if (status === 'friends') return t('chat.friends.alreadyFriends')
  if (status === 'sent') return t('chat.friends.requestSent')
  if (status === 'received') return t('chat.friends.accept')
  return t('chat.friends.add')
})
</script>

<template>
  <div class="page">
    <BackButton :to="{ name: 'chat' }" />
    <h1>{{ t('chat.friends.title') }}</h1>
    <p class="hint">{{ t('chat.friends.subtitle') }}</p>

    <IconField class="search-field">
      <InputIcon class="pi pi-search" />
      <InputText
        v-model="query"
        :placeholder="t('chat.friends.searchPlaceholder')"
        class="search-input"
        @input="onQueryInput"
      />
    </IconField>

    <div v-if="friendsStore.searching" class="loading"><ProgressSpinner style="width: 2rem; height: 2rem" stroke-width="4" /></div>

    <ul v-else-if="query.trim()" class="result-list">
      <li v-if="searchedOnce && friendsStore.searchResults.length === 0" class="empty">
        {{ t('chat.friends.noResults') }}
      </li>
      <li v-for="result in friendsStore.searchResults" :key="result.id" class="result-row">
        <Avatar
          :image="result.avatar_url ?? undefined"
          :icon="!result.avatar_url ? 'pi pi-user' : undefined"
          shape="circle"
          size="normal"
        />
        <div class="result-info">
          <span class="nickname">{{ result.nickname }}</span>
          <span class="code">#{{ result.friend_code }}</span>
        </div>
        <button
          type="button"
          class="action-btn"
          :class="{ 'action-btn-outline': relationshipStatus(result.id) !== 'none' && relationshipStatus(result.id) !== 'received' }"
          :disabled="relationshipStatus(result.id) === 'friends' || relationshipStatus(result.id) === 'sent' || pendingActionId === result.id"
          @click="relationshipStatus(result.id) === 'received' ? handleAccept(friendsStore.incomingRequests.find((r) => r.profile.id === result.id)!.id) : handleAdd(result.id)"
        >
          {{ searchButtonLabel(result.id) }}
        </button>
      </li>
    </ul>

    <template v-else>
      <div v-if="friendsStore.incomingRequests.length > 0" class="section">
        <h3>{{ t('chat.friends.incomingTitle') }}</h3>
        <ul class="request-list">
          <li v-for="req in friendsStore.incomingRequests" :key="req.id" class="request-row">
            <Avatar
              :image="req.profile.avatar_url ?? undefined"
              :icon="!req.profile.avatar_url ? 'pi pi-user' : undefined"
              shape="circle"
              size="normal"
            />
            <span class="nickname">{{ req.profile.nickname }}</span>
            <div class="request-actions">
              <button type="button" class="icon-btn icon-btn-accept" :disabled="pendingActionId === req.id" @click="handleAccept(req.id)">
                <i class="pi pi-check"></i>
              </button>
              <button type="button" class="icon-btn icon-btn-decline" :disabled="pendingActionId === req.id" @click="handleDecline(req.id)">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="friendsStore.outgoingRequests.length > 0" class="section">
        <h3>{{ t('chat.friends.outgoingTitle') }}</h3>
        <ul class="request-list">
          <li v-for="req in friendsStore.outgoingRequests" :key="req.id" class="request-row">
            <Avatar
              :image="req.profile.avatar_url ?? undefined"
              :icon="!req.profile.avatar_url ? 'pi pi-user' : undefined"
              shape="circle"
              size="normal"
            />
            <span class="nickname">{{ req.profile.nickname }}</span>
            <button type="button" class="action-btn action-btn-outline" :disabled="pendingActionId === req.id" @click="handleCancel(req.id)">
              {{ t('chat.friends.cancel') }}
            </button>
          </li>
        </ul>
      </div>

      <div class="section">
        <h3>{{ t('chat.friends.friendsListTitle') }}</h3>
        <p v-if="friendsStore.friends.length === 0" class="empty">{{ t('chat.friends.noFriends') }}</p>
        <ul v-else class="request-list">
          <li v-for="friend in friendsStore.friends" :key="friend.id" class="request-row">
            <button type="button" class="friend-open" @click="openConversation(friend.id)">
              <Avatar
                :image="friend.avatar_url ?? undefined"
                :icon="!friend.avatar_url ? 'pi pi-user' : undefined"
                shape="circle"
                size="normal"
              />
              <span class="nickname">{{ friend.nickname }}</span>
            </button>
            <button type="button" class="icon-btn icon-btn-decline" :aria-label="t('chat.friends.remove')" @click="handleRemove(friend.id, friend.nickname)">
              <i class="pi pi-user-minus"></i>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.hint {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.search-field {
  width: 100%;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

.empty {
  color: var(--text-muted);
  text-align: center;
  padding: 1.5rem 0;
  font-size: 0.9rem;
}

.section {
  margin-bottom: 1.5rem;
}

.section h3 {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 0.6rem;
}

.result-list,
.request-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.result-row,
.request-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--hairline-border);
  border-radius: 16px;
  background: var(--surface-card);
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.request-row .nickname {
  flex: 1;
}

.friend-open {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.request-actions {
  display: flex;
  gap: 0.4rem;
}

.action-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--p-primary-color) 70%, white 30%),
    color-mix(in srgb, var(--p-primary-color) 85%, white 15%)
  );
  color: #140f24;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.action-btn-outline {
  background: var(--surface-chip);
  border: 1px solid var(--hairline-border);
  color: var(--text-secondary);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid var(--hairline-border);
  border-radius: 10px;
  background: var(--surface-chip);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.icon-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.icon-btn-accept {
  color: #16a34a;
}

.icon-btn-accept:hover:not(:disabled) {
  background: color-mix(in srgb, #16a34a 16%, transparent);
}

.icon-btn-decline {
  color: #ef4444;
}

.icon-btn-decline:hover:not(:disabled) {
  background: color-mix(in srgb, #ef4444 16%, transparent);
}
</style>
