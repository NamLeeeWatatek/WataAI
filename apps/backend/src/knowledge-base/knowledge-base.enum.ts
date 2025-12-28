export enum KbProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum KbSourceType {
  MANUAL = 'manual',
  FILE = 'file',
  WEB = 'web',
}
