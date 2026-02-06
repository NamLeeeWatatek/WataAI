# Task: Optimize Dashboard Speed by Removing Animations

The goal is to remove all animations (Framer Motion and heavy CSS transitions/animations) from the Dashboard and internal pages to optimize performance, while keeping them only on the marketing landing pages.

## Status: COMPLETED
## Priority: HIGH
## Assigned to: Antigravity

---

## 📅 Roadmap

### Phase 1: Removal of Framer Motion from Dashboard
- [x] Identify `DashboardLayout` and nested layouts using `framer-motion`.
- [x] Remove `PageTransition` component from `DashboardLayout`.
- [x] Update `DashboardLayout` to render children directly without `PageTransition`.
- [x] Review `I18nProvider` to ensure it only uses animations for marketing pages (already mostly done, but verify).

### Phase 2: Removal/Simplification of CSS Animations in Components
- [x] Search for `transition-all`, `animate-`, and `hover:` transform/animation classes in dashboard components.
- [x] Simplify or remove these classes in `DashboardSidebar`, `DashboardHeader`, and other layout components.
- [x] Clean up `DashboardStatsCards`, `DashboardTopBots`, and `DashboardWorkspaceOverview`.
- [x] Optimize feature pages: `Bots` page, `Knowledge Base` grid, `Templates` grid, and `Workflow` cards.
- [x] Optimize shared components: `AgentCard`, `NotificationDropdown`, and `WorkspaceSwitcher`.
- [x] Check `components/ui` for common animation classes and remove them for internal use if possible.

### Phase 3: Cleanup and Verification
- [x] Remove unused `framer-motion` imports where applicable.
- [x] Verify that marketing pages still have their intended animations.
- [x] Audit the dashboard for any remaining "moving" parts.

---

## 📝 Implementation Details

### Files to Modify:
1. `web/app/(dashboard)/layout.tsx`: Remove `PageTransition`.
2. `web/components/layout/DashboardSidebar.tsx`: Remove hover scales and transitions.
3. `web/components/layout/DashboardHeader.tsx`: Remove sticky transitions if possible.
4. `web/app/globals.css`: Optional - provide a way to disable animations for dashboard via a class.

---

## ✅ Verification Criteria
- [ ] Navigating between dashboard pages has NO fade/slide transitions.
- [ ] Sidebar interactions (collapse/expand) are instant or use minimal CSS transitions.
- [ ] Landing page still has the initial "Initializing" animation and hero animations.
- [ ] No `framer-motion` overhead in dashboard route bundles (partially handled by Next.js code splitting, but logic should be gone).
