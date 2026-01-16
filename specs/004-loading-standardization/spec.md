# Feature Spec 004: Loading Strategy Standardization

## Overview
Enforce a strict loading strategy across the application to improve UX and performance perception. This involves auditing existing loading states and refactoring them to adhere to new guidelines regarding Skeletons, Spinners, and Non-blocking AI operations.

## Rules
1.  **Global Loading**: Only for route transitions. No global overlays for actions.
2.  **Skeletons**: Use for content and data fetching placeholders.
3.  **Spinners**: Use for scoped user actions (buttons).
4.  **Auth**: Inline loading only (already implemented in Spec 003).
5.  **AI Tools**: Non-blocking, streaming/progress feedback.

## Scope of Work
-   **Audit `loading.tsx`**: Ensure they act as Skeletons, not spinners (mostly done in 002).
-   **Audit AI Components**: Check `GenerationPanel`, `ChatInterface`, etc., to ensure they don't block the UI.
-   **Standardize Spinners**: Ensure all buttons use `Loader2` from `lucide-react`.
-   **Refactor Global Loaders**: Identify any remaining usage of `LoadingLogo` that blocks the full screen (outside of route loading).

## Success Criteria
-   No "white screen" or "full screen spinner" during typical usage (except route navigation).
-   AI generation allows browsing other tabs/sections if possible (or at least doesn't look like a crash).
-   Consistent loading iconography.
