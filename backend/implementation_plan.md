# Knowledge Base Refactoring Plan

## Goal
Improve code quality, validation, and architecture of the `knowledge-base` module in `apps/backend`.

## Proposed Changes

### 1. Configuration
#### [NEW] [ai.config.ts](file:///c:/WataAI/apps/backend/src/config/ai.config.ts)
- Define model constants (e.g., `GEMINI_FLASH_MODEL = 'gemini-2.0-flash'`).

### 2. Text Extraction Service Refactor
#### [MODIFY] [kb-text-extractor.service.ts](file:///c:/WataAI/apps/backend/src/knowledge-base/services/kb-text-extractor.service.ts)
- Move `extractPdfWithPdf2json` and `extractTextFromFile` logic here from `kb-documents.service.ts`.
- Use specific methods for different file types.

#### [MODIFY] [kb-documents.service.ts](file:///c:/WataAI/apps/backend/src/knowledge-base/services/kb-documents.service.ts)
- Inject `KBTextExtractorService`.
- Remove manual text extraction code.
- Delegate to the extractor service.

### 3. Circular Dependency Removal
#### [MODIFY] [kb-documents.service.ts](file:///c:/WataAI/apps/backend/src/knowledge-base/services/kb-documents.service.ts)
- Remove `KBManagementService` injection.
- Inject `KnowledgeBaseEntity` repository directly.
- Replace `this.kbManagementService.findOne(kbId)` calls with local repository lookups.

#### [MODIFY] [kb-management.service.ts](file:///c:/WataAI/apps/backend/src/knowledge-base/services/kb-management.service.ts)
- Remove `forwardRef` wrapper if possible, or at least clean up imports.

### 4. RAG Service Fixes
#### [MODIFY] [kb-rag.service.ts](file:///c:/WataAI/apps/backend/src/knowledge-base/services/kb-rag.service.ts)
- Import constants from `ai.config.ts`.
- Remove `(this as any)` hack.
- Replace `ILike` with a more optimized approach or at least add a TODO/Warning if DB migration is out of scope. (For now, I will keep the hybrid logic but fix the type safety and add comments).

## Verification Plan
- **Build Check**: Ensure `pnpm run build` passes.
- **Manual Verification**: Check if the application starts without strict circular dependency warnings.
