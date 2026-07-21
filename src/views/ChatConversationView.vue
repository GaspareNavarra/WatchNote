<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import { useChatStore } from '../stores/chat'
import { useFriendsStore } from '../stores/friends'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import type { ConversationRow, MessageRow, ProfileRow } from '../types/database'

const props = defineProps<{ friendId: string }>()

const chatStore = useChatStore()
const friendsStore = useFriendsStore()
const auth = useAuthStore()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

const loading = ref(true)
const loadingOlder = ref(false)
const sending = ref(false)
const messageInput = ref('')
const conversationId = ref<string | null>(null)
const conversation = ref<ConversationRow | null>(null)
const friendProfile = ref<ProfileRow | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const isNearBottom = ref(true)
const messageInputEl = ref<HTMLInputElement | null>(null)
const emojiPickerEl = ref<HTMLElement | null>(null)
const emojiPickerOpen = ref(false)

const EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '😘', '😉', '😎', '🤔', '😅',
  '😭', '😢', '😡', '🥳', '😴', '🙄', '😱', '🤗', '😇', '🥰',
  '👍', '👎', '👏', '🙏', '💪', '🤝', '👋', '✌️', '🤞', '👌',
  '❤️', '💔', '💕', '🔥', '✨', '🎉', '🎂', '🍕', '☕', '🍺',
]

const messages = computed(() => (conversationId.value ? chatStore.messagesByConversation[conversationId.value] ?? [] : []))
const hasMore = computed(() => (conversationId.value ? chatStore.hasMoreByConversation[conversationId.value] ?? false : false))

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleInsert(message: MessageRow) {
  if (!conversationId.value) return
  const existing = chatStore.messagesByConversation[conversationId.value] ?? []
  if (existing.some((m) => m.id === message.id)) return
  chatStore.messagesByConversation[conversationId.value] = [...existing, message]
  if (message.sender_id !== auth.user?.id && conversation.value) {
    chatStore.markConversationRead(conversation.value)
  }
}

watch(
  () => messages.value.length,
  () => {
    if (isNearBottom.value) scrollToBottom()
  },
)

async function onMessagesScroll() {
  const el = messagesContainer.value
  if (!el || !conversationId.value) return
  isNearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80

  if (el.scrollTop > 60 || loadingOlder.value || !hasMore.value) return
  loadingOlder.value = true
  const prevHeight = el.scrollHeight
  const prevScrollTop = el.scrollTop
  try {
    await chatStore.fetchOlderMessages(conversationId.value)
    await nextTick()
    el.scrollTop = prevScrollTop + (el.scrollHeight - prevHeight)
  } finally {
    loadingOlder.value = false
  }
}

onMounted(async () => {
  const cached = friendsStore.friends.find((f) => f.id === props.friendId)
  if (cached) {
    friendProfile.value = cached
  } else {
    const { data } = await supabase.from('profiles').select('*').eq('id', props.friendId).maybeSingle()
    friendProfile.value = data
  }

  const created = await chatStore.getOrCreateConversation(props.friendId)
  conversation.value = created
  conversationId.value = created.id
  await chatStore.fetchMessages(created.id)
  chatStore.subscribeToConversation(created.id, handleInsert)
  chatStore.markConversationRead(created)
  loading.value = false
  scrollToBottom()
  document.addEventListener('click', handleClickOutsideEmojiPicker)
})

onUnmounted(() => {
  chatStore.unsubscribe()
  document.removeEventListener('click', handleClickOutsideEmojiPicker)
})

async function handleSend() {
  const body = messageInput.value.trim()
  if (!body || !conversationId.value || sending.value) return
  sending.value = true
  try {
    await chatStore.sendMessage(conversationId.value, body)
    messageInput.value = ''
  } finally {
    sending.value = false
  }
}

function toggleEmojiPicker() {
  emojiPickerOpen.value = !emojiPickerOpen.value
}

function insertEmoji(emoji: string) {
  const el = messageInputEl.value
  const start = el?.selectionStart ?? messageInput.value.length
  const end = el?.selectionEnd ?? messageInput.value.length
  messageInput.value = messageInput.value.slice(0, start) + emoji + messageInput.value.slice(end)
  nextTick(() => {
    el?.focus()
    const caret = start + emoji.length
    el?.setSelectionRange(caret, caret)
  })
}

function handleClickOutsideEmojiPicker(event: MouseEvent) {
  if (!emojiPickerOpen.value) return
  if (emojiPickerEl.value && !emojiPickerEl.value.contains(event.target as Node)) {
    emojiPickerOpen.value = false
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(locale.value === 'it' ? 'it-IT' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="conversation-page">
    <div class="header">
      <button type="button" class="back" :aria-label="t('common.back')" @click="router.back()">
        <i class="pi pi-arrow-left"></i>
      </button>
      <Avatar
        :image="friendProfile?.avatar_url ?? undefined"
        :icon="!friendProfile?.avatar_url ? 'pi pi-user' : undefined"
        shape="circle"
        size="normal"
      />
      <span class="friend-name">{{ friendProfile?.nickname }}</span>
    </div>

    <div v-if="loading" class="loading"><ProgressSpinner style="width: 2.5rem; height: 2.5rem" /></div>

    <template v-else>
      <div ref="messagesContainer" class="messages" @scroll="onMessagesScroll">
        <div v-if="loadingOlder" class="loading-older">
          <ProgressSpinner style="width: 1.5rem; height: 1.5rem" stroke-width="4" />
        </div>
        <p v-if="messages.length === 0" class="empty">{{ t('chat.conversation.empty') }}</p>
        <div
          v-for="message in messages"
          :key="message.id"
          class="bubble-row"
          :class="{ 'bubble-row-own': message.sender_id === auth.user?.id }"
        >
          <div class="bubble">
            <span class="body">{{ message.body }}</span>
            <span class="time">{{ formatTime(message.created_at) }}</span>
          </div>
        </div>
      </div>

      <form class="input-row" @submit.prevent="handleSend">
        <div ref="emojiPickerEl" class="emoji-wrap">
          <div v-if="emojiPickerOpen" class="emoji-panel">
            <div class="emoji-grid">
              <button
                v-for="emoji in EMOJIS"
                :key="emoji"
                type="button"
                class="emoji-option"
                @click="insertEmoji(emoji)"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
          <button
            type="button"
            class="emoji-btn"
            :aria-label="t('chat.conversation.emoji')"
            @click="toggleEmojiPicker"
          >
            <i class="pi pi-face-smile"></i>
          </button>
        </div>
        <input
          ref="messageInputEl"
          v-model="messageInput"
          type="text"
          class="message-input"
          :placeholder="t('chat.conversation.placeholder')"
          autocomplete="off"
        />
        <button type="submit" class="send-btn" :disabled="!messageInput.trim() || sending" :aria-label="t('chat.conversation.send')">
          <i class="pi pi-send"></i>
        </button>
      </form>
    </template>
  </div>
</template>

<style scoped>
.conversation-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 112px - env(safe-area-inset-bottom));
  max-width: 720px;
  margin: 0 auto;
  padding: 1.25rem;
}

.header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  margin-bottom: 1rem;
}

.back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border: 1px solid var(--hairline-border);
  border-radius: 13px;
  background: var(--surface-chip);
  color: var(--text-primary);
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.back:hover {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
}

.friend-name {
  font-weight: 700;
  color: var(--text-primary);
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}

.empty {
  margin: auto;
  color: var(--text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.loading-older {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
  flex-shrink: 0;
}

.bubble-row {
  display: flex;
  justify-content: flex-start;
}

.bubble-row-own {
  justify-content: flex-end;
}

.bubble {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.55rem 0.75rem;
  border-radius: 16px;
  background: var(--surface-chip);
  border: 1px solid var(--hairline-border);
}

.bubble-row-own .bubble {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--p-primary-color) 70%, white 30%),
    color-mix(in srgb, var(--p-primary-color) 85%, white 15%)
  );
  border: none;
  color: #140f24;
}

.bubble .body {
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-row-own .bubble .body {
  color: #140f24;
}

.bubble .time {
  align-self: flex-end;
  font-size: 0.68rem;
  color: var(--text-muted);
}

.bubble-row-own .bubble .time {
  color: rgba(20, 15, 36, 0.6);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding-top: 0.75rem;
}

.emoji-wrap {
  position: relative;
  flex-shrink: 0;
}

.emoji-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--hairline-border);
  border-radius: 50%;
  background: var(--surface-chip);
  color: var(--text-primary);
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.emoji-btn:hover {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
}

.emoji-panel {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  width: 240px;
  padding: 0.6rem;
  border-radius: 18px;
  border: 1px solid var(--hairline-border);
  background: var(--surface-card);
  box-shadow: 0 8px 24px var(--glass-shadow);
  z-index: 10;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.2rem;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  mask-image: linear-gradient(to bottom, black calc(100% - 20px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 20px), transparent 100%);
}

.emoji-grid::-webkit-scrollbar {
  display: none;
}

.emoji-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 1.3rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.emoji-option:hover {
  background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
}

.message-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--hairline-border);
  background: var(--surface-chip);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: var(--p-primary-color);
}

.send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--p-primary-color) 70%, white 30%),
    color-mix(in srgb, var(--p-primary-color) 85%, white 15%)
  );
  color: #140f24;
  font-size: 16px;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
