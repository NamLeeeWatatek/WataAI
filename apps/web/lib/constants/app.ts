// App-wide constants

// File upload limits
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  FILE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
} as const

// API cache times (in milliseconds)
export const CACHE_TIMES = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 10, // 10 minutes
  LONG: 1000 * 60 * 30, // 30 minutes
  VERY_LONG: 1000 * 60 * 60, // 1 hour
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
} as const

// Form validation
export const FORM_VALIDATION = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  PASSWORD_MIN_LENGTH: 8,
} as const

// Timeouts
export const TIMEOUTS = {
  DEBOUNCE: 300,
  API_REQUEST: 30000, // 30 seconds
  FILE_UPLOAD: 120000, // 2 minutes
} as const

// Retry configurations
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BACKOFF_MULTIPLIER: 2,
} as const

// Default values
export const DEFAULTS = {
  LANGUAGE: 'en',
  TIMEZONE: 'UTC',
  THEME: 'system',
  ITEMS_PER_PAGE: 20,
} as const

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production',
  ENABLE_DEBUG_TOOLS: process.env.NODE_ENV === 'development',
} as const

// External URLs
export const EXTERNAL_URLS = {
  SUPPORT: 'https://support.wataomi.com',
  DOCS: 'https://docs.wataomi.com',
  GITHUB: 'https://github.com/NamLeeeWatatek/omni-ai-source',
} as const
