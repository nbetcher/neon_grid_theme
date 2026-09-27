# petite-vue → Nuxt 4: the mapping

Everything in `web/petite-vue/` and where it went. This is the authoritative
"did we lose anything?" document for the port.

Source read: `styles.css` (1 549 lines, ~410 class selectors, 10 `@keyframes`), `index.html`
(109 kB, 6 pages + 8 modals), `charts.js`, `app.js`, `data.js`, `README.md`.

---

## 1. Mechanics

| petite-vue | Nuxt 4 |
|---|---|
| `v-scope="App()"` + `@vue:mounted="init()"` | `<script setup>` + `onMounted()` |
| `window.NG_DATA` (baked static data) | app-owned — Pinia store / `useFetch` against `/api/**`. The theme carries no data. |
| `:class="{active: page==='dashboard'}"` | identical syntax, no change |
| `@click="go('dashboard')"` + manual page state | `<NgNavButton to="/calls">` → `NuxtLink` + file routing |
| `<i class="ph-cpu">` (phosphor CDN CSS) | `<NgIcon name="ph:cpu">` → `@nuxt/icon` `mode:'svg'` + `@iconify-json/ph`, `clientBundle.scan` → **fully offline** |
| `animate.css` (one effect: `animate__fadeInRight` on toasts) | **dependency deleted** — `@keyframes toastIn` / `ngFadeInUp` in `90-motion.css` |
| `<details class="action-menu">` | `NgActionMenu` → Reka `DropdownMenu` (fixes a real a11y hole) |
| hand-rolled `.modal-backdrop` + `@click.self` | `NgModal` → Reka `Dialog` (focus trap, scroll lock, Esc, focus restore, `aria-modal`) |
| Chart.js UMD from CDN + `window.NGCharts` | `useNeonChart()` + `NgChart` — tree-shaken import |
| Google Fonts `<link>` | self-hosted `@font-face`, `npm run fonts` |
| `defer` script ordering (Chart → data → charts → app → petite-vue) | Vite module graph; the ordering problem disappears |
| clock pinned to `2026-07-20T17:42:00Z` for determinism | real clock. The showcase uses a seeded PRNG so its demo data is still deterministic. |
| six pages in one 109 kB `index.html` | app-owned `app/pages/*.vue` |
| `:root { ... }` hand-maintained | `shared/tokens.ts` → generated `10-tokens.css` |

---

## 2. Class → component map

Class names that carry meaning are **preserved verbatim**. The vocabulary is part of the system's
value; a component wrapping it does not rename it.

### Kept as-is, wrapped by a component

| petite-vue class | Nuxt component | Notes |
|---|---|---|
| `.grid-bg` | `NgGridBg` | + `--grid-size`/`--grid-alpha` tokens, + pause when tab hidden |
| `.app-wrapper` `.app-header` `.app-nav` `.app-main` `.header-*` | `NgAppShell` | + skip link, + `<NgSvgDefs>` |
| `.nav-btn` | `NgNavButton` | label wrapped in `.nav-label` for the 1010px breakpoint |
| `.auth-banner` | *(class only)* | + `.banner-danger` / `.banner-info` variants |
| `.panel` `.panel-header/-title/-sub/-arc/-grid` | `NgPanel`, `NgPanelGrid` | + `accent-*`, + opt-in `.defer` |
| `.stat-card` `.stat-label/-value/-icon` | `NgStatCard` | + `.positive` tone, + `.stat-foot` |
| `.kpi-tile` `.kpi-label/-value/-delta/-spark` | `NgKpiTile` | sparkline built in |
| `.chart-panel` `.chart-canvas-wrap` `.chart-span-2` `.analytics-grid` | `NgChartPanel` | |
| `.modal-backdrop` `.modal-content` `.modal-sm` `.modal-xl` `.mx-*` `.cockpit-modal` | `NgModal` | `.cockpit-modal` → `.modal-cockpit` |
| `.toast-container` `.toast` `.toast-*` | `NgToastHost` + `useNgToast()` | **+ ARIA live regions** (the source had none) |
| `.btn` `.btn-{primary,success,violet,warning,danger,ghost,sm,icon,toggle-on}` | `NgButton` | + `btn-lg`, `btn-block` |
| `.tron-input` `.tron-select` `.tron-textarea` `.form-group` `.form-label` | `NgInput` `NgSelect` `NgTextarea` | + `.form-hint` / `.form-error` + `aria-describedby` |
| `.action-menu` `.am-panel` | `NgActionMenu` | now `.am-item`/`.am-sep`/`.am-label`; the upward-open hack is gone (portalled) |
| `.badge` `.badge-*` `.badge-*-strong` | `NgBadge` | + `yellow`, `blue`, `info-strong`, `warning-strong` |
| `.chip` `.chip-label` `.chip-val` `.chip-row` | `NgChip` | **`.chip.badge-info` two-class hack deleted** — cascade layers |
| `.sev-chips` `.sev-chip.sev-*` | `NgSevChips` | + mandatory `.sr-only` + tooltip on every chip |
| `.live-pill` `.live-dot` `.flash` | `NgLivePill` | `flash()` exposed |
| `.status-pill` `.sp-*` | `NgStatusPill` | + `sp-err` |
| `.lifecycle-pill` `.lc-*` `.lc-strike` | `NgLifecyclePill` | **required by the AI-usage UI** |
| `.counter-pill` `.bugs-pill` `.blockers-pill` | `NgCounterPill` | one component, three tones |
| `.worker-chip` `.online/.retrying/.waiting/.needs-attn` | `NgWorkerChip` | + `offline` |
| `.tron-table` | `NgTable` | typed columns, `aria-sort`, sortable, `.compact`/`.mono` |
| `.dist-bar` `.seg.seg-*` `.dist-legend` `.legend-*` | `NgDistBar` | |
| `.hbar-row/-label/-track/-fill/-cnt` | `NgHBar` | |
| `.readiness-ring` `.rr-*` | `NgRing` | renamed generic; gradients moved to `NgSvgDefs` |
| `.timeline` `.tl-*` | `NgTimeline` | now an `<ol>` |
| `.comment` `.comment-*` | *(class only)* | |
| `.event-feed` `.event-row` `.event-*` `.fresh` | `NgEventFeed` | + `role="log"` polite live region |
| `.detail-grid` `.detail-field` `.df-*` | `NgDetailGrid` | now a `<dl>` |
| `.empty-state` | `NgEmptyState` | |
| `.loading-spinner` `.page-loader` | `NgSpinner` | |
| `.section-divider` `.mini-label` | `NgSectionDivider` | |
| `.filters-row` `.toolbar-*` `.tb-label` `.btn-row` | *(class only)* | |
| `.sr-only` `.tag-hex` | *(class only)* | |
| `.finding-section` `.sec-label` `.sec-text` `.resolution-block` | `.ng-section` + `.resolution-block` | domain-neutral rename |

### Renamed (domain leakage removed; old class kept as an alias where markup may be copied)

| petite-vue | Nuxt | Why |
|---|---|---|
| `.issue-row` `.issue-list` `.issue-head` `.issue-body` | `.ng-record-row` / `-list` / `-head` / `-body` → `NgRecordRow` | "issue" is the previous app's domain. Old classes still resolve. |
| `.agent-card` `.agent-*` | `.ng-source-card` `.ng-source-*` → `NgSourceCard` | Repurposed for ingest-source health — "which sources are dark". |
| `.agent-prog-*` `.ppl-track/-fill/-pct` `.ws-prog-*` `.phase-prog-*` | `.ng-prog-track` / `-fill` / `-pct` | Four near-identical progress tracks collapsed into one. |
| `.pr-dep` `.pr-overlap` `.pr-trace` `.ls-conn` `.ls-trace` | `.ng-conn` `.ng-conn-dashed` `.ng-trace` | Generic light-cycle connectors, no roadmap semantics. |
| `.pr-agent-ping` | `.ng-ping` | |
| `.pr-key` `.pr-name` `.ls-node-label` | `.ng-svg-key` `.ng-svg-label` | |
| `.phase-rail-wrap` `.phase-rail` `.rail-legend` | `.ng-rail-wrap` `.ng-rail` `.ng-rail-legend` | |
| `.cockpit-modal` | `.modal-cockpit` | consistent with `.modal-sm`/`.modal-xl` |

### Kept because the portal needs them — do not drop

The "AI cockpit" block in the source maps almost one-to-one onto the brief's required rich AI-usage
interface (*which items were sent, why, the estimated cost of each call, and a full viewer for the
session logs*). That is finished design work.

| Class | Component | Job in this system |
|---|---|---|
| `.cost-gauge` `.cg-arc-track/-cache/-fill` `.cg-stats/-cost/-sub` | `NgCostGauge` | spend vs cap, **with the separate violet cache-hit segment** |
| `.convo-row` `.cr-text/-think/-tool/-result` `.cr-role` `.cc-rows` `.cc-head` `.convo-input` `.convo-empty` `.convo-toggle-btn` `.convo-drawer` `.cockpit-body/-hud/-convo` | `NgConvoLog` | the session-log viewer |
| `.glyph-ticker` `.glyph` `.gl-ok/-err/-pending/-new` `.gt-lead` | `NgGlyphTicker` | tool-call ticker |
| `.approval-pill` `.ap-cmd` | `NgApprovalPill` | the "this is about to leave the machine" gate, + a `hard` variant for router refusals |
| `.lifecycle-pill` `.lc-*` | `NgLifecyclePill` | escalation stage |
| `.plan-card` `.plan-steps/-step/-conn/-files` `.ps-n` `.pc-risk` | `NgPlanCard` | what is about to happen, before it happens |
| `.triad` `.triad-chip` `.tc-*` | `NgTriad` | generic 3-state pipeline stages |
| `.activity-ticker` `.at-*` | `NgActivityTicker` | |
| `.hud-sec` `.hud-sec-label` `.hud-pill-row` | *(class only)* | |
| `.fc-chip` `.ix-chip` | *(class only)* | |

### Deliberately dropped

Domain-specific to the previous application (an AI code-review / build tracker). None of it describes
anything in a radio-monitoring console, and keeping it would mean carrying ~90 dead selectors.

| Dropped | What it was |
|---|---|
| `.phase-rail` `.pr-node-rect` `.pr-agent-disc` `.pr-agent-text` | the SVG roadmap map of build phases *(the generic connector/tracer/ping styling survives as `.ng-conn` / `.ng-trace` / `.ng-ping`)* |
| `.phase-panel` `.phase-head/-badge/-id-col/-titles/-name/-tagline/-prog-*/-meta-col/-caret/-body/-goal/-cols` `.phase-status-chip` | roadmap phase accordions |
| `.readiness` `.phase-progress-list` `.ppl-*` | the production-readiness hero *(the ring survives as `NgRing`)* |
| `.ws-list` `.ws-row` `.ws-agent` `.ws-main/-name/-desc/-prog/-now` `.a-dot` | "workstreams owned by one AI" |
| `.mission-list` `.mission-card` `.ms-*` `.mission-head/-key/-title/-model/-body/-meta-grid/-items/-actions` `.mission-item-row` `.mi-reason` | missions |
| `.lifecycle-stepper` `.ls-node-rect` `.ls-node-label` `.stepper-wrap` | the 6-node lifecycle stepper *(its connector styling survives)* |
| `.queue-toolbar` `.queue-pos` `.queue-row` `.dispatch-meta` `.dispatch-note` `.react-medium/-high/-extra/-ultra` | the sprint queue and reasoning-level display |
| `.hist-item` `.hist-slug/-title/-ref` | the history page's compact rows *(use `NgEventFeed` or `NgTable`)* |
| `.finding-slug` `.finding-actions` `.agent-finding` `.issue-slug` (as *finding* semantics) | code-review findings *(`.issue-slug` itself is kept as a generic record identifier)* |
| `.exit-item` `.interaction-chips` | phase exit criteria |
| `.mx-*` (partially) | kept for `NgModal size="xl"`; the roadmap-specific rail cards are gone |
| `.status-control-row` | |
| **scanlines** | never existed. Verified line by line. Do not add them. |

---

## 3. Behavioural fixes made during the port

Not cosmetic. Each of these was a real defect in the source.

1. **`html { font-size: 14px }` → `87.5%`.** A hard pixel root size overrides the user's browser
   font-size preference (WCAG 1.4.4). Visually identical at default settings.
2. **Focus was indicated only by a glow.** `box-shadow: var(--glow-cyan)` disappears under
   `[data-glow=off]`, `prefers-contrast: more` and `forced-colors` — exactly the modes where a keyboard
   user most needs it. `:focus-visible { outline: 2px solid var(--cyan) }` is now the base; the glow is
   decoration on top.
3. **`.toast-container` had no ARIA live region.** A screen reader never announced an alert. In an
   alerting system that is a functional bug. Now two regions: assertive for errors, polite for
   everything else.
4. **`.action-menu` was `<details>/<summary>` styled as a menu.** No `role="menu"`, no arrow keys, no
   Esc, no focus return. Now Reka `DropdownMenu`.
5. **`--text-dim` at 3.98:1 was used for every visible label.** Split into `--text-dim` (decorative)
   and `--text-label` (5.13:1).
6. **`--violet` at 3.87:1 was used as glyph colour** for `.finding-slug`/`.issue-slug`/`.agent-finding`.
   `--violet-text` `#b794ff` (7.69:1) — a value the theme already used inline for `.btn-violet`.
7. **The `.chip.badge-info` specificity hack.** Deleted by cascade layers.
8. **The 20 s infinite `gridShift`** ran in background tabs forever. Now paused on
   `visibilitychange`, and off entirely under `prefers-reduced-motion`.
9. **Reduced motion removed information.** `.event-row.fresh` and `.live-pill.on .live-dot` now get
   static replacements (outline / ring) rather than nothing, and the spinner is slowed rather than
   frozen — a frozen spinner reads as a hung app.
10. **Orbitron weight 300 was requested and does not exist** (axis is 400–900). Dropped.

## 4. Things the source got right that the port preserves exactly

Worth naming so nobody "cleans them up":

- **The doughnut bloom takes `backgroundColor`, not `borderColor`.** The border is the dark gap.
- **`chart.update('none')` on construction** so gradient fills paint on frame one.
- **`drop-shadow` (not `text-shadow`) on gradient-clipped numerals.**
- **The `.dist-bar` outer glow lives on the container**, because `overflow: hidden` clips per-segment
  shadows; the segments carry an inset white sheen instead.
- **`.hbar-track` / `.ppl-track` are `overflow: visible`** so the fill's bloom spills past the edge.
- **The `#tronGlow` filter merges `SourceGraphic` last.** Without that node, neon looks like fog.
- **Glow ramps are not uniform**: cyan and green run hotter (`.6/.32/.14`, `.6/.3/.13`, third stop at
  38px) than the rest (`.55/.28/.12`, 36px). Preserved byte-for-byte rather than smoothed.
- **`.lifecycle-pill.lc-strike` kills glow AND pulse with `!important`.** A dead item must not read as
  a live one.
