# Tailwind 4 bridge

`input.css` imports Tailwind, the scoped core styles, and the generated `@theme inline` bridge. The bridge maps approved tokens to `bg-ng-panel`, `text-ng-cyan`, `font-ng-mono`, `text-ng-12`, `p-ng-page-x`, and related utilities. Type labels identify the original pixel size; `text-ng-12` uses the approved 12px + 1pt value.

Run `npm run build --workspace @neon-grid/example-tailwind` from the kit root, then `npm run preview` and visit `/tailwind/`. Its `dist/` folder is self-contained with compiled CSS and local fonts. Wrap your application in `.ng-theme`; token variables are scoped there. Tailwind's preflight is intentionally global to this standalone example, while core CSS remains scoped.

For React, Vue, Svelte, or another Tailwind-enabled app, use the same three imports in your app's stylesheet. Runtime controls and decorative motion are optional; this example demonstrates the CSS utility bridge without JavaScript.
