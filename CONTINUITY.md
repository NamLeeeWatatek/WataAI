# Continuity Ledger

- Goal: Perform a comprehensive code check for backend (`apps/backend`) and frontend (`apps/web`) adhering to `@.agent/rules`.
- Constraints/Assumptions:
  - Adhere to `senior-fullstack.md`, `backend-design.md`, `frontend-design.md`, `nextjs-design.md`, `protected-code.md`.
  - Focus on stability and correctness.
  - Eliminate `any` usage where appropriate.
  - Standardize error handling and logging.
  - Follow UI/UX best practices (Shadcn UI).
- Key decisions:
  - Initialize `CONTINUITY.md` to track progress.
- State:
  - Done: Standardized global error handling (Backend Filter + Axios Interceptor + QueryProvider Toast). Refactored `DataTable` to use TanStack Table v8. Removed redundant manual error logic from hooks and `users/page.tsx`.
  - Now: Finalizing fullstack type audit and build verification.
  - Next: Fix `npm run lint` and build verification.
- Working set:
  - `apps/web/lib/hooks/useBotRagChat.ts`
  - `apps/web/lib/logger.ts`
  - `apps/web/lib/api/*.ts`
