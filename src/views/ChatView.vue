<script setup lang="ts">
import { computed, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import { isConversationUnread, useChatStore } from '../stores/chat'
import { useFriendsStore } from '../stores/friends'
import { useAuthStore } from '../stores/auth'
import type { ConversationRow, MessageRow, ProfileRow } from '../types/database'

defineOptions({ name: 'ChatView' })

type ChatEntry = {
  id?: string
  friendProfile: ProfileRow
  lastMessage: MessageRow | null
  last_message_at?: string
  user_a?: string
  user_b?: string
  user_a_last_read_at?: string | null
  user_b_last_read_at?: string | null
}

const chatStore = useChatStore()
const friendsStore = useFriendsStore()
const auth = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

const pendingCount = computed(() => friendsStore.incomingRequests.length)

// Every friend gets a chat entry, even before any message has been sent —
// friends without a conversation yet are appended (alphabetically) after the
// real conversations, which stay sorted by most recent activity.
const displayList = computed<ChatEntry[]>(() => {
  const withConversation = new Set(chatStore.conversations.map((c) => c.friendProfile.id))
  const friendsWithoutConversation: ChatEntry[] = friendsStore.friends
    .filter((f) => !withConversation.has(f.id))
    .sort((a, b) => (a.nickname ?? '').localeCompare(b.nickname ?? ''))
    .map((f) => ({ friendProfile: f, lastMessage: null }))
  return [...chatStore.conversations, ...friendsWithoutConversation]
})

// onActivated also fires on the initial mount for KeepAlive'd components, so this
// alone covers both the first visit and every time you come back to this tab —
// needed because KeepAlive means onMounted never runs again on its own.
onActivated(async () => {
  await Promise.all([chatStore.fetchConversations(), friendsStore.fetchFriends(), friendsStore.fetchIncomingRequests()])
})

function openFriends() {
  router.push({ name: 'chat-friends' })
}

function openConversation(friendId: string) {
  router.push({ name: 'chat-conversation', params: { friendId } })
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  return isToday
    ? date.toLocaleTimeString(locale.value === 'it' ? 'it-IT' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(locale.value === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short' })
}

function lastMessagePreview(conversation: ChatEntry) {
  if (conversation.id === undefined) return t('chat.inbox.startChat')
  if (!conversation.lastMessage) return t('chat.inbox.noMessages')
  const prefix = conversation.lastMessage.sender_id === auth.user?.id ? t('chat.inbox.youPrefix') : ''
  return `${prefix}${conversation.lastMessage.body}`
}

function isUnread(conversation: ChatEntry): boolean {
  if (!conversation.id || !auth.user) return false
  return isConversationUnread(conversation as unknown as ConversationRow & { lastMessage: MessageRow | null }, auth.user.id)
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>{{ t('chat.title') }}</h1>
      <button type="button" class="friends-btn" :aria-label="t('chat.friendsButton')" @click="openFriends">
        <i class="pi pi-users"></i>
        <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
      </button>
    </div>

    <div v-if="chatStore.loading" class="loading"><ProgressSpinner style="width: 2.5rem; height: 2.5rem" /></div>

    <div v-else-if="displayList.length === 0" class="empty-state">
      <i class="pi pi-comments empty-icon"></i>
      <p>{{ t('chat.inbox.empty') }}</p>
      <button type="button" class="cta-btn" @click="openFriends">{{ t('chat.inbox.emptyCta') }}</button>
    </div>

    <ul v-else class="conversation-list">
      <li v-for="conversation in displayList" :key="conversation.friendProfile.id">
        <button
          type="button"
          class="conversation-row"
          :class="{ unread: isUnread(conversation) }"
          @click="openConversation(conversation.friendProfile.id)"
        >
          <Avatar
            :image="conversation.friendProfile.avatar_url ?? undefined"
            :icon="!conversation.friendProfile.avatar_url ? 'pi pi-user' : undefined"
            shape="circle"
            size="large"
            class="avatar"
          />
          <div class="conversation-info">
            <span class="nickname">{{ conversation.friendProfile.nickname }}</span>
            <span class="preview" :class="{ unread: isUnread(conversation) }">{{ lastMessagePreview(conversation) }}</span>
          </div>
          <div class="meta-col">
            <span class="time" :class="{ unread: isUnread(conversation) }">{{ formatTime(conversation.last_message_at) }}</span>
            <span v-if="isUnread(conversation)" class="unread-dot"></span>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 1.25rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.page-header h1 {
  margin: 0;
}

.friends-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--hairline-border);
  border-radius: 13px;
  background: var(--surface-chip);
  color: var(--text-primary);
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.friends-btn:hover {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--p-red-500, #ef4444);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 2.25rem;
  color: var(--text-muted);
}

.cta-btn {
  margin-top: 0.25rem;
  padding: 10px 20px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--p-primary-color) 70%, white 30%),
    color-mix(in srgb, var(--p-primary-color) 85%, white 15%)
  );
  color: #140f24;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.conversation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.conversation-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--hairline-border);
  border-radius: 18px;
  background: var(--surface-card);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.conversation-row:hover {
  background: color-mix(in srgb, var(--p-primary-color) 8%, var(--surface-card));
}

.conversation-row.unread {
  border-color: color-mix(in srgb, var(--p-primary-color) 65%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--p-primary-color) 55%, transparent),
    0 0 12px 2px color-mix(in srgb, var(--p-primary-color) 35%, transparent);
}

.conversation-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.nickname {
  font-weight: 700;
  color: var(--text-primary);
}

.preview {
  font-size: 0.85rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview.unread {
  color: var(--text-primary);
  font-weight: 600;
}

.meta-col {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.time.unread {
  color: var(--p-primary-color);
  font-weight: 700;
}

.unread-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--p-primary-color);
}
</style>
