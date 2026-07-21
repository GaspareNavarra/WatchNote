<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNavPreferencesStore } from '../stores/navPreferences'
import { useChatStore } from '../stores/chat'
import { useFriendsStore } from '../stores/friends'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import type { MessageRow } from '../types/database'

const route = useRoute()
const { t } = useI18n({ useScope: 'global' })
const navPreferences = useNavPreferencesStore()
const activeTab = computed(() => route.meta.tab as string | undefined)
const chatStore = useChatStore()
const friendsStore = useFriendsStore()
const auth = useAuthStore()
const notifications = useNotificationsStore()

const items = computed(() => [
  { tab: 'home', to: { name: 'home' }, icon: 'pi pi-home', label: t('nav.home') },
  { tab: 'search', to: { name: 'search' }, icon: 'pi pi-search', label: t('nav.search') },
  { tab: 'chat', to: { name: 'chat' }, icon: 'pi pi-comments', label: t('nav.chat') },
  { tab: 'settings', to: { name: 'settings' }, icon: 'pi pi-cog', label: t('nav.settings') },
])

const SCROLL_THRESHOLD = 6
const TOP_OFFSET = 24

const visible = ref(true)
let lastScrollY = 0

function onScroll() {
  if (!navPreferences.autoHide) return
  const currentY = Math.max(window.scrollY, 0)
  if (currentY <= TOP_OFFSET) {
    visible.value = true
  } else {
    const delta = currentY - lastScrollY
    if (delta > SCROLL_THRESHOLD) visible.value = false
    else if (delta < -SCROLL_THRESHOLD) visible.value = true
  }
  lastScrollY = currentY
}

watch(
  () => route.fullPath,
  () => {
    lastScrollY = window.scrollY
    visible.value = true
  },
)

watch(
  () => navPreferences.autoHide,
  (enabled) => {
    if (!enabled) visible.value = true
  },
)

// This component only exists while logged in (see App.vue's v-if), so onMounted/onUnmounted
// fire exactly once per login session — enough to populate the badge and keep a single
// app-wide realtime subscription alive without waiting for a Chat tab visit.
const hasChatNotification = computed(() => chatStore.hasUnread || friendsStore.incomingRequests.length > 0)

function handleGlobalMessage(message: MessageRow) {
  if (message.sender_id === auth.user?.id) return
  chatStore.fetchConversations()

  // Already looking at that exact conversation — its own subscription already
  // updates the screen and marks it read, a system notification would be redundant.
  const openConversationFriendId = route.name === 'chat-conversation' ? (route.params.friendId as string) : null
  if (openConversationFriendId === message.sender_id) return

  const sender = friendsStore.friends.find((f) => f.id === message.sender_id)
  notifications.notify(sender?.nickname ?? t('chat.notification.fallbackTitle'), message.body)
}

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
  chatStore.fetchConversations()
  friendsStore.fetchFriends()
  friendsStore.fetchIncomingRequests()
  chatStore.subscribeToInbox(handleGlobalMessage)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  chatStore.unsubscribeInbox()
})
</script>

<template>
  <nav class="bottom-nav" :class="{ 'bottom-nav-hidden': !visible }">
    <RouterLink
      v-for="item in items"
      :key="item.tab"
      :to="item.to"
      class="nav-item"
      :class="{ active: activeTab === item.tab }"
    >
      <span class="icon-wrap">
        <i :class="item.icon"></i>
        <span v-if="item.tab === 'chat' && hasChatNotification" class="nav-dot"></span>
      </span>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: calc(1.5rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  transition: transform 0.25s ease, opacity 0.25s ease;
  display: flex;
  align-items: stretch;
  width: min(90vw, 360px);
  padding: 0.55rem 0.5rem;
  border-radius: 999px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px var(--glass-shadow);
  z-index: 50;
}

.bottom-nav-hidden {
  transform: translateX(-50%) translateY(140%);
  opacity: 0;
  pointer-events: none;
}

.nav-item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.35rem 0.25rem;
  border-radius: 999px;
  text-decoration: none;
  color: var(--p-text-muted-color);
  font-size: 0.68rem;
  line-height: 1.2;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.nav-item i {
  font-size: 1.15rem;
  line-height: 1;
}

.nav-item.active {
  color: var(--p-primary-color);
}

.icon-wrap {
  position: relative;
  display: inline-flex;
}

.nav-dot {
  position: absolute;
  top: -2px;
  right: -5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--p-red-500, #ef4444);
  box-shadow: 0 0 0 2px var(--glass-bg);
}
</style>
