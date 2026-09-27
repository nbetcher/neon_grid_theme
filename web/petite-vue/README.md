# Neon Grid — Web (CSS + petite-vue)

A self-contained, **static** showcase of the Neon Grid system on the web: deep blue-black grid
substrate, the full neon spectrum, glowing controls, Orbitron over Share Tech Mono, and a bespoke
**neon charting** layer. No backend — every page and widget renders fully populated on load.

## Demo
Open `index.html` directly (file://) or serve the folder. Six pages — Dashboard, **Analytics**,
Roadmap, Mission Control, History, Notifications — plus eight modals. Charts live on **Analytics**.

## What it is
A port of a TRON-styled petite-vue app whose tokens already equal the Neon Grid spectrum. It reuses
the internal class names (`tron-table`, `panel`, `live-pill`, …) and is driven entirely by CSS custom
properties in `styles.css`.

## Tokens
Spectrum, text, and `--glow-*` match [INDEX.md](../../INDEX.md) exactly. Substrate `#0A0A12 → #1C1C44`,
corners `6/8/12/20`. `--border-glow` is snapped to brand cyan `#00E0FF`.

## Charts (neon)
`charts.js` themes **Chart.js v4** (`chart.js@4.4.6`, CDN): transparent canvas, spectrum palette,
cyan/violet low-alpha grid-lines, Orbitron ticks, Share Tech Mono tooltips, per-series glow bloom
(`ctx.shadowBlur`), gradient area/bar fills. Five types: KPI sparkline tiles, opened-vs-resolved
line/area graph, severity doughnut, age histogram, subsystem bar. The vendor is isolated behind
`window.NGCharts`. Analytics charts present the full baked aggregates and are not filter-driven.

## Dependencies (CDN, pinned)
petite-vue 0.4.1 · Chart.js 4.4.6 · phosphor-icons 1.4.2 · animate.css 4.1.1 ·
Google Fonts Orbitron (300;400;600;700) + Share Tech Mono.

## Notes
- **No scanlines** (by design, every platform). The animated **grid** background is kept (`.grid-bg`).
- Static only: all data is baked into `data.js` (`window.NG_DATA`) — no fetch, no SSE. Clock pinned to
  `2026-07-20T17:42:00Z` for deterministic relative times.
- Boot: `defer` scripts load in order (Chart.js → data → charts → app → petite-vue), then
  `DOMContentLoaded` runs `PetiteVue.createApp().mount('#app')`; `@vue:mounted="init()"` hydrates state.
