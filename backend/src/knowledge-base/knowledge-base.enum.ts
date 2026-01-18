export enum KbProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

export enum KbSourceType {
  MANUAL = 'manual',
  FILE = 'file',
  WEB = 'web',
}
