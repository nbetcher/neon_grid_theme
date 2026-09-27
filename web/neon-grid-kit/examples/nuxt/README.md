# Nuxt SSR starter

This Nuxt 4 application uses the same Vue component package and approved Neon Grid theme as the Vite starter. Its initial markup is server rendered. Decorative SVG IDs are stable, and motion starts only after the theme mounts in the browser.

From the kit root, after installing dependencies:

```sh
npm run dev --workspace @neon-grid/example-nuxt
npm run check --workspace @neon-grid/example-nuxt
npm run build --workspace @neon-grid/example-nuxt
npm run start --workspace @neon-grid/example-nuxt
```

The production server defaults to Nuxt's HTTP port; set `NITRO_PORT` if another example is using it. Bind a locally viewed preview with `NITRO_HOST=127.0.0.1` using your shell's environment-variable syntax. The production output is `.output/` and requires a Node server. It is not a static `dist/` directory.

`nuxt.config.ts` loads the shared CSS and includes the source SFC package in transpilation. The universal `app/plugins/neon-grid.ts` demonstrates optional global component registration. `app/app.vue` also imports components explicitly so the example can be copied into applications that prefer local imports. No `ClientOnly` wrapper is needed.

Add demo call, Reset demo, navigation, search, glow, motion, and focus controls all work without a backend. This fixture keeps the latest three lines in its live view and at most 20 per channel in its archive; connect real call data and application-owned look-back rules separately. Nothing is persisted or fetched. Reuse the package, stylesheet, and lifecycle integration when replacing the fixture.

See `packages/vue/README.md` for the component API, SSR lifecycle, and ID requirements. Copying this starter requires both local kit packages or installed equivalents.
