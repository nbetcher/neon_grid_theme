# Vue + Vite starter

This is a working Vue 3 application using `@neon-grid/kit-vue`. Copy the structure for your own console and replace the fictional data in `src/App.vue` with your application state. All rendering is native Vue. The theme owns only presentation and decorative motion.

From the kit root, after installing dependencies:

```sh
npm run dev --workspace @neon-grid/example-vue
npm run check --workspace @neon-grid/example-vue
npm run build --workspace @neon-grid/example-vue
npm run preview --workspace @neon-grid/example-vue
```

Vite uses a relative asset base so `dist/` can be hosted below any static directory. Serve it over HTTP; direct `file://` module loading is blocked by browsers. The shared stylesheet bundles local fonts without a CDN.

Try the left navigation, channel search, Add demo call, Reset demo, Glow, Animated accents, and Focus mode. An added call updates Vue state first, then triggers the panel accent after `nextTick`. The live sample retains three visible lines; the archive retains up to 20 per channel. These are clearly labeled demo limits, not a production implementation of time-based conversations.

Copying this example alone also requires both local kit packages (or your own installed package equivalents). Keep the root lockfile for the exact validated Vue/Vite versions. See `packages/vue/README.md` for reusable component APIs and Nuxt integration.
