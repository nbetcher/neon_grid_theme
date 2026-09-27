# Neon Grid — Nuxt 4 layer

A **neon design system** inspired by a certain 80's film with "The Grid": a deep blue-black substrate
lit by a full spectrum of neon — fuchsia, green, orange, cyan, blue, violet, red, yellow. Glowing
strokes, gradient hairlines, letter-spaced display type over terminal mono.

> **Grid: yes. Scanlines: intentionally omitted** — on every platform. This is a standing design
> decision, not an oversight. There is no scanline rule anywhere in this layer and none is to be added.

This is the **web/Nuxt** implementation, derived from [`../petite-vue`](../petite-vue/). It ships as a
**Nuxt layer**, so an app extends it rather than copying it.

---

## Install

```bash
cd D:/Documents/Projects/neon_grid_theme/web/nuxt
npm install
npm run fonts       # one-off: downloads the two self-hosted woff2 faces
npm run dev         # playground at http://localhost:3000 — renders every component
```

## Use it from an app

```ts
// verde-watch-portal/nuxt.config.ts
export default defineNuxtConfig({
  extends: ['../../neon_grid_theme/web/nuxt'],   // or '@neon-grid/nuxt' once published
  ssr: false,
})
```

That is the whole integration. You now have:

- every `Ng*` component auto-imported (Nuxt auto-scans a layer's `app/components/`);
- `useNeonTokens()`, `useGlowLevel()`, `useNeonChart()`, `useNgToast()` auto-imported;
- the full CSS loaded, in cascade-layer order, ahead of your own;
- `#neon-grid/shared/tokens` importable from app code **and** Nitro handlers;
- `@nuxt/icon` configured for a fully offline `ph:*` icon bundle.

```vue
<template>
  <NgAppShell title="Verde Watch" chip="Cottonwood · Camp Verde">
    <template #nav>
      <NgNavButton to="/" icon="ph:squares-four" label="Dashboard" />
      <NgNavButton to="/calls" icon="ph:radio" label="Calls" />
    </template>
    <template #header-right>
      <NgLivePill state="on" />
      <NgGlowControl compact />
    </template>

    <NgPanel title="Recent matches" icon="ph:target">
      <NgTable :columns="cols" :rows="rows" />
    </NgPanel>
  </NgAppShell>
</template>
```

---

## What is in the box

```
web/nuxt/
├─ nuxt.config.ts              layer config — fully-resolved paths (see "the #1 layer bug")
├─ package.json                main: ./nuxt.config.ts
├─ tsconfig.json
├─ shared/tokens.ts            ★ SINGLE SOURCE OF TRUTH
├─ scripts/
│  ├─ gen-tokens-css.mjs       tokens.ts → 10-tokens.css   (`npm run tokens`)
│  └─ fetch-fonts.mjs          self-hosts Orbitron + Share Tech Mono
├─ public/fonts/               (git-ignored; populated by `npm run fonts`)
├─ playground/                 a real app that `extends: ['..']`
└─ app/
   ├─ assets/css/              index.css + 14 partials, one cascade layer each
   ├─ components/              51 Ng* components
   ├─ composables/             4
   └─ plugins/ng-glow.client.ts
```

### CSS, in cascade-layer order

| File | Layer | Contents |
|---|---|---|
| `00-reset.css` | `neon.reset` | box-sizing, margin/padding, media, control font inheritance |
| `05-fonts.css` | *(none — deliberate)* | `@font-face` × 2. Font registration is not a cascade concern |
| `10-tokens.css` | `neon.tokens` | **GENERATED.** Every custom property + all three glow sets + high contrast |
| `20-base.css` | `neon.base` | html/body, focus, scrollbar, `.sr-only`, `.tag-hex`, `.ng-transcript` |
| `30-substrate.css` | `neon.substrate` | `.grid-bg` + `gridShift` + vignette |
| `40-layout.css` | `neon.layout` | `.app-wrapper/-header/-nav/-main`, `.header-*`, `.auth-banner`, breakpoints |
| `50-surfaces.css` | `neon.surfaces` | `.panel*`, `.stat-card`, `.kpi-tile`, `.chart-panel`, `.modal*`, `.toast*` |
| `60-controls.css` | `neon.controls` | `.btn*`, `.tron-input/select/textarea`, `.form-*`, `.am-*`, tabs, tooltip, switch, slider |
| `70-indicators.css` | `neon.indicators` | `.chip*`, `.badge*`, `.sev-chip*`, `.live-pill`, `.status-pill`, `.lifecycle-pill`, counters |
| `80-data.css` | `neon.data` | `.tron-table`, `.dist-bar`, `.hbar-*`, `.ng-ring`, `.timeline`, `.event-feed`, `.ng-source-card` |
| `85-cockpit.css` | `neon.cockpit` | `.cost-gauge`, `.convo-*`, `.glyph-ticker`, `.approval-pill`, `.plan-card`, `.triad-chip` |
| `88-charts.css` | `neon.charts` | `#tronGlow` consumers, `.ng-conn/.ng-trace/.ng-ping`, SVG rails |
| `90-motion.css` | `neon.motion` | **every** `@keyframes` + `prefers-reduced-motion` |
| `95-a11y.css` | `neon.a11y` | glyph-glow list, `prefers-contrast`, `prefers-reduced-transparency`, `forced-colors`, idle dim, print |

**Why cascade layers.** Your app's CSS is unlayered, and unlayered styles beat every layer. Overriding
`.panel` in Verde Watch takes one flat class — no specificity war, no `!important`. It also deleted the
one specificity hack in the source: `.chip.badge-info` existed only because `.chip` was declared after
`.badge-info`. Badges now live after chips in `neon.indicators` and simply win.

---

## Tokens

`shared/tokens.ts` is the only place a hex is written. `app/assets/css/10-tokens.css` is a build
artefact of it:

```bash
npm run tokens          # regenerate
npm run tokens:check    # exits 1 if stale — run this in CI / pre-commit
```

Before this port, `#00E0FF` was hand-written in five places (`styles.css`, `charts.js`, `INDEX.md`, the
Android theme, the LVGL theme). The Nuxt port would have made it seven (a MapLibre style, an ECharts
theme). One edit now changes every web surface.

**Convention: uppercase hex in TS, lowercase in CSS.** The generator lowercases on the way out.

### The spectrum

| Token | CSS var | Hex | Role |
|---|---|---|---|
| cyan | `--cyan` | `#00E0FF` | brand / primary |
| green | `--green` | `#00FF95` | positive / secondary |
| fuchsia | `--magenta` (alias `--fuchsia`) | `#FF2DAA` | tertiary |
| orange | `--orange` | `#FF9500` | action / accent |
| blue | `--blue` | `#1F9BFF` | metric gradients |
| violet | `--violet` | `#8A45FF` | brand gradients |
| red | `--red` | `#FF3B5C` | danger / error |
| yellow | `--yellow` | `#FFE11A` | caution |

Substrate `#0A0A12 → #0D0D1A → #111125 → #161638 → #0E0E20 → #1C1C44`.
Text `#EAF0FB` / `#9FB0D6` / `#62749C`. Corners `6 / 8 / 12 / 20`.

### Three glow mechanisms — they are not interchangeable

1. **`box-shadow`** — the `--glow-*` tokens. Borders and containers.
2. **`text-shadow: var(--glyph-glow)`** — glyphs. This is the one that costs legibility, so it is
   gated separately from (1).
3. **`filter: drop-shadow()` / `filter: url(#tronGlow)`** — gradient-clipped text (`.stat-value`,
   `.kpi-value`) and SVG strokes. `text-shadow` renders *behind* `-webkit-text-fill-color: transparent`
   glyphs, so it produces a solid blob rather than a halo. Using the wrong one here is the single most
   common way this theme gets ported badly.

Canvas is a fourth case with no CSS at all: Chart.js bloom is `ctx.shadowBlur`, applied in
`useNeonChart()` and multiplied by the live `--chart-glow-scale` token.

### Two token additions for contrast

Nothing in the spectrum changed. Two literals that already existed inline were promoted to tokens, and
one label colour was added, because small text needs 4.5:1:

| | On `--bg-panel` | Use |
|---|---|---|
| `--text-dim` `#62749c` | **3.98** | dividers, disabled, placeholder — decorative only |
| `--text-label` `#7d8cb5` | **5.56** | every visible label/caption |
| `--violet` `#8a45ff` | **3.87** | strokes, borders, gradients (clears the 3:1 non-text bar) |
| `--violet-text` `#b794ff` | **7.69** | any violet glyph |

The showcase renders this table live from the token module, so a regression is visible immediately.

---

## Reduced glow / high contrast

Three levels on `<html data-glow>`, **defaulting to `soft`**:

| | box-shadow | glyph text-shadow | grid alpha | chart bloom |
|---|---|---|---|---|
| `full` | shipped 3-stop ramps | `0 0 6px` | 0.05 | ×1 |
| `soft` **(default)** | radii ×0.7, alphas ×0.55, 2 stops | `0 0 3px` | 0.035 | ×0.6 |
| `off` | `none` | `none` | 0.02 | ×0 |

Plus `<html data-contrast="high">`, which also forces glow off, thickens container borders to 2px, and
flattens the gradient-clipped numerals. `@media (prefers-contrast: more)` applies the same set unless
the user has explicitly chosen `normal`.

**Why this exists.** The `text-shadow: 0 0 6px currentColor` in the source is a *same-hue* glow — the
shadow is closer to the foreground than to the background, so it blurs the glyph edge, spending
measured contrast to buy apparent brightness. On a `#0a0a12` substrate with saturated `#00e0ff` glyphs
that is the textbook setup for halation, and roughly half the population has some degree of astigmatism
that dark-mode pupil dilation amplifies. For a console someone stares at for hours this is the dominant
long-session risk in the design.

**The fix is not to remove the glow — the glow is the design.** It is to make it a control, default it
to `soft`, and gate the glyph halo separately from the panel bloom, because the panel bloom is what
carries the look.

Ship `<NgGlowControl />` (compact form in the header, full form in settings). State is persisted to
`localStorage` and re-applied **pre-paint** by an inline head script declared in `nuxt.config.ts` — a
Nuxt plugin runs after first paint, which on a page of glowing panels produces a visible snap.

Also honoured: `prefers-reduced-motion` (signal-bearing animations get static replacements, never
removal — see `90-motion.css`), `prefers-reduced-transparency`, `forced-colors` (relevant: this is a
Windows box), and `print`.

---

## Components

51 components, all `Ng`-prefixed, all auto-imported. Every one of them renders on the showcase page.

### Shell & substrate
`NgAppShell` · `NgGridBg` · `NgSvgDefs` · `NgNavButton` · `NgIcon`

> **`NgSvgDefs` must be mounted once.** `filter: url(#tronGlow)` resolves against the *document*. If it
> is missing, `.cg-arc-fill`, `.ng-conn` and `.ng-trace` render unglowed and nothing errors.
> `NgAppShell` mounts it for you.

### Surfaces
`NgPanel` · `NgPanelGrid` · `NgStatCard` · `NgKpiTile` · `NgChartPanel` · `NgModal` · `NgToastHost`

### Controls
`NgButton` · `NgInput` · `NgSelect` · `NgTextarea` · `NgActionMenu` · `NgTabs` · `NgTooltip` ·
`NgSwitch` · `NgSlider` · `NgGlowControl`

### Indicators
`NgBadge` · `NgChip` · `NgSevChips` · `NgLivePill` · `NgStatusPill` · `NgLifecyclePill` ·
`NgCounterPill` · `NgWorkerChip` · `NgSectionDivider`

### Data
`NgTable` · `NgDistBar` · `NgHBar` · `NgRing` · `NgTimeline` · `NgEventFeed` · `NgDetailGrid` ·
`NgRecordRow` · `NgSourceCard` · `NgEmptyState` · `NgSpinner`

### AI cockpit — required by the portal's AI-usage UI
`NgCostGauge` · `NgConvoLog` · `NgGlyphTicker` · `NgApprovalPill` · `NgPlanCard` · `NgTriad` ·
`NgActivityTicker`

### Charts
`NgChart` · `NgShowcase`

Full component ↔ class ↔ petite-vue mapping: [`MIGRATION.md`](./MIGRATION.md).

---

## Charts

`useNeonChart()` is a faithful port of `web/petite-vue/charts.js`, as a composable rather than a
`window.NGCharts` global. Chart.js 4.5.1, tree-shaken registration, five builders:

```ts
const { sparklineConfig, lineAreaConfig, doughnutConfig, histogramConfig, barConfig } = useNeonChart()
```

```vue
<NgChartPanel title="Calls by talkgroup" :config="barConfig(rows, { horizontal: true })" />
```

Two details from the original are load-bearing and preserved verbatim:

- **The doughnut bloom takes its colour from `backgroundColor`, not `borderColor`.** A doughnut's
  border is the dark 3px gap between arcs; blooming that gives a muddy black halo.
- **`chart.update('none')` immediately after construction.** Gradient fills are built lazily from
  `chart.chartArea`, which is `undefined` on the first draw. `NgChart` does this for you.

`chartjs-plugin-streaming` is **not** used — last published 2021-06-19, unmaintained against Chart.js
4.x. For a live strip, `useNeonChart().makeStripPusher(chart)` drives it by hand at ≤ 2 Hz.

---

## Fonts

Self-hosted, never CDN. This runs on a LAN-bound box that must work when the internet does not; a
`fonts.googleapis.com` link is a silent failure mode that makes the whole design read as broken.

```bash
npm run fonts        # downloads into public/fonts/ (~20 kB total)
npm run fonts:check  # exits 1 if a face is missing
```

- **Orbitron** — one **variable** woff2, weight axis `400 900`. Google serves a single file for every
  weight; four separate downloads are unnecessary.
- **Share Tech Mono** — one static woff2, weight 400. The family has no bold and the theme never asks.

> The petite-vue `<link>` requested `Orbitron:wght@300`. Orbitron's axis starts at **400** — 300 was
> clamped by every browser and no rule in `styles.css` ever used it. The port drops it.

If the binaries are missing nothing breaks: `--font-display` and `--font-mono` carry real fallback
stacks (`Rajdhani → ui-sans-serif → system-ui`, `ui-monospace → Cascadia Mono → Consolas`).

`@nuxt/fonts` is deliberately **not** used — five hand-written `@font-face` rules are fully
predictable and add zero module surface. See ADR-186.

---

## Deliberate non-adoptions

| Not used | Why |
|---|---|
| **Tailwind CSS** | The design system is ~410 hand-written class names driven by ~50 custom properties. Adding Tailwind means installing an entire opinionated system in order to override it. |
| **Nuxt UI v4** | Hard Tailwind v4 dependency. It is built on Reka UI, so choosing Reka directly is the same accessibility engine one level down, without the Tailwind layer. |
| **PrimeVue unstyled** | Styling decisions would live in JS `pt` objects at call sites rather than in one token file. Wrong shape for a system whose value proposition *is* the token file. |
| **`@nuxtjs/color-mode`** | Dark-only by design. Light-mode plumbing you will never ship is dead weight. |
| **`animate.css`** | Used for exactly one effect in the source. `@keyframes toastIn` / `ngFadeInUp` already do it. |
| **`chartjs-plugin-streaming`** | Abandoned (2021). |
| **Scanlines** | Standing design decision, every platform. |

---

## Known constraints

- **`content-visibility: auto` is opt-in** (`<NgPanel defer>`), not default. It breaks
  `position: sticky` table headers inside the panel and can cause scroll-anchor jumps. Never put it on
  a panel containing `NgTable`.
- **The 42px grid can moiré** at 125 %/150 % Windows display scaling. Test at 100/125/150; if it
  shimmers, pass `<NgGridBg size="48px">` or change `GRID.size` in the token module.
- **`NgTable` is not virtualised.** Above ~2 000 rows the right answer is keyset pagination with the
  filter in SQL, not more rows in the browser. A virtualised variant changes the DOM contract (no real
  `<tbody>` rows, no Ctrl+F, no native selection) and belongs in the app, not the theme.
- **Vite `server.fs.allow`.** A layer outside the app root occasionally needs its directory added.
  Nuxt normally handles this for `extends` entries; if you see a 403 for a layer asset in dev, add the
  layer path to `vite.server.fs.allow`.

---

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | playground dev server |
| `npm run build` | builds the playground (smoke test for the layer) |
| `npm run typecheck` | `nuxi typecheck playground` — the layer alone has no `.nuxt` |
| `npm run tokens` | regenerate `10-tokens.css` from `shared/tokens.ts` |
| `npm run tokens:check` | fail if it is stale — wire into CI |
| `npm run fonts` | download the self-hosted woff2 faces |
| `npm run fonts:check` | fail if a face is missing |

## Versions

Verified against the npm registry on 2026-08-17.

| Package | Pinned | Note |
|---|---|---|
| `nuxt` | 4.5.2 | Nuxt 3 went EOL 2026-08-05 |
| `vue` | 3.5.41 | peer |
| `reka-ui` | 2.10.3 | headless, ships zero CSS |
| `chart.js` | 4.5.1 | |
| `@nuxt/icon` | 2.5.0 | `mode: 'svg'`, `clientBundle.scan` |
| `@iconify-json/ph` | 1.2.2 | offline `ph:*` |
| `typescript` | 6.0.3 | matches what Nuxt 4.5.2 builds against |

The layer does **not** pin `nitropack`, set `ssr`, or configure TLS — those belong to the consuming
app. (Verde Watch pins `nitropack@2.13.4` and sets `ssr: false`; see its portal architecture doc.)
