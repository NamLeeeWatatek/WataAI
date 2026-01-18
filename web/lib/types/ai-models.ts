
export interface AIModelInfo {
  model_name: string;
  display_name: string;
  api_key_configured: boolean;
  is_available: boolean;
  capabilities: string[];
  max_tokens: number;
  description: string;
  is_default?: boolean;
  is_recommended?: boolean;
}

export interface AIProviderGroup {
  provider: string;
  models: AIModelInfo[];
}

export interface ChatRequest {
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatWithHistoryRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response: string;
}

export interface DefaultModelResponse {
  model_name: string;
  display_name: string;
  provider: string;
}

export type GetModelsResponse = AIProviderGroup[];
export type GetDefaultModelResponse = DefaultModelResponse;
export type PostChatResponse = ChatResponse;
export type PostChatWithHistoryResponse = ChatResponse;

