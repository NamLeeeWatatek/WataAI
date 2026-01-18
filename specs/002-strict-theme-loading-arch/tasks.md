- [x] **Step 1: Marketing Theme Lockdown**
  - [x] Edit `apps/web/app/(marketing)/layout.tsx`.
  - [x] REMOVE `ThemeProvider`.
  - [x] Add `dark` class to the wrapper div.
  - [x] Ensure background is `bg-black` or `bg-slate-950` explicitly to prevent flash.

- [x] **Step 2: Auth Theme Lockdown**
  - [x] Verify `apps/web/app/(auth)/layout.tsx` has `dark` class.
  - [x] Ensure NO `ThemeProvider` is present.

- [x] **Step 3: Global Loading Cleanup**
  - [x] Check if `apps/web/app/loading.tsx` exists.
  - [x] If it does, DELETE it or move it to a specific route group if relevant.

- [x] **Step 4: Scoped Loading States**
  - [x] Create `apps/web/app/(marketing)/loading.tsx` -> Dark skeleton.
  - [x] ~~Create `apps/web/app/(auth)/loading.tsx` -> Dark skeleton.~~ (REMOVED in Spec 003 for Inline Loading)
  - [x] Create `apps/web/app/(dashboard)/loading.tsx` -> Adaptive skeleton.
  - [x] Create `apps/web/app/(admin)/loading.tsx` -> Adaptive skeleton.

- [x] **Step 5: Admin Layout Check**
  - [x] Verify `apps/web/app/(admin)/layout.tsx` uses `ThemeProviderWrapper`.
