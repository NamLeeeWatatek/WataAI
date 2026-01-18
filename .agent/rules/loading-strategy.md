---
name: loading-strategy
description: Strict guidelines for loading states, skeletons, and spinners across the application.
tools: Read, Write
model: sonnet
---

# Loading Strategy & User Feedback

## Core Principles

### 1. Global Loading
-   **Usage**: Only for route-level initial load (when navigating to a new major section).
-   **Prohibition**: NEVER use global loading overlays for authentication or specific user actions.
-   **Implementation**: Use `loading.tsx` at route segment roots, but keep it lightweight.

### 2. Skeletons (Content Loading)
-   **Usage**: Placeholder for content when the layout structure is known.
-   **Priority**: Preferred over spinners for initial data fetching (e.g., dashboard widgets, lists).
-   **Design**: Must match the layout dimensions exactly to prevent layout shift (CLS).
-   **Theme**: Must adapt to the current theme (use `bg-muted` or specific theme tokens).

### 3. Spinners (Action Feedback)
-   **Usage**: Explicit user actions (e.g., form submission, button clicks, AI generation triggers).
-   **Scope**: MUST be scoped to the action initiator (e.g., inside the button, or replacing the specific icon).
-   **Blocking**: Do NOT block the entire UI unless absolutely necessary (critical destructive action).
-   **Icon**: Use `Loader2` from `lucide-react` with `animate-spin`.

### 4. Authentication Loading
-   **Inline Only**: Login/Register/Logout actions must use inline loading states.
-   **No Route Loading**: Do NOT use a top-level `loading.tsx` for `(auth)` routes to prevent page transition flashes.
-   **Form State**: Disable inputs and buttons during loading (`isBusy` state).

### 5. AI Operations
-   **Non-Blocking**: AI tasks (generation, analysis) must never block the whole page.
-   **Feedback**: Provide real-time progress bars, streaming text, or toast notifications.
-   **Background**: Allow the user to navigate away or perform other tasks if the operation is long-running.

## Implementation Checklist
- [ ] Is this a route transition? -> Use `loading.tsx` (Skeleton).
- [ ] Is this a user click? -> Use Inline Spinner.
- [ ] Is this fetching data? -> Use Component Skeleton.
- [ ] Is this Auth? -> Use Form Disabling + Button Spinner.
