import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import type { FriendRequestRow, ProfileRow, ProfileSearchResult } from '../types/database'
import { useAuthStore } from './auth'

export type FriendRequestWithProfile = FriendRequestRow & { profile: ProfileRow }

async function fetchProfilesByIds(ids: string[]): Promise<ProfileRow[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('profiles').select('*').in('id', ids)
  if (error) throw error
  return data ?? []
}

export const useFriendsStore = defineStore('friends', {
  state: () => ({
    friends: [] as ProfileRow[],
    incomingRequests: [] as FriendRequestWithProfile[],
    outgoingRequests: [] as FriendRequestWithProfile[],
    searchResults: [] as ProfileSearchResult[],
    loading: false,
    searching: false,
    error: null as string | null,
  }),
  actions: {
    async fetchFriends() {
      const auth = useAuthStore()
      if (!auth.user) return
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${auth.user.id},receiver_id.eq.${auth.user.id}`)
      if (error) {
        this.error = error.message
        this.loading = false
        return
      }
      const otherIds = (data ?? []).map((r) => (r.sender_id === auth.user!.id ? r.receiver_id : r.sender_id))
      this.friends = await fetchProfilesByIds(otherIds)
      this.loading = false
    },

    async fetchIncomingRequests() {
      const auth = useAuthStore()
      if (!auth.user) return
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('status', 'pending')
        .eq('receiver_id', auth.user.id)
      if (error) {
        this.error = error.message
        return
      }
      const rows = (data ?? []) as FriendRequestRow[]
      const profiles = await fetchProfilesByIds(rows.map((r) => r.sender_id))
      this.incomingRequests = rows.map((r) => ({
        ...r,
        profile: profiles.find((p) => p.id === r.sender_id)!,
      }))
    },

    async fetchOutgoingRequests() {
      const auth = useAuthStore()
      if (!auth.user) return
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('status', 'pending')
        .eq('sender_id', auth.user.id)
      if (error) {
        this.error = error.message
        return
      }
      const rows = (data ?? []) as FriendRequestRow[]
      const profiles = await fetchProfilesByIds(rows.map((r) => r.receiver_id))
      this.outgoingRequests = rows.map((r) => ({
        ...r,
        profile: profiles.find((p) => p.id === r.receiver_id)!,
      }))
    },

    async searchUsers(query: string) {
      const trimmed = query.trim()
      if (!trimmed) {
        this.searchResults = []
        return
      }
      this.searching = true
      const { data, error } = await supabase.rpc('search_profiles', { p_query: trimmed })
      this.searching = false
      if (error) throw error
      this.searchResults = data ?? []
    },

    async sendFriendRequest(targetId: string) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      const meId = auth.user.id
      const { data: existing, error: fetchError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(
          `and(sender_id.eq.${meId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${meId})`,
        )
        .maybeSingle()
      if (fetchError) throw fetchError

      if (!existing) {
        const { error } = await supabase
          .from('friend_requests')
          .insert({ sender_id: meId, receiver_id: targetId, status: 'pending' })
        if (error) throw error
      } else if (existing.status === 'pending' && existing.receiver_id === meId) {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'accepted' })
          .eq('id', existing.id)
        if (error) throw error
      }
      // else: already sent (pending, sender=me) or already accepted — nothing to do

      await Promise.all([this.fetchFriends(), this.fetchIncomingRequests(), this.fetchOutgoingRequests()])
    },

    async acceptRequest(requestId: string) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('receiver_id', auth.user.id)
      if (error) throw error
      await Promise.all([this.fetchFriends(), this.fetchIncomingRequests()])
    },

    async declineRequest(requestId: string) {
      const { error } = await supabase.from('friend_requests').delete().eq('id', requestId)
      if (error) throw error
      this.incomingRequests = this.incomingRequests.filter((r) => r.id !== requestId)
    },

    async cancelRequest(requestId: string) {
      const { error } = await supabase.from('friend_requests').delete().eq('id', requestId)
      if (error) throw error
      this.outgoingRequests = this.outgoingRequests.filter((r) => r.id !== requestId)
    },

    async removeFriend(friendId: string) {
      const auth = useAuthStore()
      if (!auth.user) throw new Error('Not authenticated')
      const meId = auth.user.id
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('status', 'accepted')
        .or(`and(sender_id.eq.${meId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${meId})`)
      if (error) throw error
      this.friends = this.friends.filter((f) => f.id !== friendId)
    },
  },
})
