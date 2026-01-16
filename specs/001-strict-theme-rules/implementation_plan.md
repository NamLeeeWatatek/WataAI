# Implementation Plan - Strict Theming Rules

## Proposed Architecture
We will refactor the theme provider hierarchy to enforce strict theming rules for the `(marketing)` and `(dashboard)` route groups.

### Layout Restructuring
1.  **Remove Root Provider**: The `ThemeProviderWrapper` will be removed from `apps/web/app/layout.tsx`. This decoupling allows each route group to define its own theming strategy.
2.  **Marketing Routes**:
    -   `apps/web/app/(marketing)/layout.tsx` is already correctly configured with a forced "dark" theme (Wait, the user requested "LIGHT" mode only. Current code shows "forcedTheme='dark'". **Correction Needed**: Force `light` mode).
    -   We will update `MarketingLayout` to force `light` mode and ensure no persistence is used.
3.  **Dashboard Routes**:
    -   `apps/web/app/(dashboard)/layout.tsx` is currently wrapping content in `ThemeProviderWrapper`.
    -   This is acceptable, but we need to ensure this wrapper enables the theme toggle and persistence as required.

### Component Updates
-   `ThemeProviderWrapper.tsx`: Currently defaults to `dark`. We might need a separate configuration or just use it as the "flexible" provider for the dashboard.
-   `DashboardHeader.tsx`: Verify the theme toggle is present and working (implied).

## Tech Stack
-   **Framework**: Next.js 14 (App Router)
-   **Styling**: Tailwind CSS
-   **Theming**: `next-themes`
-   **UI Components**: shadcn/ui

## Data Model
 No database changes required. LocalStorage will be used for theme persistence in the dashboard area only.
