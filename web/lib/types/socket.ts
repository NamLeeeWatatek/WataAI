export interface SocketMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    sentAt?: string;
    createdAt?: string;
}

export interface SocketConversation {
    id: string;
    botId?: string;
    status?: string;
    lastMessage?: string;
    updatedAt?: string;
}

export interface SocketEventHandlers {
    onConversationUpdate?: (conversation: SocketConversation) => void;
    onNewConversation?: (conversation: SocketConversation) => void;
    onNewMessage?: (message: SocketMessage) => void;
}

