# Backend Refactoring Walkthrough

## 1. Encryption Refactoring

### Problem
The backend had duplicate encryption logic:
- `EncryptionUtil` (Legacy): Used hex-based `ENCRYPTION_KEY`.
- `EncryptionService` (New): Used base64-based `ENCRYPTION_SECRET`.

This caused build errors and runtime confusion.

### Solution
- **Consolidated** logic into `src/shared/services/encryption.service.ts`.
- **Backward Compatibility**: `EncryptionService` now accepts *both* `ENCRYPTION_SECRET` (preferred) and `ENCRYPTION_KEY` (legacy hex).
- **Refactored** `AiProvidersService`, `AiProviderEncryptionService`, and `EncryptionMigrationService` to use the unified `EncryptionService`.
- **Deleted** redundant `src/common/utils/encryption.util.ts`.

## 2. AI Configuration Refactoring

### Problem
The previous `AIConfig` global constant was confusing as it implied a system-wide override, whereas it was meant as a fallback.

### Solution
- **Renamed** `AIConfig` to `KbAiConfig` in `src/knowledge-base/config/kb-ai.config.ts`.
- **Purpose**: Explicitly marked as a last-resort fallback for Knowledge Base operations (RAG) when no database configuration (Bot, KB, or Workspace) is available.
- **Hierarchy**: Request Param > Bot Config > KB Config > Fallback.

## 3. Storage and Vector Naming Refactoring

### Problem
The backend relied on hardcoded strings for:
- Vector Database Collection Names (`'knowledge-base'`)
- Storage Buckets (`'documents'`, `'images'`, `'videos'`, `'audios'`)

### Solution
I implemented a **Configuration-Driven Approach** across `KnowledgeBaseModule` and `FilesModule`.

#### A. Knowledge Base Config (`kb.config.ts`)
- **`KB_VECTOR_COLLECTION_NAME`**: Default `'knowledge-base'`.
- **`KB_STORAGE_BUCKET`**: Default `'documents'`.

#### B. Files Module Config (`file.config.ts`)
- **`FILE_BUCKET_IMAGES`**: Default `'images'`.
- **`FILE_BUCKET_VIDEOS`**: Default `'videos'`.
- **`FILE_BUCKET_AUDIOS`**: Default `'audios'`.
- **`FILE_BUCKET_DOCUMENTS`**: Default `'documents'`.

## Verification
- Run `pnpm run build` to ensure type safety.
- Services now dynamically read these values at runtime.
