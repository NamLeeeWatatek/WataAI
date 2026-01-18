
export interface InboxMessage {
  id: string
  conversation_id: string
  sender_type: string
  sender_id: string
  content: string
  created_at: string
}

export interface InboxConversation {
  id: string
  customer_name: string
  customer_id: string
  channel_name: string
  channel_icon?: string
  last_message_content: string
  last_message_at: string
  unread_count: number
  status: string
}

