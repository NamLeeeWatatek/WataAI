export const AI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    type: 'chat',
    description: 'Fast and efficient Gemini 2.5 model',
    isDefault: true,
    isRecommended: true,
    maxTokens: 1000000,
    capabilities: ['chat', 'text-generation', 'vision'],
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    type: 'chat',
    description: 'Most capable Gemini 2.5 model with advanced reasoning',
    isDefault: false,
    isRecommended: true,
    maxTokens: 1000000,
    capabilities: ['chat', 'text-generation', 'vision', 'reasoning'],
  },
  {
    id: 'text-embedding-004',
    name: 'Text Embedding 004',
    provider: 'google',
    type: 'embedding',
    description: "Google's text embedding model for vector search",
    isDefault: true,
    isRecommended: false,
    maxTokens: 2048,
    capabilities: ['embedding'],
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    type: 'image',
    description: 'High quality image generation',
    isDefault: true,
    isRecommended: true,
    maxTokens: 0,
    capabilities: ['image-generation'],
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    provider: 'stability',
    type: 'image',
    description: 'Open source image generation',
    isDefault: false,
    isRecommended: false,
    maxTokens: 0,
    capabilities: ['image-generation'],
  },
];

export const CHAT_MODEL_OPTIONS = AI_MODELS.filter(
  (m) => m.type === 'chat',
).map((m) => m.id);

export const IMAGE_MODEL_OPTIONS = AI_MODELS.filter(
  (m) => m.type === 'image',
).map((m) => m.id);
