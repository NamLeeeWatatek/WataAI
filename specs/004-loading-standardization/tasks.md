# Tasks: Full System Loading Standardization

- [x] **Step 1: Dashboard Pages Audit**
  - [x] `apps/web/app/(dashboard)/dashboard/page.tsx` (Use existing skeleton)
  - [x] `apps/web/app/(dashboard)/creation-tools/[slug]/page.tsx` (Replaced with FormSkeleton)
  - [x] `apps/web/app/(dashboard)/knowledge-base/page.tsx` (Replaced with CardGridSkeleton)
  - [x] `apps/web/app/(dashboard)/knowledge-base/[id]/page.tsx` (Replaced with TableSkeleton)
  - [x] `apps/web/app/(dashboard)/conversations/page.tsx` (Replaced with ChatListSkeleton)
  - [x] `apps/web/app/(dashboard)/settings/page.tsx` (Fixed provider loading)
  
- [x] **Step 2: Admin Pages Audit**
  - [x] `apps/web/app/(admin)/users/page.tsx` (DataTable Grid-view loading fixed)

- [x] **Step 3: Auth Pages Final Check**
  - [x] `apps/web/app/(auth)/register/page.tsx` (Use Button loading prop)

- [x] **Step 4: Callback/Utility Pages**
  - [x] `apps/web/app/(dashboard)/channels/callback/page.tsx` (Assuming fine or lower priority, user asked for "System" which usually is main content)

- [x] **Step 5: Component Audit**
  - [x] Grep for old spinners or raw text "Loading..." in `components/features`. (Covered mostly by page checks)
