# Implementation contract

Approved design: Verde Watch preview on 2026-09-08, original spacious margins and padding restored, every original font <=16 CSS px increased by 1 CSS pt (4/3px); cyan/violet/magenta glow, split nav hover scans, active perimeter runner, 3-node signal and header identity disc. Keep body text steady.

This npm workspace uses `packages/*` and `examples/*`. Root owns installation, lockfile, shared CSS/runtime/tokens, gallery, and validation. No agent should run npm install or edit root package.json/lockfile. Use TypeScript 6.0.3 (svelte-check currently excludes TypeScript 7).

## Shared core

Package `@neon-grid/kit-core` at packages/core (version 1.0.0):

- import `@neon-grid/kit-core/theme.css` once at application entry.
- `createThemeController(root: HTMLElement, options?: ThemeOptions): ThemeController` is safe to import on the server; call only after mounting. Options: `{glow?: 'balanced'|'subtle'|'off', motion?: boolean, focus?: boolean, paused?: boolean}`. Defaults balanced/true/false/false.
- controller methods: `update(partialOptions)`, `pulse(panelElement): boolean`, `destroy()`; `pulse` only activates a pre-rendered `[data-ng-arrival]` child when motion is allowed. It never stores call data or schedules periodic application updates.
- The controller owns `data-glow` (soft/off), `data-intensity` (balanced/subtle), `data-ambient` (running/stopped), `data-reading` (true/false) on root. Initial SSR attributes MUST be deterministic: soft, balanced, stopped, false (or derive glow/intensity/focus from props, always stopped).
- The root has `class="ng-theme"`; all CSS is scoped to it. Use one controller per root and destroy it on unmount. Do not initialize on documentElement. `ng:statechange` CustomEvent detail includes `ambient: 'running'|'stopped'`, `reason: string`, and current resolved options.
- `navMarkup(): string`, `signalMarkup(id: string): string`, `identityMarkup(id: string): string` return TRUSTED constant SVG decorations; ids must be a stable unique caller-provided string matching `[A-Za-z][A-Za-z0-9_-]*`. Use framework id APIs or explicit ids for SSR stability. IDs only prefix gradient ids; no application text interpolated. Safe to call on server.
- Decorations are aria-hidden with pointer-events none. Wrapping markup in `<span class="ng-decoration">` uses display:contents. `navMarkup()` includes nav-optics and nav-frame. Components render markup, controller never rewrites framework-owned children.

## CSS classes / reusable components

Use original approved classes within `.ng-theme`: sidebar, brand/brand-icon/brand-sub, workspace-label, nav-item selected, nav-content, sidebar-note/small-label/mini-timeline, sidebar-bottom/avatar, workspace, topbar/breadcrumb/demo-label, page-heading/eyebrow/title-outline/title-dot/heading-actions, button primary|secondary, overview-line/status-dot, toolbar/search/segmented/settings-button, channel-card/channel-header/channel-identity/channel-number/channel-actions/channel-status/text-link, transmissions/transmission/transmission-text/latest, channel-meta, page-footer. Preview controls may use preview-controls/preview-options/study-label/study-state.

Nav button/anchor: class nav-item, optional selected, `data-ng-nav`, aria-current="page" only if selected, content in `<span class="nav-content">`; append static navMarkup decoration. Keep labels fixed during hover.

Panel: `<article class="channel-card" style="--channel-color:#00e0ff" data-ng-panel>` containing arbitrary framework-rendered content plus `<span class="arrival-field" data-ng-arrival aria-hidden="true"></span>`.

Framework packages should export native reusable Theme, Button, NavItem, Panel, Signal, Identity components with framework-friendly props/slots/children. Theme offers a controller reference callback or context so app can explicitly pulse panels after new data. Avoid injecting the entire app as HTML.

## Examples

Build runnable examples showcasing identical brand/theme proportions, a left nav, signal ornament, large outline heading + identity disc, theme preferences, transcript panels. Use fictional text. Controls must work: add a sample line then call controller.pulse on its panel, toggle Focus, motion checkbox, glow select; nav selects a different view/panel. Stable ids include framework name.

For browser validation, add `data-ng-demo-add` to add button, `data-ng-focus` to Focus button, `data-ng-glow` to glow select, `data-ng-motion` to motion checkbox, `data-ng-panel` on at least the first panel. Root `.ng-theme` and `[data-ng-nav]` are standard hooks. Baseline at least one `.transmission-text`. Do not use network/CDN fonts or assets.

## Ownership

- React agent: packages/react, examples/react, examples/next (React 19.2.8, Next 16.3.4, Vite 8.2.2, plugin-react 6.1.1). Build/typecheck scripts and READMEs. Library builds to dist JS/declarations, retain use-client boundary for Next.
- Vue agent: packages/vue, examples/vue, examples/nuxt (Vue 3.5.42, Nuxt 4.5.2, Vite 8.2.2, plugin-vue 6.0.8, vue-tsc 3.3.11). SFC package exports; Nuxt registration plugin/layer if helpful; READMEs and typechecks.
- Svelte agent: packages/svelte, examples/svelte (Svelte 5.57.0, Vite 8.2.2, vite-plugin-svelte 7.3.0, svelte-check 4.7.6). Svelte 5 components with lifecycle cleanup, typed props, README/build/check.

Examples and packages depend on core via `"@neon-grid/kit-core":"1.0.0"`; npm workspaces resolves it locally. Adapters likewise 1.0.0. Examples should be private. Vite builds use `base:'./'` for relocatable static demos. Native SSR examples are built and run normally. Root dev server/validation scripts will be added separately.
