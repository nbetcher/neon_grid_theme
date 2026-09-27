/**
 * Neon Grid — Nuxt 4 LAYER config.
 *
 * A consuming app does:
 *
 *   export default defineNuxtConfig({
 *     extends: ['../../neon_grid_theme/web/nuxt'],   // or '@neon-grid/nuxt'
 *   })
 *
 * and gets tokens, CSS, components and composables with zero imports.
 *
 * ── THE #1 LAYER BUG ─────────────────────────────────────────────────────────
 * Nuxt docs, "Authoring Nuxt Layers": path aliases (`~/`, `@/`) inside a LAYER's
 * nuxt.config resolve relative to the **consuming project**, not the layer. A
 * `css: ['~/assets/css/index.css']` here works in this repo's own playground and
 * silently does nothing in Verde Watch. Every path below is fully resolved from
 * `import.meta.url`.
 *
 * ── WHAT IS DELIBERATELY *NOT* CONFIGURED ────────────────────────────────────
 * - `components`: Nuxt auto-scans every layer's `app/components/` already. Adding
 *   an explicit dirs entry risks fighting the consumer's own `components` config
 *   during layer merge, for zero gain. Files are named `Ng*.vue`, so no prefix is
 *   needed either.
 * - `ssr`, `nitro`, `devServer`, TLS: those belong to the APP, not the theme. A
 *   theme layer that pins the server runtime is a theme layer nobody can reuse.
 *   (Verde Watch's own settings — `ssr:false`, `nitropack@2.13.4` pinned,
 *   `NITRO_SSL_CERT`/`NITRO_SSL_KEY` — live in the app's config. See
 *   `docs/arch/08-portal.md`.)
 * - `@nuxtjs/color-mode`: the system is dark-only by design.
 * - Tailwind, Nuxt UI v4: out by decision. The tokens rule. See ADR-181.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  // Gives the consumer the `#layers/neon-grid` alias and names the layer in
  // build output / devtools.
  $meta: { name: 'neon-grid' },

  /**
   * Explicit alias so app code and Nitro handlers can both reach the token
   * module without depending on layer-alias resolution details:
   *   import { NEON, SPECTRUM } from '#neon-grid/shared/tokens'
   * `useNeonTokens()` is the auto-imported alternative for app code.
   */
  alias: {
    '#neon-grid': here,
  },

  // Fully-resolved. Layer `css` entries land BEFORE the app's own, so the app
  // can always override.
  css: [join(here, 'app', 'assets', 'css', 'index.css')],

  modules: ['@nuxt/icon'],

  icon: {
    // Inline SVG, no runtime API call. `clientBundle.scan` walks the source for
    // <Icon name="..."> and bakes only those icons in — the console must work
    // with the internet down, so nothing may resolve an icon over the network.
    mode: 'svg',
    clientBundle: { scan: true, sizeLimitKb: 512 },
    // `@iconify-json/ph` is a dependency of this layer, so `ph:*` resolves
    // offline. Consumers adding other collections install their own json packs.
    serverBundle: false,
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
        // Defaults. `plugins/ng-glow.client.ts` + the pre-paint script below
        // replace these from localStorage before first paint.
        'data-glow': 'soft',
        'data-contrast': 'normal',
      },
      // ── NO FONT PRELOADS HERE, DELIBERATELY ────────────────────────────────
      // `public/fonts/*.woff2` is gitignored and populated only by the opt-in
      // `npm run fonts`. A layer-level <link rel="preload"> is emitted on every
      // page of every consuming app whether or not that step was ever run — so
      // on a fresh clone it is two guaranteed 404s and two console warnings per
      // page load, silently, for a file the `@font-face` rules in 05-fonts.css
      // already degrade from gracefully.
      //
      // An app that HAS run `npm run fonts` and wants the preload should add it
      // in its own nuxt.config, where the files are known to exist:
      //   app: { head: { link: [
      //     { rel:'preload', as:'font', type:'font/woff2',
      //       href:'/fonts/orbitron-variable.woff2', crossorigin:'anonymous' },
      //   ] } }
      link: [],
      script: [
        {
          // Pre-paint attribute restore. Without this the page renders one frame
          // at the default glow level and then snaps — on a page made of glowing
          // panels that flash is very visible. Kept dependency-free and tiny.
          key: 'ng-glow-preboot',
          innerHTML:
            'try{var d=document.documentElement,g=localStorage.getItem("ng-glow"),c=localStorage.getItem("ng-contrast");' +
            'if(g==="full"||g==="soft"||g==="off")d.setAttribute("data-glow",g);' +
            'if(c==="high"||c==="normal")d.setAttribute("data-contrast",c);' +
            'var t=localStorage.getItem("ng-transcript-size");if(t)d.style.setProperty("--transcript-size",t);}catch(e){}',
          tagPosition: 'head',
        },
      ],
    },
  },

  // Keep the theme's own SFCs out of the consumer's `experimental` surface.
  // Nothing here changes app behaviour; it only guarantees the CSS ordering the
  // cascade layers depend on.
  vite: {
    css: {
      // Vite/postcss-import inlines the @imports in index.css. Each partial
      // wraps its own rules in `@layer neon.*` so import order cannot break the
      // cascade even if a bundler reorders them.
      devSourcemap: true,
    },
  },
})
