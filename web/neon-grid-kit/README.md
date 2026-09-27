# Neon Grid Kit

The approved Neon Grid hybrid theme, packaged for reuse: cyan/violet/magenta light, report-style outline headings, steady reading text, futuristic navigation, an animated three-node signal and a quiet rotating identity disc.

**This version preserves the restored original margins and padding. Original font sizes of 12pt or less (16 CSS px) receive a net 1pt increase.** Larger type stays unchanged. The accepted preview is preserved in `reference/approved/`, with its source hashes in `packages/core/APPROVED-SOURCE.json`.

## Start

Use Node 22.19+, 24.11+, or 26+ in the supported major lines and npm. Node 26.4.0/npm 11.17.0 were used for validation. From this directory:

```sh
npm ci
npm run build
npm run preview
```

Open **http://127.0.0.1:4320/** in Microsoft Edge. The gallery serves static examples and starts Next on 4314 and Nuxt on 4315, all bound to localhost. Ctrl+C stops the preview and both child servers. `node scripts/preview.mjs --static-only` serves the static examples alone.

## Choose a template

| Stack | Reusable package | Working example |
|---|---|---|
| HTML/CSS/JavaScript | `packages/core` | `examples/vanilla` |
| React 19 | `packages/react` | `examples/react` |
| Next.js 16 App Router | React package with client boundary | `examples/next` |
| Vue 3 | `packages/vue` | `examples/vue` |
| Nuxt 4 | Vue package and optional registration plugin | `examples/nuxt` |
| Svelte 5 | `packages/svelte` | `examples/svelte` |
| Tailwind 4 | `packages/core/dist/tailwind.css` | `examples/tailwind` |
| Other CSS/Sass stacks | CSS variables, Sass values, DTCG JSON | Core exports below |

Each framework package documents its native props, slots/children, events and lifecycle. Components include Theme, Button, NavItem, Panel, Signal and Identity. Templates use fictional content; application data, routing, permissions, storage and actual call grouping remain application responsibilities.

## Reuse outside this workspace

The packages are local; they have not been published to a registry. After building, create tarballs:

```sh
npm pack --workspace @neon-grid/kit-core
npm pack --workspace @neon-grid/kit-react
npm pack --workspace @neon-grid/kit-vue
npm pack --workspace @neon-grid/kit-svelte
```

Install the core tarball and your selected adapter tarball together into the target app. The host supplies its framework peer dependencies. React ships compiled ESM/declarations, Vue ships typed SFC sources for the host compiler, and Svelte ships packaged components/declarations. Static `examples/*/dist` folders can be hosted directly; Next and Nuxt require their normal build/runtime deployment flows.

Import `@neon-grid/kit-core/theme.css` once and wrap the UI in the framework's `Theme` component or a `.ng-theme` element. Core CSS is scoped and does not reset the host's body. For a full-screen console, set `body { margin: 0 }`. The sidebar shell is a page layout; use the individual components when embedding a smaller widget.

## Portable theme source

`packages/core/tokens/neon-grid.tokens.json` follows the [DTCG 2025.10 format](https://www.designtokens.org/tr/2025.10/format/) and [color format](https://www.designtokens.org/tr/2025.10/color/). This exchanges design values; framework behavior still belongs in native components.

Generated exports:

- `@neon-grid/kit-core/theme.css`: complete scoped theme and local font faces.
- `@neon-grid/kit-core/tokens.css`: portable custom properties under `.ng-theme`.
- `@neon-grid/kit-core/tokens.json`: typed DTCG tokens.
- `@neon-grid/kit-core/tailwind.css`: Tailwind 4 utility bridge using [`@theme inline`](https://tailwindcss.com/docs/theme#referencing-other-variables).
- `@neon-grid/kit-core/scss`: generated Sass token values.

Edit JSON values and run `npm run build:core`, then rebuild consumers. Theme colors, small type, primary page/panel/control spacing and main headings consume the generated variables. Per-component responsive adjustments and detailed motion recipes remain in the approved CSS source plus `scripts/build-core.mjs`; they are not all represented as tokens. For one app, override `--ng-color-*`, `--ng-size-*`, or `--ng-space-*` on its theme root. Fonts are bundled locally with their licenses.

## Motion and reading

The controller supports balanced/subtle/off glow, motion on/off, Focus and paused states. It also stops ambient motion for device reduced-motion settings, forced colors, hidden pages and dialogs inside the theme. Keyboard focus remains visible. Text does not translate, shimmer or acquire glow. Arrival effects are explicit one-shot `controller.pulse(panel)` calls after your framework has committed new content; interrupted effects do not replay later.

Use one controller per root and destroy it on unmount. Adapters do this automatically, including React Strict Mode. Do not nest Theme roots: place independent themes in sibling containers. Native application state should never be written into decorative markup or the token file.

## Validation

```sh
npm run check
node examples/react/scripts/check-lifecycle.mjs
```

The main check verifies generated files, core invariants, all builds/typechecks, Svelte SSR, then real Edge controls and responsive layouts for the gallery and examples. Browser checks use the installed Microsoft Edge executable on Windows; update that executable path for another platform. They start and clean up only their own preview processes and require ports 4320/4314/4315 to be free.

Evidence is in `artifacts/browser-validation.json` and `artifacts/packaging-validation.json`; screenshots are alongside them. The React lifecycle check is documented in its example README. These are local template checks, not deployment or Verde Watch live-service qualification.

The existing `web/nuxt`, `web/petite-vue`, and `web/reports` directories remain intact. This kit is the approved hybrid edition, isolated in its own directory.
