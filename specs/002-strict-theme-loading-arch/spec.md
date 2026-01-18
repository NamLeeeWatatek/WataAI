# Feature Spec 002: Strict Theme & Loading Architecture

## Overview
Implement a strict, route-group-based theming and loading architecture. The system must enforce specific themes per route group (Marketing/Auth = Dark, Dashboard/Admin = Configurable) and ensure loading states are scoped and theme-matched without client-side dependencies.

## User Story
- As a visitor (Marketing/Auth), I always see a consistent, premium DARK theme. I never see a flash of light mode or a theme toggle.
- As a user (Dashboard/Admin), I can choose my preferred theme (Light/Dark/System), and my choice is remembered.
- As a user, I see instant, theme-matched loading skeletons that do not flicker or mismatch the final content.

## Requirements

### 1. Route Group Theme Rules
- **(marketing) & (auth)**:
    -   **Locked to DARK MODE**.
    -   Must NOT use `ThemeProvider` or `next-themes`.
    -   Must hardcode dark visuals (bg-black/slate-950, text-white).
    -   No localStorage or cookie reading for theme.
-   **(dashboard)**:
    -   **Configurable** (Light/Dark/System).
    -   Must use scoped `ThemeProvider`.
    -   Persist preference via `next-themes`.
-   **(admin)**:
    -   **Configurable** (defaults to message/dark).
    -   Must use scoped `ThemeProvider`, independent of dashboard if needed (or shared if architecture permits, but rule says "scoped to admin layout").

### 2. Loading Architecture
-   **No Global Loading**: `app/loading.tsx` must NOT exist or be empty/pass-through.
-   **Scoped Loading**:
    -   `(marketing)/loading.tsx`: Hardcoded DARK skeleton.
    -   `(auth)/loading.tsx`: Hardcoded DARK skeleton.
    -   `(dashboard)/loading.tsx`: Flexible skeleton (uses CSS variables/classes that respond to theme).
    -   `(admin)/loading.tsx`: Flexible skeleton.
-   **Independence**: Loading states must not read React state or context.

### 3. Global Constraints
-   **Root Layout**: `app/layout.tsx` must NOT have `ThemeProvider`. It serves purely as the HTML/Body shell.
-   **Isolation**: Theme state from dashboard must not leak to marketing/auth.

## Technical Considerations
-   Use `forcedTheme` prop in `ThemeProvider` is NOT enough for Marketing/Auth constraints because we want to *remove* the provider entirely to avoid overhead and flicker. We will use standard CSS/Tailwind classes for dark mode in these layouts.
