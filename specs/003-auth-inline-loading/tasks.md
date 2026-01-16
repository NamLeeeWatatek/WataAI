- [x] **Step 1: Remove Route Loading**
  - [x] Delete `apps/web/app/(auth)/loading.tsx` to prevent route transition flash.

- [x] **Step 2: Update Dashboard Layout**
  - [x] Edit `apps/web/app/(dashboard)/layout.tsx`.
  - [x] Remove the full-screen `if (isLoggingOut) return <Loading... />` block.
  - [x] Pass `isLoggingOut` state to `DashboardSidebar`.

- [x] **Step 3: Update Dashboard Sidebar**
  - [x] Edit `apps/web/components/layout/DashboardSidebar.tsx`.
  - [x] Add `isLoggingOut` to interface `DashboardSidebarProps`.
  - [x] Update Sign Out button to show spinner/disabled state when `isLoggingOut` is true.

- [x] **Step 4: Update Login Page**
  - [x] Edit `apps/web/app/(auth)/login/page.tsx`.
  - [x] Remove the full-page loading check `if (status === 'loading' || isRedirecting)`.
  - [x] Instead, use `isRedirecting` to disable form inputs and show loading state on the submit button (similar to `isLoading` state).
