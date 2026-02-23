# Arrow Stack Themer

HTML, CSS, and JS-first site builder with a **semantic CSS architecture** designed for agentic workflows.

---

## Overview

Arrow Stack Themer provides a layered CSS system where every value flows from a single source of truth — design tokens. AI agents and developers can restyle the entire system by overriding a handful of CSS custom properties, without touching component markup.

---

## File Structure

```
/
├── index.html            # Demo page showcasing all tokens, layout & components
├── AGENT_API.md          # Compact agent reference (config + components + recipes)
└── css/
    ├── main.css          # Entry point – imports all layers in order
    ├── theme.config.css  # AGENT WRITE SURFACE – 19 variables, edit this to theme
    ├── tokens.css        # Implementation tokens (derived from theme.config.css)
    ├── base.css          # CSS reset + base element styles
    ├── layout.css        # Semantic layout primitives
    ├── components.css    # Reusable UI components
    ├── utilities.css     # Single-purpose utility classes
    └── themes/
        ├── light.css     # Light theme surface/text/border overrides
        └── dark.css      # Dark theme surface/text/border overrides
```

---

## CSS Architecture

The system uses **CSS Cascade Layers** (`@layer`) to guarantee predictable specificity:

```
tokens → base → themes → layout → components → utilities
```

| Layer | Purpose |
|-------|---------|
| `tokens` | All raw palette values and semantic aliases as CSS custom properties |
| `base` | Modern CSS reset + base element typography |
| `themes` | Light/dark overrides of semantic tokens only |
| `layout` | Intrinsic layout primitives (stack, grid, sidebar, cover, etc.) |
| `components` | Semantic UI components (button, card, alert, badge, etc.) |
| `utilities` | Single-purpose override helpers |

---

## Design Tokens

Tokens follow the naming convention: `--{category}-{role}-{variant}`.

| Category | Example |
|----------|---------|
| Color palette | `--palette-brand-600` |
| Semantic color | `--color-text-primary`, `--color-brand-default` |
| Spacing | `--space-4`, `--space-gap-md` |
| Typography | `--font-size-lg`, `--font-weight-semibold` |
| Radius | `--radius-md`, `--radius-full` |
| Shadow | `--shadow-sm`, `--shadow-xl` |
| Motion | `--motion-duration-normal`, `--motion-easing-spring` |
| Z-index | `--z-modal`, `--z-tooltip` |

---

## Layout Primitives

Each primitive is configured via `data-*` attributes on the element — no custom CSS required.

| Primitive | Class | Controls |
|-----------|-------|----------|
| Wrapper | `.l-wrapper` | `data-width` |
| Stack | `.l-stack` | `data-gap`, `data-recursive` |
| Cluster | `.l-cluster` | `data-gap`, `data-align`, `data-justify` |
| Grid | `.l-grid` | `data-min`, `data-gap` |
| Sidebar | `.l-sidebar` | `data-side` + child `data-role` |
| Cover | `.l-cover` | `data-min-height` + child `data-role="principal"` |
| Frame | `.l-frame` | `data-ratio` |
| Switcher | `.l-switcher` | CSS variable `--switcher-threshold` |
| Region | `.l-region` | `data-padding` |

---

## Components

All variants and states are driven by `data-*` attributes, making them straightforward for agents to parameterise programmatically.

```html
<!-- Button variants -->
<button class="c-button">Primary</button>
<button class="c-button" data-variant="outline">Outline</button>
<button class="c-button" data-variant="ghost">Ghost</button>
<button class="c-button" data-variant="danger">Danger</button>
<button class="c-button" data-size="lg">Large</button>

<!-- Status badge -->
<span class="c-badge" data-status="success">Success</span>

<!-- Alert -->
<div class="c-alert" data-status="warning" role="alert">
  <div class="c-alert__body">
    <p class="c-alert__title">Attention</p>
    <p class="c-alert__message">One agent returned an unexpected result.</p>
  </div>
</div>

<!-- Card -->
<article class="c-card" data-variant="elevated">
  <div class="c-card__header">Title</div>
  <div class="c-card__body">Content</div>
  <div class="c-card__footer">Footer</div>
</article>
```

---

## Theming

Apply a theme by setting `data-theme` on any container (typically `<html>`):

```html
<html data-theme="light"> <!-- explicit light -->
<html data-theme="dark">  <!-- explicit dark  -->
<html>                    <!-- follows OS prefers-color-scheme -->
```

To create a custom theme, copy `css/themes/light.css` and override only the semantic tokens you need — palette tokens never need to change.

---

## Usage

1. Link `css/main.css` in your HTML `<head>`:
   ```html
   <link rel="stylesheet" href="css/main.css" />
   ```
2. Open `index.html` in a browser for a live component reference.
3. Override tokens in your own stylesheet at the `tokens` layer or in a scoped `:root` block.

---

## Agentic Workflow Integration

See **[AGENT_API.md](AGENT_API.md)** for the compact agent reference — config table, component attribute tables, and copy-paste recipes. Designed to fit in a single LLM context window.

### Agent write surface

| What to change | Where to edit |
|---|---|
| Colours, fonts, shape, spacing, motion | `css/theme.config.css` **only** |
| Component variant / state | `data-*` attribute on the HTML element |
| Layout behaviour | `data-*` attribute on the layout element |
| Dark / light mode | `data-theme="dark"` on `<html>` or any container |

### How it works

```
css/theme.config.css   ← 19 variables, the ONLY agent write surface
       ↓ var() / calc()
css/tokens.css         ← all implementation tokens derived from config
       ↓ consumed by
base · themes · layout · components · utilities   ← read-only infrastructure
```

Every component and layout token derives from `theme.config.css` via `var()` or `calc()`.
Changing one config variable propagates to every affected component automatically — no hunting across multiple files.

---

## PR Checklist (Agents Adding Components)

Use this checklist before opening or merging a component PR.

- [ ] Scope is component work only (no unrelated theming/layout changes).
- [ ] New styles are in a dedicated file under `css/components/`.
- [ ] `css/components.css` imports the new file in correct order.
- [ ] Component API uses semantic classes (`.c-*`) + `data-*` variants/states.
- [ ] Only existing tokens are used (`--color-*`, `--space-*`, `--radius-*`, `--motion-*`, `--font-*`).
- [ ] No hard-coded new colors/fonts/shadows unless explicitly requested.
- [ ] Mobile-first default styles are used; larger breakpoints are `@media (min-width: ...)` enhancements.
- [ ] Keyboard and focus behavior are preserved (`:focus-visible`, accessible labels/roles where relevant).
- [ ] API docs/examples are added or updated in `AGENT_API.md`.
- [ ] At least one usage example is present in `index.html` or `walkthrough.html`.
- [ ] Diagnostics run clean (no new errors).
