# Backend Codebase Audit & critique

> **Role**: Senior Backend Architect
> **Target**: `apps/backend` (Focus on `knowledge-base` module)
> **Tone**: Strict, Professional, Uncompromising

## 🚨 Critical Issues Summary

I have reviewed the `knowledge-base` module and I am **disappointed** with several architectural decisions and code quality standards found. Below is a breakdown of the issues that need immediate attention.

### 1. Architecture & Design Patterns (The "Spaghetti" Warning)

- **Circular Dependencies**:
  - **File**: `kb-documents.service.ts`
  - **Code**: `@Inject(forwardRef(() => KBManagementService))`
  - **Verdict**: **Bad Practice.** Circular dependencies are a sign of poor separation of concerns. `DocumentsService` and `ManagementService` are too tightly coupled. You should likely extract shared logic into a third service or use event-based communication.

- **God-Method Anti-Pattern**:
  - **File**: `kb-documents.service.ts`
  - **Code**: `extractPdfWithPdf2json` and `extractTextFromFile`
  - **Verdict**: **Violation of SRP (Single Responsibility Principle).** The `KBDocumentsService` should manage *documents* (CRUD, metadata), not parse distinct file formats.
  - **Fix**: Move text extraction logic to a dedicated `TextExtractionService` or a Strategy pattern where each mime-type has its own processor.

### 2. Code Quality & Type Safety

- **The `as any` Hack**:
  - **File**: `kb-rag.service.ts`, Line ~190
  - **Code**: `return (this as any).query(...)`
  - **Verdict**: **UNACCEPTABLE.** Casting `this` to `any` to bypass type checks or call a method recursively or differently is lazy and dangerous. Fix the method signature or the logic. Do not fight the type system.

- **Magic Strings & Hardcoded Values**:
  - **File**: `kb-rag.service.ts`
  - **Code**: `'gemini-2.0-flash'` repeated everywhere.
  - **Verdict**: **Sloppy.** What happens when we switch to `gemini-3.0`? You act like a junior dev finding/replacing strings. Define this **ONCE** in a `constants.ts` or configuration file.

- **Dynamic Imports**:
  - **File**: `kb-documents.service.ts`
  - **Code**: `const fetch = (await import('node-fetch')).default;` inside `uploadFileToStorage`.
  - **Verdict**: **Inefficient.** NestJS has a built-in `HttpModule` (wrapping Axios or fetch). Use dependency injection for HTTP clients. Don't import modules dynamically inside a hot path unless absolutely necessary for tree-shaking (which is irrelevant on backend).

### 3. Performance & Scalability

- **Database Queries**:
  - **File**: `kb-rag.service.ts`
  - **Code**: `content: ILike(\`%${query}%\`)` in `hybridQuery`.
  - **Verdict**: **Performance Killer.** `ILike` with a leading wildcard (`%query%`) cannot use standard B-Tree indexes. On a table with 100k+ chunks, this will do a **Full Table Scan** every time.
  - **Fix**: Use PostgreSQL Full Text Search (`tsvector`/`tsquery`) or rely on the Vector DB for text search. Do not use `ILike` for search features.

- **Memory Usage**:
  - **File**: `kb-documents.service.ts`
  - **Code**: `extractTextFromFile(buffer: Buffer, ...)`
  - **Verdict**: **DoS Risk.** You are loading entire files into memory buffers. If a user uploads a 50MB PDF, you block the event loop processing it.
  - **Fix**: Use streams (`ReadStream`) where possible, especially for uploads and parsing.

### 4. Code Hygiene

- **Logging**: Inconsistent implementation. Some places use `this.logger.error`, `knowledge-base.controller.ts` uses `console.error` (Line 387). Be consistent. Use the Logger.
- **Error Swallowing**: `kb-rag.service.ts` catches errors in `gatherRAGContext` and just logs a warning. Ensure this is intended behavior; otherwise, you are hiding partial failures that might confuse users.

---

## 🛠 Recommended Refactoring Plan

1.  **Refactor Text Extraction**: Create `libs/text-extraction` or `apps/backend/src/shared/text-extraction` and move all PDF/Docx logic there.
2.  **Fix Config**: Create `apps/backend/src/config/ai.config.ts` for model names.
3.  **Optimize Search**: Replace `ILike` with Postgres Full Text Search or remove the "Keyword" part of Hybrid search if it's not performant.
4.  **Remove Circular Deps**: Refactor `KBManagementService` and `KBDocumentsService` interfaces.

Do not let these issues rot in the codebase. Fix them now.
