# Feature Spec 001: Strict Route Group Theming

## Overview
Enforce strict theming rules across the application to ensure consistent branding and user experience. The marketing pages must be strictly Light Mode, while the dashboard (app) area can support Light, Dark, and System themes.

## User Story
As a site visitor, I see a consistent, clean Light Mode design on all marketing pages.
As a dashboard user, I can choose my preferred theme (Light/Dark/System) to optimize my viewing experience.
As a developer, I cannot accidentally break these rules because the architecture enforces them.

## Requirements

### 1. Marketing Route Group `(marketing)`
- **Forced Light Mode**: All pages within this group must render in Light Mode regardless of user preference or system settings.
- **No Theme Toggle**: The UI must not show any theme switching controls.
- **No Persistence**: The app must not read or write theme preferences to localStorage/cookies when in this group.

### 2. Dashboard Route Group `(dashboard)`
- **Flexible Theming**: Supports Light, Dark, and System modes.
- **User Control**: Users can switch themes via a settings control or toggle.
- **Persistence**: Theme preference is saved to localStorage/cookies.

### 3. Architecture
- **No Root Provider**: The global `ThemeProvider` must be removed from `app/layout.tsx`.
- **Scoped Providers**:
    - `(marketing)/layout.tsx` wraps children in a forced-light provider.
    - `(dashboard)/layout.tsx` wraps children in a standard next-themes provider.
