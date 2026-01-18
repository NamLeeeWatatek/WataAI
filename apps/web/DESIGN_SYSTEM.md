# Wata AI Design System: "Crystal" (Glassmorphism)

## Philosophy
The UI mimics high-quality optical glass. Layers provide context.
- **Light Mode**: "Frosted Ceramic". High brightness, soft shadows, icy translucency.
- **Dark Mode**: "Smoked Obsidian". Deep blacks, neon accents, high blur, subtle white specular borders.

## Implementation Guide

### 1. CSS Utilities (Tailwind)
Add these to `globals.css / @layer utilities`:

```css
@layer utilities {
  /* Base Glass (Sidebar, Panels) */
  .glass {
    @apply bg-white/10 dark:bg-black/20 backdrop-blur-xl border-r border-white/20 dark:border-white/10 supports-[backdrop-filter]:bg-white/10 supports-[backdrop-filter]:dark:bg-black/20;
  }
  
  /* Floating Glass (Dropdowns, Sticky Headers) */
  .glass-floating {
    @apply bg-white/20 dark:bg-black/40 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 shadow-lg supports-[backdrop-filter]:bg-white/20 supports-[backdrop-filter]:dark:bg-black/40;
  }
  
  /* Glass Card (Surface) */
  .glass-card {
    @apply bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm transition-all duration-300 hover:bg-white/50 hover:dark:bg-black/50 hover:shadow-lg hover:border-primary/20;
  }

  /* Input Glass (Recessed) */
  .glass-input {
    @apply bg-black/5 dark:bg-white/5 backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-inner focus:bg-background/80 transition-all;
  }

  /* High Contrast Overlay (Modals) */
  .glass-overlay {
    @apply bg-black/20 backdrop-blur-sm;
  }
}
```

### 2. Component Overrides
*   **Sidebar**: `h-screen sticky top-0 glass border-r-0`
*   **Card**: `glass rounded-xl shadow-sm hover:shadow-md transition-all`
*   **Dialog**: Overlay `glass-overlay`, Content `glass-floating rounded-2xl`

## Migration Checklist
- [ ] Define `.glass` classes in `globals.css`.
- [ ] Update `DashboardSidebar` to use `.glass`.
- [ ] Update `PageHeader` to use `.glass-floating`.
- [ ] Update `Card` to default to `.glass`.
- [ ] Update `Dialog` overlay.
