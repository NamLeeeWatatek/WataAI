# UI Standardization Audit & Master Plan
> **Status**: Verification Phase
> **Goal**: Unify all UI components and layouts to "Premium SaaS" standards (Glassmorphism, h-10 inputs, rounded-lg interactions).

---

## 1. Design System Tokens (The "DNA")
These rules must be enforced in every component modification.
| Element | Metric | Tailwind Class | Notes |
| :--- | :--- | :--- | :--- |
| **Input/Select** | Height | `h-10` | 40px standard |
| **Button** | Height | `h-10` | Default variant |
| **Button (Small)** | Height | `h-9` | Secondary actions |
| **Button (Large)** | Height | `h-11`/`h-12` | Major CTAs (Login, Save) |
| **Interactive Radius** | Radius | `rounded-lg` | Inputs, Buttons, Tabs |
| **Container Radius** | Radius | `rounded-xl` | Cards, Dialogs, Popovers |
| **Overlay Radius** | Radius | `rounded-2xl` | Modals, Sheets |
| **Borders** | Color | `border-border/60` | Subtle, clean borders |
| **Glass Effect** | Class | `.glass`, `.glass-floating` | Universal transparency |

---

## 2. Component Primitives Audit
Listing every core component and the required fix.

### 🟥 Priority 1: High Visibility Atoms
- [x] **Input**: `h-10`, `rounded-lg`, `.glass-input` (Done)
- [x] **Button**: `h-10`, `rounded-lg`, glass variants (Done)
- [x] **Select**: Trigger `h-10`, `rounded-lg`, glass styling (Done)
- [x] **Textarea**: `rounded-lg`, `.glass-input` (Done)
- [x] **Tabs**: `rounded-lg`, glass containers (Done)
- [x] **Badge**: `rounded-md` (Done)

### 🟧 Priority 2: Overlay & Floating Elements
- [x] **Dialog**: `rounded-2xl`, `.glass-overlay`, `.glass-modal` (Done)
- [x] **Sheet**: `.glass` panels (Done)
- [x] **Popover**: `rounded-xl`, `.glass-floating` (Done)
- [x] **DropdownMenu**: `rounded-xl`, `.glass-floating` (Done)
- [x] **Avatar**: `rounded-full` (Kept as is - correct)

### 🟨 Priority 3: Form Elements
- [x] **Checkbox**: `rounded-[4px]` (Done)
- [ ] **Switch**: `rounded-full` (Kept as is)

---

## 3. Global Layout Logic
Fixing the constraints that specific pages live within.

### `apps/web/app/(dashboard)/layout.tsx`
- [x] **Audit `isSpecialPage`**: Added Chat and Workflows to special list. (Done)

### `components/layout/DashboardSidebar.tsx`
- [x] **Glassmorphism**: Applied `.glass` utility. (Done)

---

## 4. Page-Specific Refactors
Systematically updating pages to use the new components and `PageHeader`.

### `(dashboard)/chat/page.tsx`
- [x] **Major Refactor**: Removed rigid white backgrounds, applied glass sidebars, fixed structure. (Done)

### `(dashboard)/workflows/page.tsx`
- [x] **Refine**: Standardized headers and inputs. (Done)

### `(dashboard)/knowledge-base/page.tsx`
- [x] **Standardize**: Cleaned up cards. (Done)

### `(dashboard)/bots/page.tsx`
- [x] **Standardize**: Enforced standard inputs. (Done)

### `(dashboard)/settings/page.tsx`
- [x] **Standardize**: Sticky glass headers for tabs. (Done)

---

## 5. Execution Strategy (Batch Processing)
**Current Step**: Verification of the full Glassmorphism rollout.
