# Feature Spec 003: Auth Inline Loading

## Overview
Switch authentication actions (Login/Logout) to use strictly inline loading states (e.g., spinners on buttons) instead of full-page or route-segment loading skeletons. This is to prevent theme flashing and provide a smoother user experience.

## User Story
- As a user logging in, I see a spinner on the "Sign In" button while the request processes. The page remains stable.
- As a user logging out, I see a "Signing out..." indicator locally or on the button, not a full page refresh/skeleton flash.

## Requirements

### 1. Disable Route Loading for Auth
-   **Remove `apps/web/app/(auth)/loading.tsx`**: We previously created this. It must be removed to prevent `Next.js` from triggering a Suspense boundary transition which causes the "flash".

### 2. Button Loading
-   **Login Page**: Ensure the login form uses detailed `isLoading` state to disable inputs and show a spinner on the submit button.
-   **Logout Action**: Ensure the logout trigger (in Sidebar/Header) shows a loading state (e.g., disabled button with spinner or toast) instead of redirecting immediately to a loading page.

### 3. Flash Prevention
-   By removing the route-level loading, we ensure the current page stays visible until the action completes and the router pushes the new URL, utilizing the browser's natural transition or Next.js soft navigation.
