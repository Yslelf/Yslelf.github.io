import mock from '@/mock/mock.json'
import type { MessageHomeData } from '@/types/message'
import { http } from './http'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export async function getMessageHome(): Promise<MessageHomeData> {
  if (useMock) return Promise.resolve(JSON.parse(JSON.stringify(mock.messages)) as MessageHomeData)
  return http.get('/messages/home') as unknown as Promise<MessageHomeData>
}

export async function postChatMessage(conversationId: number, content: string): Promise<void> {
  if (useMock) return Promise.resolve()
  await http.post(`/messages/conversations/${conversationId}/messages`, { content })
}

export async function markConversationRead(conversationId: number): Promise<void> {
  if (useMock) return Promise.resolve()
  await http.put(`/messages/conversations/${conversationId}/read`)
}
