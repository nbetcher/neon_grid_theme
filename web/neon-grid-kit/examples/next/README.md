# Next.js starter

A Next App Router starter with a server-rendered page and a native React client component for interactive state. From the kit root, after `npm ci`:

```sh
npm run build:core
npm run build --workspace @neon-grid/kit-react
npm run dev --workspace @neon-grid/example-next
```

Open `http://127.0.0.1:4314` in Microsoft Edge. For a production check:

```sh
npm run build --workspace @neon-grid/example-next
npm run start --workspace @neon-grid/example-next
```

`app/layout.tsx` imports the theme once and supplies metadata. `app/page.tsx` is a Server Component; `app/console.tsx` is the client boundary that owns preferences and fictional call state. The React package preserves its own `use client` directive in its compiled ESM. No controller reads the browser during import or server render; it starts in an effect after hydration and is destroyed on unmount.

`next.config.ts` explicitly sets the kit workspace as the Turbopack root and transpiles the local theme packages. Move that root when extracting the example into another directory. Keep the shared core CSS and native React adapter installed together; the browser needs no remote assets or fonts.

Add demo call, Focus, glow, animated accents, view navigation, and search all work with local state. Live view shows the last three sample calls; archive retains the last twelve in memory. This is a theme starter, not a production call service or an implementation of the heuristic look-back. The console source is intentionally self-contained here so it can be copied without depending on the sibling Vite example.
