import { defineStore } from 'pinia'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { ConversationRow, MessageRow, ProfileRow } from '../types/database'
import { useAuthStore } from './auth'

export type ConversationWithFriend = ConversationRow & {
  friendProfile: ProfileRow
  lastMessage: MessageRow | null
}

function otherUserId(conversation: ConversationRow, meId: string) {
  return conversation.user_a === meId ? conversation.user_b : conversation.user_a
}

// Kept outside reactive Pinia state on purpose: Vue's UnwrapRef would strip the
// RealtimeChannel class instance down to a structural type, breaking supabase.removeChannel().
let activeChannel: RealtimeChannel | null = null

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [] as ConversationWithFriend[],
    messagesByConversation: {} as Record<string, MessageRow[]>,
    loading: false,
    sending: false,
    error: null as string | null,
  }),
  actions: {
    async fetchConversations() {
      const auth = useAuthStore()
      if (!auth.user) return
      const meId = auth.user.id
      this.loading = true
      this.error = null

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_a.eq.${meId},user_b.eq.${meId}`)
      if (error) {
        this.error = error.message
        this.loading = false
        return
      }
      const rows = (conversations ?? []) as ConversationRow[]
      if (rows.length === 0) {
        this.conversations = []
        this.loading = false
        return
      }

      const friendIds = rows.map((c) => otherUserId(c, meId))
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds)
      if (profilesError) {
        this.error = profilesError.message
        this.loading = false
        return
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .in(
          'conversation_id',
          rows.map((c) => c.id),
        )
        .order('created_at', { ascending: false })
      if (messagesError) {
        this.error = messagesError.message
        this.loading = false
        return
      }

      const lastMessageByConversation = new Map<string, MessageRow>()
      for (const m of messages ?? []) {
        if (!lastMessageByConversation.has(m.conversation_id)) {
          lastMessageByConversation.set(m.conversation_id, m)
        }
      }

      this.conversations = rows
        .map((c) => ({
          ...c,
          friendProfile: (profiles ?? []).find((p) => p.id === otherUserId(c, meId))!,
          lastMessage: lastMessageByConversation.get(c.id) ?? null,
        }))
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      this.loading = false
    },

    async getOrCreateConversation(friendId: string): Promise<ConversationRow> {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      const meId = auth.user.id

      const { data: existing, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user_a.eq.${meId},user_b.eq.${friendId}),and(user_a.eq.${friendId},user_b.eq.${meId})`)
        .maybeSingle()
      if (error) throw error
      if (existing) return existing

      const { data: created, error: insertError } = await supabase
        .from('conversations')
        .insert({ user_a: meId, user_b: friendId })
        .select()
        .single()
      if (insertError) throw insertError
      return created
    },

    async fetchMessages(conversationId: string) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (error) throw error
      this.messagesByConversation[conversationId] = data ?? []
      return data ?? []
    },

    async sendMessage(conversationId: string, body: string) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      const trimmed = body.trim()
      if (!trimmed) return
      this.sending = true
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: auth.user.id, body: trimmed })
        .select()
        .single()
      this.sending = false
      if (error) throw error
      const existing = this.messagesByConversation[conversationId] ?? []
      if (!existing.some((m) => m.id === data.id)) {
        this.messagesByConversation[conversationId] = [...existing, data]
      }
      return data
    },

    subscribeToConversation(conversationId: string, onInsert: (message: MessageRow) => void) {
      activeChannel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload) => onInsert(payload.new as MessageRow),
        )
        .subscribe()
      return activeChannel
    },

    unsubscribe() {
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
        activeChannel = null
      }
    },
  },
})
