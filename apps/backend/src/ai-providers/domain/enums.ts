/**
 * Domain enums for AI Providers
 * Strong typing for provider identification and ownership
 */

// Provider Keys - Strict typing thay vì string literals
export enum ProviderKey {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OLLAMA = 'ollama',
  AZURE_OPENAI = 'azure-openai',
  CUSTOM = 'custom',
}

// Ownership Types - Multi-tenancy support
export enum OwnershipType {
  SYSTEM = 'system', // Global system configuration
  USER = 'user', // User personal configuration
  WORKSPACE = 'workspace', // Workspace shared configuration
}

// Provider Status - Operational states
export enum ProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  COMING_SOON = 'coming_soon',
}

// Configuration Field Types - Validation support
export enum ConfigFieldType {
  STRING = 'string', // Text input
  TEXT = 'text', // Multi-line text
  NUMBER = 'number', // Numeric input
  BOOLEAN = 'boolean', // True/false toggle
  SELECT = 'select', // Single choice dropdown
  MULTI_SELECT = 'multi-select', // Multiple choices
  JSON = 'json', // JSON object/array
  FILE = 'file', // Single file upload
  FILES = 'files', // Multiple file uploads
  KEY_VALUE = 'key-value', // Key-value pairs
}

// AI Model Categories - Better organization
export enum ModelCategory {
  GPT = 'gpt',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  OLLAMA = 'ollama',
  CUSTOM = 'custom',
}

// Usage Metric Types - Analytics support
export enum UsageMetricType {
  INPUT_TOKENS = 'input_tokens',
  OUTPUT_TOKENS = 'output_tokens',
  REQUESTS_COUNT = 'requests_count',
  COST_USD = 'cost_usd',
  LATENCY_MS = 'latency_ms',
}

// Error Codes - Structured error handling
export enum AiProviderErrorCode {
  // OpenAI specific errors
  OPENAI_RATE_LIMIT = 'OPENAI_RATE_LIMIT',
  OPENAI_INVALID_API_KEY = 'OPENAI_INVALID_API_KEY',
  OPENAI_MODEL_NOT_FOUND = 'OPENAI_MODEL_NOT_FOUND',
  OPENAI_CONTEXT_LENGTH_EXCEEDED = 'OPENAI_CONTEXT_LENGTH_EXCEEDED',

  // Anthropic specific errors
  ANTHROPIC_RATE_LIMIT = 'ANTHROPIC_RATE_LIMIT',
  ANTHROPIC_INVALID_API_KEY = 'ANTHROPIC_INVALID_API_KEY',
  ANTHROPIC_INVALID_REQUEST = 'ANTHROPIC_INVALID_REQUEST',

  // Google specific errors
  GOOGLE_RATE_LIMIT = 'GOOGLE_RATE_LIMIT',
  GOOGLE_INVALID_API_KEY = 'GOOGLE_INVALID_API_KEY',
  GOOGLE_QUOTA_EXCEEDED = 'GOOGLE_QUOTA_EXCEEDED',

  // Generic network/configuration errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Cache TTL Types - Consistent caching strategy
export enum CacheTTL {
  SHORT = 300, // 5 minutes - volatile data
  MEDIUM = 1800, // 30 minutes - user sessions
  LONG = 3600, // 1 hour - provider configs
  EXTRA_LONG = 86400, // 24 hours - static data
}
