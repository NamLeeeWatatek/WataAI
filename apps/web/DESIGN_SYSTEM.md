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
  /* Base Glass Panel (Sidebar, Cards) */
  .glass {
    @apply bg-background/60 backdrop-blur-xl border border-border/50;
  }
  
  /* Floating Glass (Dropdowns, Sticky Headers) */
  .glass-floating {
    @apply bg-background/80 backdrop-blur-2xl border border-border/60 shadow-xl;
  }
  
  /* Input Glass (Recessed) */
  .glass-input {
    @apply bg-background/40 backdrop-blur-sm border border-border/40 focus:bg-background/80 transition-all;
  }

  /* High Contrast Overlay (Modals) */
  .glass-overlay {
    @apply bg-black/40 backdrop-blur-md; /* Darkens content behind */
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
