# Task: Refactor Frontend Quality & Compliance

Refactor the frontend to fix issues identified by UX, SEO, and Accessibility audits.

## 1. Analysis
- **UX**: High number of CSS variables, lack of depth, missing page transitions, typography issues.
- **SEO**: Missing meta tags (title, description, OG), multiple H1 tags on pages.
- **A11y**: Missing keyboard handlers for `onClick`, missing labels for inputs, missing `lang` attribute.
- **Clean Code**: Large components (e.g., `BotConfigSections.tsx`) need decomposition.

## 2. Planning
### Phase 1: Foundation (UX & Meta)
- [ ] Update `app/layout.tsx` to include `lang` attribute.
- [ ] Add global `Metadata` to `app/layout.tsx`.
- [ ] Implement a `SkipToMainContent` component.
- [ ] Add global page transitions using `framer-motion`.

### Phase 2: SEO & Semantic HTML
- [ ] Fix multiple `<h1>` tags in `app/(dashboard)/page.tsx` and other pages.
- [ ] Add page-specific metadata to key routes.

### Phase 3: Accessibility (A11y)
- [ ] Add `onKeyDown` handlers to elements with `onClick`.
- [ ] Ensure `Input` components use `Label` or have `aria-label`.

### Phase 4: Clean Code & Refactoring
- [ ] Split `BotConfigSections.tsx` into smaller, focused components.

## 3. Implementation
### Phase 1.1: Root Layout Enhancements
- Edit `web/app/layout.tsx`.

### Phase 1.2: Transistions & UX
- Create/Update `web/components/providers/PageTransition.tsx`.

### Phase 2: SEO Fixes
- Edit `web/app/(dashboard)/page.tsx`.
- Edit `web/app/(auth)/page.tsx`.

### Phase 3: A11y Fixes
- Audit and fix common interactive elements.

## 4. Verification
- [ ] Run `python .agent/skills/frontend-design/scripts/ux_audit.py .`
- [ ] Run `python .agent/skills/seo-fundamentals/scripts/seo_checker.py .`
- [ ] Run `python .agent/skills/frontend-design/scripts/accessibility_checker.py .`
- [ ] Run `python .agent/scripts/checklist.py .`
