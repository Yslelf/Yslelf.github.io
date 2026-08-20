export type NoticeType = 'comments' | 'likes' | 'follows'

export interface Conversation {
  id: number
  name: string
  avatar: string
  text: string
  time: string
  unread: number
  online: boolean
}

export interface MessageNotice {
  id: number
  type: NoticeType
  user: string
  avatar: string
  action: string
  content: string
  time: string
  cover: string
}

export interface ChatMessage {
  id: number
  conversationId: number
  mine: boolean
  content: string
  time: string
  status?: 'sending' | 'sent' | 'failed'
}

export interface MessageHomeData {
  conversations: Conversation[]
  notices: MessageNotice[]
  chatMessages: ChatMessage[]
}
