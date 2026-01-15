---
status: approved
start_date: 2026-01-15
owner: User
context: [web, frontend-audit]
---

# Spec: Frontend Standardization & Audit

## 1. Overview
Audit the entire Frontend (`apps/web`) application to standardize code style, library usage, and UI design patterns.
Focus on consistency with:
-   **Shadcn UI**: Ensure standard components are used instead of ad-hoc styles.
-   **Tailwind CSS**: Consistent utility usage.
-   **Structure**: Project folder structure and imports.

## 2. User Story
As a Developer, I want a clean, consistent frontend codebase so that:
-   New features are easier to build.
-   The UI looks consistent across all pages.
-   Maintenance costs are reduced.

## 3. Audit Findings (Current State)
### 3.1 Structure Issues
-   `components/ui` is polluted with complex/custom components (e.g., `AvatarUpload`, `CoverUpload`, `JsonEditor`, `Chart`, `DataTable`).
-   Standard Shadcn components should be isolated from domain-specific or complex composed components.

### 3.2 Icon Inconsistency
-   Mixed usage of `lucide-react` (Shadcn default) and `react-icons` (Found in `KbDocumentItem`, `KbCrawlerDialog`, etc.).
-   **Goal**: Standardize on `lucide-react`.

### 3.3 Dependency Clutter
-   `package.json` has `react-icons`, `@tiptap/*`, `recharts`, `reactflow`. These are fine but usage needs to be checked.

## 4. Technical Design (Proposed Changes)

### 4.1 Refactor Components Directory
-   **Keep**: `components/ui` -> Only Shadcn primitives (Button, Input, etc.).
-   **Create/Move**: `components/shared` -> Generic reusable components (`AvatarUpload`, `DataTable`, `Chart`).
-   **Create/Move**: `components/features` -> Domain specific (already exists, ensure usage).

### 4.2 Icon Migration Plan
-   Scan all files using `react-icons`.
-   Replace with equivalent `lucide-react` icons.
-   Uninstall `react-icons` to prevent future usage.

### 4.3 Styling & Consistency
-   Ensure all colors use CSS Variables (e.g., `bg-primary`, `text-muted-foreground`) instead of hardcoded hex values.

## 5. Implementation Steps
1.  [x] **Move Components**: Relocate non-primitive components from `ui` to `shared` or `features`.
2.  [x] **Refactor Imports**: Update all import paths in the application to match new locations.
3.  [x] **Replace Icons**: Find & Replace `react-icons` with `lucide-react`.
4.  [x] **Uninstall**: Remove `react-icons` from `package.json`.
5.  [x] **Verify**: Build project to ensure no broken paths.
