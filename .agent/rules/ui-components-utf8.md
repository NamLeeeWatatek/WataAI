---
description: Standards for building and refactoring UI components in the apps/web/components/ui directory, following modern Shadcn UI patterns and ShadcnStudio aesthetics.
---

# UI Component Standards

When creating or refactoring components in apps/web/components/ui, follow these rules to ensure consistency, accessibility, and maintainability.

## 1. Minimalistic & Modern Architecture
- Use Functional Components over React.forwardRef when the component doesn't explicitly need to be ref-aware for external parents.
- Use Component Composition: Break complex components into smaller, focused parts (e.g., Select, SelectTrigger, SelectContent).
- Use data-slot attributes on all interactive elements and sub-components (e.g., data-slot='input', data-slot='select-trigger') to allow for unified styling and testing.

## 2. Styling Patterns
- Always use the cn() utility for class merging.
- Semantic Tokens: Only use CSS variables/tokens (e.g., bg-background, text-foreground, border-input, ring-ring). Avoid hardcoded hex codes or arbitrary Tailwind values.
- State Styling: Use modifiers for states like focus-visible:, disabled:, data-[state=open]:, aria-invalid:.
- Transitions: Include smooth transitions for interactive states: transition-[color,box-shadow].

## 3. Standard UI Properties
- Components should accept standard HTML attributes using React.ComponentProps<'tag'> or Radix primitive props.
- Inputs & Textareas: 
  - Standard focus ring: focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring.
  - Background: dark:bg-input/30.
  - Border: border-input.

## 4. Accessibility (A11y)
- Use Radix UI Primitives as the foundation for complex components.
- Ensure aria-invalid styles are handled.

## 5. Prohibitions
- DO NOT use ad-hoc custom CSS in component files.
- DO NOT create components without standardized variants (if they require variants, use cva).
- DO NOT use rounded-lg if a standard var(--radius) or rounded-md is available.
