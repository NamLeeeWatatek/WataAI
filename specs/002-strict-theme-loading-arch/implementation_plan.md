# Implementation Plan - Strict Theme & Loading Architecture

## Proposed Architecture
We will implement a separated, scoped theming and loading strategy. `next-themes` will only be active for `(dashboard)` and `(admin)`. `(marketing)` and `(auth)` will use hardcoded Tailwind classes.

### 1. Theme Architecture
-   **Root (`app/layout.tsx`)**: No `ThemeProvider`, just pure structural HTML/Body. (Already Done)
-   **Marketing (`app/(marketing)/layout.tsx`)**: Hardcode `dark` class on the outer div. Ensure `forcedTheme="light"` is REMOVED if previously added, and replaced with explicit dark styling effectively "locking" it to dark. (Correction: User requested **DARK MODE ONLY** for Marketing/Auth. Previous spec 001 was Light, but this request 002 explicitly says **DARK ONLY**).
-   **Auth (`app/(auth)/layout.tsx`)**: Ensure hardcoded dark classes are present. No `ThemeProvider`.
-   **Dashboard (`app/(dashboard)/layout.tsx`)**: Wrap in `ThemeProviderWrapper` (flexible).
-   **Admin (`app/(admin)/layout.tsx`)**: Wrap in `ThemeProviderWrapper` (flexible).

### 2. Loading Architecture
-   **Root**: Ensure NO `app/loading.tsx`.
-   **Marketing**: Create `app/(marketing)/loading.tsx` with a DARK skeleton.
-   **Auth**: Create `app/(auth)/loading.tsx` with a DARK skeleton.
-   **Dashboard**: Create `app/(dashboard)/loading.tsx` using `bg-background`/`bg-muted` so it adapts to theme.
-   **Admin**: Create `app/(admin)/loading.tsx` adapting to theme.

## Tech Stack
-   **Next.js 14 App Router**
-   **Tailwind CSS**
-   **next-themes**
-   **lucide-react** (for loading spinners if needed)

## Data Model
-   No database changes.
-   LocalStorage key `theme` used only for Dashboard/Admin.

## Verification
-   Directly check `app/loading.tsx` existence.
-   Verify `(marketing)/layout.tsx` has NO Provider.
