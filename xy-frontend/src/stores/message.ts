import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getMessageHome, markConversationRead, postChatMessage } from '@/services/message'
import type { ChatMessage, Conversation, MessageNotice, NoticeType } from '@/types/message'

export const useMessageStore = defineStore('message', () => {
  const conversations = ref<Conversation[]>([])
  const notices = ref<MessageNotice[]>([])
  const chatMessages = ref<ChatMessage[]>([])
  const selectedConversationId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref('')

  const activeConversation = computed(() =>
    conversations.value.find(item => item.id === selectedConversationId.value),
  )
  const unreadTotal = computed(() => conversations.value.reduce((sum, item) => sum + item.unread, 0))

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const data = await getMessageHome()
      conversations.value = data.conversations
      notices.value = data.notices
      chatMessages.value = data.chatMessages
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '消息加载失败'
    } finally {
      loading.value = false
    }
  }

  function noticesByType(type: NoticeType) {
    return notices.value.filter(item => item.type === type)
  }

  async function openConversation(id: number) {
    selectedConversationId.value = id
    const target = conversations.value.find(item => item.id === id)
    if (target) target.unread = 0
    await markConversationRead(id)
  }

  async function send(content: string) {
    const conversationId = selectedConversationId.value
    if (!conversationId || !content.trim()) return
    const message: ChatMessage = {
      id: Date.now(), conversationId, mine: true, content: content.trim(), time: '刚刚', status: 'sending',
    }
    chatMessages.value.push(message)
    try {
      await postChatMessage(conversationId, message.content)
      message.status = 'sent'
    } catch {
      message.status = 'failed'
    }
  }

  return { conversations, notices, chatMessages, selectedConversationId, activeConversation, unreadTotal, loading, error, load, noticesByType, openConversation, send }
})
