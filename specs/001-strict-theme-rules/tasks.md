- [x] **Step 1: Cleanup Root Layout**
  - [x] Edit `apps/web/app/layout.tsx`.
  - [x] Remove `ThemeProviderWrapper` from the root layout.
  - [x] Ensure `Toaster` and others remain valid.

- [x] **Step 2: Enforce Marketing Light Mode**
  - [x] Edit `apps/web/app/(marketing)/layout.tsx`.
  - [x] Change `forcedTheme="dark"` to `forcedTheme="light"`.
  - [x] Update background/text classes to `light`.
  - [x] Ensure no local storage persistence is enabled (by using `forcedTheme`, next-themes handles this, but double check attributes).

- [x] **Step 3: Configure Dashboard Theming**
  - [x] Edit `apps/web/app/(dashboard)/layout.tsx`.
  - [x] Ensure `ThemeProviderWrapper` is properly wrapping the content here.
  - [x] Verify `ThemeProviderWrapper` configuration allows for system/light/dark switching.

- [x] **Step 4: Verify ThemeProviderWrapper**
  - [x] Check `apps/web/components/providers/ThemeProviderWrapper.tsx`.
  - [x] Ensure it supports the requirements (enableSystem, attribute="class").
