
export const STORAGE_KEYS = {
  LEGACY_TOKEN: 'auth_token',
  LEGACY_USER: 'auth_user',
  LEGACY_REFRESH_TOKEN: 'auth_refresh_token',
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

