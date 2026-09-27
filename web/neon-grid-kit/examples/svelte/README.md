# Svelte 5 example

This Vite application renders the approved Neon Grid theme using native Svelte components, typed props, snippets, and runes. All sample traffic is fictional and stays in memory for this visit. No account, network service, or audio is used.

Run these commands from the kit root after its dependency installation:

```sh
npm run build --workspace @neon-grid/kit-core
npm run build --workspace @neon-grid/kit-svelte
npm run dev --workspace @neon-grid/example-svelte
```

Check and build:

```sh
npm run check --workspace @neon-grid/kit-svelte
npm run check --workspace @neon-grid/example-svelte
npm run check:ssr --workspace @neon-grid/example-svelte
npm run build --workspace @neon-grid/example-svelte
npm run preview --workspace @neon-grid/example-svelte
```

The Vite build writes a relocatable static application to `dist` using `base: './'`. Serve it over HTTP. Font assets are bundled locally through the core stylesheet.

Try the left menu, Focus mode, glow select, and animation checkbox. **Add demo call** appends a transmission and pulses the receiving panel after Svelte renders it. **Pause view** queues samples; **Resume view** or **Catch up** applies them. The archive shows the session's full fictional history. Switching views does not replay arrival effects. The live example shows the latest three transmissions to demonstrate layout; it does not implement Verde Watch's production look-back heuristics.

`src/App.svelte` is the application. `src/SSRProbe.svelte` is a separate validation fixture and is not included in the client entry. Its check renders multiple theme/decorative instances without a DOM and verifies deterministic HTML, initial stopped motion, preference propagation, and unique linked SVG IDs. Browser behavior is checked by the kit's shared validation harness.

The package's [README](../../packages/svelte/README.md) documents reusable component props and SSR lifecycle details.
