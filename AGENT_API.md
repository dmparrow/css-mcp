# Arrow Stack Themer – Agent API Reference

> **To theme the site:** edit `css/theme.config.css` only.  
> **To use components:** set `data-*` attributes in HTML.  
> **Do not** edit any other CSS file.

---

## Theme Config Variables (`css/theme.config.css`)

All 18 variables in one place. Changing any value here propagates automatically
through every component and layout.

### Brand

| Variable | Default | Affects |
|---|---|---|
| `--cfg-brand` | `#4c6ef5` | Buttons, links, focus rings, active nav, progress |
| `--cfg-brand-hover` | `#4263eb` | Brand colour on `:hover` |
| `--cfg-brand-active` | `#3b5bdb` | Brand colour on `:active` |
| `--cfg-brand-subtle` | `#dbe4ff` | Light badge/alert tint backgrounds |
| `--cfg-brand-on` | `#ffffff` | Text on brand-coloured surfaces |

### Status Colours

| Variable | Default | Used in |
|---|---|---|
| `--cfg-success` | `#2f9e44` | Alert success, badge success, progress success |
| `--cfg-success-subtle` | `#ebfbee` | Alert/badge background tint |
| `--cfg-warning` | `#f08c00` | Alert warning, badge warning |
| `--cfg-warning-subtle` | `#fff9db` | Alert/badge background tint |
| `--cfg-danger` | `#e03131` | Alert danger, badge danger, input error |
| `--cfg-danger-subtle` | `#fff5f5` | Alert/badge background tint |
| `--cfg-info` | `#1098ad` | Alert info, badge info |
| `--cfg-info-subtle` | `#e3fafc` | Alert/badge background tint |

### Shape, Typography, Spacing, Motion

| Variable | Default | Affects | Range |
|---|---|---|---|
| `--cfg-radius` | `0.5rem` | ALL corner radii (scaled: sm=0.5×, md=1×, lg=1.5×, xl=2×, 2xl=3×) | `0` → `1.5rem` |
| `--cfg-font-sans` | `system-ui, …` | All body text | any CSS font stack |
| `--cfg-font-mono` | `ui-monospace, …` | Code blocks, `<pre>` | any CSS font stack |
| `--cfg-space-unit` | `0.25rem` | ALL gaps, padding, section spacing (space-N = N × unit) | `0.2rem`–`0.35rem` |
| `--cfg-motion-speed` | `200ms` | ALL transitions (fast=0.5×, normal=1×, slow=2×, slower=3×) | `0ms`–`500ms` |

---

## Component API

Variants and states are set with `data-*` attributes. No CSS class changes needed.

### `.c-button`

| Attribute | Values | Default |
|---|---|---|
| `data-variant` | `outline` · `ghost` · `danger` | _(brand/filled)_ |
| `data-size` | `sm` · `lg` · `xl` | _(md)_ |
| `disabled` | boolean | — |

```html
<button class="c-button">Primary</button>
<button class="c-button" data-variant="outline">Outline</button>
<button class="c-button" data-variant="ghost" data-size="sm">Small ghost</button>
<button class="c-button" data-variant="danger" data-size="lg">Delete</button>
```

### `.c-badge`

| Attribute | Values |
|---|---|
| `data-status` | `brand` · `success` · `warning` · `danger` · `info` |

```html
<span class="c-badge" data-status="success">Active</span>
```

### `.c-card`

| Attribute | Values |
|---|---|
| `data-variant` | `elevated` · `flat` · `outlined` |

Structure: `c-card__header` · `c-card__body` · `c-card__footer` (all optional).

```html
<article class="c-card" data-variant="outlined">
  <div class="c-card__header">Title</div>
  <div class="c-card__body">Content</div>
  <div class="c-card__footer">Footer</div>
</article>
```

### `.c-alert`

| Attribute | Values |
|---|---|
| `data-status` | `success` · `warning` · `danger` · `info` |
| `role` | `status` (polite) · `alert` (assertive) |

Structure: `c-alert__body` > `c-alert__title` + `c-alert__message`.

```html
<div class="c-alert" data-status="warning" role="alert">
  <div class="c-alert__body">
    <p class="c-alert__title">Warning</p>
    <p class="c-alert__message">Details here.</p>
  </div>
</div>
```

### `.c-input`

| Attribute | Values |
|---|---|
| `data-state` | `error` · `success` |

Structure: `c-input__label` · `c-input__field` · `c-input__hint` · `c-input__error`.

```html
<div class="c-input" data-state="error">
  <label class="c-input__label" for="x">Field</label>
  <input class="c-input__field" id="x" type="text" />
  <span class="c-input__error">Required.</span>
</div>
```

### `.c-avatar`

| Attribute | Values |
|---|---|
| `data-size` | `xs` · `sm` · `md` · `lg` · `xl` |
| `data-shape` | `square` |

```html
<div class="c-avatar" data-size="lg">AB</div>
```

### `.c-progress`

| Attribute | Values |
|---|---|
| `data-status` | `success` · `warning` · `danger` |

Structure: outer `.c-progress` + inner `.c-progress__bar` with inline `style="width:X%"`.

```html
<div class="c-progress" data-status="success" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
  <div class="c-progress__bar" style="width:100%"></div>
</div>
```

### `.c-spinner`

| Attribute | Values |
|---|---|
| `data-size` | `sm` · `lg` · `xl` |

```html
<div class="c-spinner" data-size="lg" role="status" aria-label="Loading"></div>
```

### `.c-nav`

| Attribute | Values |
|---|---|
| `data-orientation` | `vertical` |

Links: `.c-nav__link`. Active state: add `aria-current="page"` or `data-active`.

```html
<nav class="c-nav" data-orientation="vertical">
  <a class="c-nav__link" aria-current="page" href="#">Active</a>
  <a class="c-nav__link" href="#">Link</a>
</nav>
```

---

## Layout API

| Primitive | Class | Key attributes |
|---|---|---|
| Centred container | `.l-wrapper` | `data-width`: `sm` `md` `lg` `xl` `2xl` `full` |
| Vertical stack | `.l-stack` | `data-gap`: `xs` `sm` `md` `lg` `xl` |
| Inline wrapping group | `.l-cluster` | `data-gap`, `data-align`, `data-justify` |
| Responsive auto-grid | `.l-grid` | `data-min`: `sm` `md` `lg` `xl` · `data-gap` |
| Sidebar + content | `.l-sidebar` | `data-side`: `right` · children: `data-role="sidebar"` / `data-role="content"` |
| Full-height centred | `.l-cover` | `data-min-height`: `50vh` `75vh` `auto` · child: `data-role="principal"` |
| Aspect-ratio media | `.l-frame` | `data-ratio`: `1/1` `4/3` `16/9` `21/9` `3/2` |
| Horizontal→vertical | `.l-switcher` | `--switcher-threshold` (CSS variable on element) |
| Page section rhythm | `.l-region` | `data-padding`: `sm` `md` `lg` `xl` |

---

## Theme Toggle (HTML/JS)

```html
<html data-theme="light">   <!-- explicit light   -->
<html data-theme="dark">    <!-- explicit dark    -->
<html>                      <!-- follows OS pref  -->
```

```js
// Toggle between light and dark
document.documentElement.setAttribute(
  'data-theme',
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
);
```

---

## Common Recipes

### Change the brand colour to green
```css
/* css/theme.config.css */
--cfg-brand:        #2f9e44;
--cfg-brand-hover:  #276e33;
--cfg-brand-active: #1f5428;
--cfg-brand-subtle: #ebfbee;
--cfg-brand-on:     #ffffff;
```

### Make all corners sharp (no rounding)
```css
--cfg-radius: 0;
```

### Make all corners very round (pill-style)
```css
--cfg-radius: 1rem;
```

### Use a compact/dense layout
```css
--cfg-space-unit: 0.2rem;
```

### Remove all transitions (accessibility / reduced-motion)
```css
--cfg-motion-speed: 0ms;
```

### Use a custom font
```css
--cfg-font-sans: "Inter", system-ui, sans-serif;
```

### Change danger colour
```css
--cfg-danger:        #c0392b;
--cfg-danger-subtle: #fde8e6;
```

### Create a minimal "force dark" page section
```html
<section data-theme="dark" class="l-region">
  <!-- everything inside uses dark tokens -->
</section>
```
